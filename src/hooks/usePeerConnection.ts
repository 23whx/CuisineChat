import { useEffect, useRef, useCallback } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { createPeer } from '@/libs/peerConfig';
import { RoomSignalingManager } from '@/libs/roomSignaling';
import { useChatStore } from '@/store/chatStore';
import { DataChannelMessage, DataChannelMessageType, Message, MessageType } from '@/types';

/**
 * WebRTC Peer 连接管理 Hook
 */
export const usePeerConnection = (roomId: string, password: string, userId: string, username: string, avatarSeed: string) => {
  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const signalingRef = useRef<RoomSignalingManager | null>(null);
  const userInfoRef = useRef({ userId, username, avatarSeed });
  
  // 更新 user info ref
  useEffect(() => {
    userInfoRef.current = { userId, username, avatarSeed };
  }, [userId, username, avatarSeed]);
  
  const { addMessage, addPeer, removePeer, updateConnectionStatus, currentUser } = useChatStore();

  // 发送数据到所有连接的 peer
  const broadcast = useCallback((message: DataChannelMessage) => {
    console.log('[聊天] 广播消息到所有连接，类型 =', message.type);
    connectionsRef.current.forEach((conn, pid) => {
      if (conn.open) {
        try {
          console.log('[聊天] -> 发送到', pid);
          conn.send(message);
        } catch (error) {
          console.error('[聊天] 发送失败：', pid, error);
        }
      } else {
        console.warn('[聊天] 连接未打开，跳过：', pid);
      }
    });
  }, []);

  // 处理接收到的数据
  const handleData = useCallback((data: any, peerId: string) => {
    try {
      const message = data as DataChannelMessage;
      
      switch (message.type) {
        case DataChannelMessageType.USER_INFO:
          // 处理用户信息
          addPeer(peerId, message.payload);
          break;
          
        case DataChannelMessageType.MESSAGE:
          // 处理聊天消息
          addMessage(message.payload as Message);
          break;
          
        case DataChannelMessageType.PING:
          // 响应 ping
          const conn = connectionsRef.current.get(peerId);
          if (conn?.open) {
            conn.send({ type: DataChannelMessageType.PONG, payload: {} });
          }
          break;
          
        case DataChannelMessageType.PONG:
          // 收到 pong 响应
          updateConnectionStatus(peerId, 'connected');
          break;
      }
    } catch (error) {
      console.error('Failed to handle data:', error);
    }
  }, [addMessage, addPeer, updateConnectionStatus]);

  // 设置连接事件监听
  const setupConnection = useCallback((conn: DataConnection) => {
    const peerId = conn.peer;
    
    conn.on('open', () => {
      console.log('[聊天] 与对等方连接已打开：', peerId);
      connectionsRef.current.set(peerId, conn);
      updateConnectionStatus(peerId, 'connected');
      
      // 发送自己的用户信息
      const { userId: uid, username: uname, avatarSeed: seed } = userInfoRef.current;
      conn.send({
        type: DataChannelMessageType.USER_INFO,
        payload: { id: uid, username: uname, avatarSeed: seed },
      });
    });

    conn.on('data', (data) => {
      handleData(data, peerId);
    });

    conn.on('close', () => {
      console.log('[聊天] 与对等方连接已关闭：', peerId);
      connectionsRef.current.delete(peerId);
      removePeer(peerId);
    });

    conn.on('error', (error) => {
      console.error('[聊天] 与对等方连接错误：', peerId, error);
      updateConnectionStatus(peerId, 'failed');
    });
  }, [handleData, removePeer, updateConnectionStatus]);

  // 连接到其他 peer
  const connectToPeer = useCallback((targetPeerId: string) => {
    if (!peerRef.current) return;
    
    // 避免重复连接
    if (connectionsRef.current.has(targetPeerId)) {
      console.log('Already connected to:', targetPeerId);
      return;
    }

    console.log('[聊天] 尝试连接到对等方：', targetPeerId);
    updateConnectionStatus(targetPeerId, 'connecting');
    
    const conn = peerRef.current.connect(targetPeerId, {
      reliable: true,
    });
    
    setupConnection(conn);
  }, [setupConnection, updateConnectionStatus]);

  // 发送消息
  const sendMessage = useCallback((message: Message) => {
    broadcast({
      type: DataChannelMessageType.MESSAGE,
      payload: message,
    });
    
    // 也添加到本地
    addMessage(message);
  }, [broadcast, addMessage]);

  // 初始化 Peer 和房间信令
  useEffect(() => {
    let mounted = true;
    
    const initPeerAndSignaling = async () => {
      // 创建一个随机的 peer ID（不再基于房间 ID）
      const peer = createPeer();
      peerRef.current = peer;

      peer.on('open', async (id) => {
      console.log('[聊天] 我的 PeerID =', id);
        
        if (!mounted) return;

        const { userId: uid, username: uname, avatarSeed: seed } = userInfoRef.current;
        
        // 初始化房间信令
        const signaling = new RoomSignalingManager(
          peer,
          roomId,
          password,
          uid,
          uname,
          seed,
          (discoveredPeerId: string) => {
            console.log('Discovered peer through signaling:', discoveredPeerId);
            connectToPeer(discoveredPeerId);
          }
        );
        
        signalingRef.current = signaling;
        
        try {
          await signaling.start();
          console.log('Room signaling started successfully');
        } catch (error) {
          console.error('Failed to start room signaling:', error);
        }
      });

      peer.on('connection', (conn) => {
        console.log('[聊天] 收到来自对等方的连接：', conn.peer);
        setupConnection(conn);
      });

      peer.on('error', (error) => {
        console.error('[聊天] Peer 实例错误：', error);
      });
    };

    initPeerAndSignaling();

    // 清理函数
    return () => {
      mounted = false;
      
      if (signalingRef.current) {
        signalingRef.current.stop();
        signalingRef.current = null;
      }
      
      connectionsRef.current.forEach((conn) => {
        conn.close();
      });
      connectionsRef.current.clear();
      
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    };
  }, [roomId, password, setupConnection, connectToPeer]);

  return {
    peer: peerRef.current,
    connectToPeer,
    sendMessage,
    broadcast,
  };
};

