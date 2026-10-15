import { useEffect, useRef, useCallback } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { createPeer } from '@/libs/peerConfig';
import { RoomSignalingManager } from '@/libs/roomSignaling';
import { watchConnection } from '@/libs/heartbeat';
import { useChatStore } from '@/store/chatStore';
import { ConnectionStatus, DataChannelMessage, DataChannelMessageType, Message, MessageType } from '@/types';

const CONNECT_TIMEOUT = 10000;
const MAX_RETRIES = 3;
const MESSAGE_TYPES = new Set<string>(Object.values(MessageType));

/**
 * 对端数据不可信：只接受结构完整的消息
 */
const isValidMessage = (payload: unknown): payload is Message => {
  const m = payload as Partial<Message> | null;
  return (
    !!m &&
    typeof m.id === 'string' &&
    typeof m.senderId === 'string' &&
    typeof m.senderName === 'string' &&
    typeof m.timestamp === 'number' &&
    typeof m.type === 'string' &&
    MESSAGE_TYPES.has(m.type)
  );
};

/**
 * WebRTC Peer 连接管理 Hook
 */
export const usePeerConnection = (roomId: string, password: string, userId: string, username: string, avatarSeed: string) => {
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const userInfoRef = useRef({ userId, username, avatarSeed });

  // 发送数据到所有连接的 peer
  const broadcast = useCallback((message: DataChannelMessage) => {
    connectionsRef.current.forEach((conn, pid) => {
      if (!conn.open) return;
      try {
        conn.send(message);
      } catch (error) {
        console.error('[聊天] 发送失败：', pid, error);
      }
    });
  }, []);

  // 用户信息变化（例如在设置中改名）时同步给所有成员
  useEffect(() => {
    userInfoRef.current = { userId, username, avatarSeed };
    broadcast({
      type: DataChannelMessageType.USER_INFO,
      payload: { id: userId, username, avatarSeed },
    });
  }, [userId, username, avatarSeed, broadcast]);

  // 初始化 Peer 和房间信令
  useEffect(() => {
    // 刷新页面后房间密码会丢失，此时页面马上会跳回首页，不要创建无用的连接
    if (!roomId || !password || !userId) return;

    let disposed = false;
    const { upsertPeer, removePeer, addMessage, updateConnectionStatus } = useChatStore.getState();
    const peer: Peer = createPeer();
    const connections = new Map<string, DataConnection>();
    connectionsRef.current = connections;
    const pending = new Map<string, { conn: DataConnection; timer: number }>();
    const retries = new Map<string, number>();
    const outgoing = new WeakSet<DataConnection>();
    const retryTimers = new Set<number>();
    let signaling: RoomSignalingManager | null = null;

    const sendUserInfo = (conn: DataConnection) => {
      const { userId: id, username: name, avatarSeed: seed } = userInfoRef.current;
      conn.send({
        type: DataChannelMessageType.USER_INFO,
        payload: { id, username: name, avatarSeed: seed },
      } satisfies DataChannelMessage);
    };

    const handleData = (data: unknown, remoteId: string) => {
      const message = data as DataChannelMessage | null;
      if (!message || typeof message !== 'object') return;

      switch (message.type) {
        case DataChannelMessageType.USER_INFO: {
          const info = message.payload;
          if (info && typeof info.id === 'string' && typeof info.username === 'string') {
            const name = info.username.slice(0, 30);
            upsertPeer(remoteId, {
              id: info.id,
              username: name,
              avatarSeed: typeof info.avatarSeed === 'string' ? info.avatarSeed : name,
            });
          }
          break;
        }

        case DataChannelMessageType.MESSAGE: {
          const payload = message.payload;
          // 自己的消息不会经由他人转发，冒用本人 ID 的消息直接丢弃
          if (isValidMessage(payload) && payload.senderId !== userInfoRef.current.userId) {
            addMessage(payload);
          }
          break;
        }

        case DataChannelMessageType.PONG:
          updateConnectionStatus(remoteId, ConnectionStatus.CONNECTED);
          break;
      }
    };

    /** 取消等待中的连接，返回它是否确实处于等待状态 */
    const clearPending = (remoteId: string, conn: DataConnection): boolean => {
      const entry = pending.get(remoteId);
      if (!entry || entry.conn !== conn) return false;
      window.clearTimeout(entry.timer);
      pending.delete(remoteId);
      return true;
    };

    const scheduleRetry = (remoteId: string) => {
      if (disposed || connections.has(remoteId)) return;
      const attempt = retries.get(remoteId) ?? 0;
      if (attempt >= MAX_RETRIES) {
        console.error('[聊天] 重试次数已达上限，放弃连接：', remoteId);
        retries.delete(remoteId);
        return;
      }
      retries.set(remoteId, attempt + 1);
      const delay = 1000 * 2 ** attempt;
      console.warn(`[聊天] 第 ${attempt + 1} 次重试，延迟 ${delay}ms：`, remoteId);
      const timer = window.setTimeout(() => {
        retryTimers.delete(timer);
        connectToPeer(remoteId);
      }, delay);
      retryTimers.add(timer);
    };

    // 设置连接事件监听
    const setupConnection = (conn: DataConnection) => {
      const remoteId = conn.peer;

      conn.on('open', () => {
        clearPending(remoteId, conn);
        if (disposed) {
          conn.close();
          return;
        }

        const existing = connections.get(remoteId);
        if (existing && existing !== conn && existing.open) {
          // 双方同时发起连接时，两端都保留由 ID 较小一方发起的那条，保证结果一致
          const initiator = outgoing.has(conn) ? peer.id : remoteId;
          const preferred = peer.id < remoteId ? peer.id : remoteId;
          if (initiator !== preferred) {
            conn.close();
            return;
          }
          connections.set(remoteId, conn);
          existing.close();
        } else {
          connections.set(remoteId, conn);
        }

        console.log('[聊天] 与对等方连接已打开：', remoteId);
        retries.delete(remoteId);
        watchConnection(conn); // PING/PONG 由心跳模块处理
        sendUserInfo(conn);
      });

      conn.on('data', (data) => handleData(data, remoteId));

      conn.on('close', () => {
        // 尚未打开就被关闭（如 ICE 协商失败）时重试
        if (clearPending(remoteId, conn)) {
          scheduleRetry(remoteId);
          return;
        }
        // 只有当前使用的连接关闭才算对方离开（被替换掉的重复连接不算）
        if (connections.get(remoteId) === conn) {
          console.log('[聊天] 与对等方连接已关闭：', remoteId);
          connections.delete(remoteId);
          removePeer(remoteId);
          signaling?.forgetPeer(remoteId);
        }
      });

      conn.on('error', (error) => {
        console.error('[聊天] 与对等方连接错误：', remoteId, error);
      });
    };

    // 连接到其他 peer
    function connectToPeer(remoteId: string) {
      if (disposed || remoteId === peer.id || connections.has(remoteId) || pending.has(remoteId)) return;

      console.log('[聊天] 尝试连接到对等方：', remoteId);
      const conn = peer.connect(remoteId, { reliable: true });
      outgoing.add(conn);

      // 对方不存在时 PeerJS 只在 Peer 上报 peer-unavailable，连接本身不会报错也不会关闭，
      // 因此用超时兜底，避免该成员永远卡在 "连接中"
      const timer = window.setTimeout(() => {
        if (clearPending(remoteId, conn)) {
          conn.close();
          scheduleRetry(remoteId);
        }
      }, CONNECT_TIMEOUT);
      pending.set(remoteId, { conn, timer });

      setupConnection(conn);
    }

    peer.on('error', (error) => {
      if (error.type !== 'peer-unavailable') return;
      // 错误信息形如 "Could not connect to peer <id>"
      pending.forEach(({ conn }, remoteId) => {
        if (error.message.includes(remoteId) && clearPending(remoteId, conn)) {
          conn.close();
          scheduleRetry(remoteId);
        }
      });
    });

    peer.on('open', (id) => {
      if (disposed || signaling) return; // 断线重连后也会再次触发 open
      console.log('[聊天] 我的 PeerID =', id);

      signaling = new RoomSignalingManager(
        peer,
        roomId,
        password,
        (discoveredPeerId) => {
          retries.delete(discoveredPeerId);
          connectToPeer(discoveredPeerId);
        },
        () => Array.from(connections.keys())
      );
      signaling.start().catch((error) => console.error('[聊天] 房间信令启动失败：', error));
    });

    peer.on('connection', (conn) => {
      console.log('[聊天] 收到来自对等方的连接：', conn.peer);
      setupConnection(conn);
    });

    // 关闭/刷新标签页时立即断开，让其他成员马上感知到离开，而不是等心跳超时
    const handlePageHide = () => peer.destroy();
    window.addEventListener('pagehide', handlePageHide);

    // 清理函数
    return () => {
      disposed = true;
      window.removeEventListener('pagehide', handlePageHide);
      signaling?.stop();
      retryTimers.forEach((t) => window.clearTimeout(t));
      pending.forEach(({ conn, timer }) => {
        window.clearTimeout(timer);
        conn.close();
      });
      pending.clear();
      connections.forEach((conn) => conn.close());
      connections.clear();
      peer.destroy();
    };
  }, [roomId, password, userId]);

  // 发送消息
  const sendMessage = useCallback((message: Message) => {
    broadcast({
      type: DataChannelMessageType.MESSAGE,
      payload: message,
    });

    // 也添加到本地
    useChatStore.getState().addMessage(message);
  }, [broadcast]);

  return {
    sendMessage,
    broadcast,
  };
};
