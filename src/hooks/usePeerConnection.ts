import { useEffect, useRef, useCallback } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { createPeer } from '@/libs/peerConfig';
import { useChatStore } from '@/store/chatStore';
import { DataChannelMessage, DataChannelMessageType, Message, MessageType } from '@/types';

/**
 * WebRTC Peer 连接管理 Hook
 */
export const usePeerConnection = (roomId: string, userId: string, username: string) => {
  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  
  const { addMessage, addPeer, removePeer, updateConnectionStatus } = useChatStore();

  // 发送数据到所有连接的 peer
  const broadcast = useCallback((message: DataChannelMessage) => {
    connectionsRef.current.forEach((conn) => {
      if (conn.open) {
        try {
          conn.send(message);
        } catch (error) {
          console.error('Failed to send message:', error);
        }
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
      console.log('Connection opened with:', peerId);
      connectionsRef.current.set(peerId, conn);
      updateConnectionStatus(peerId, 'connected');
      
      // 发送自己的用户信息
      conn.send({
        type: DataChannelMessageType.USER_INFO,
        payload: { id: userId, username },
      });
    });

    conn.on('data', (data) => {
      handleData(data, peerId);
    });

    conn.on('close', () => {
      console.log('Connection closed with:', peerId);
      connectionsRef.current.delete(peerId);
      removePeer(peerId);
    });

    conn.on('error', (error) => {
      console.error('Connection error with:', peerId, error);
      updateConnectionStatus(peerId, 'failed');
    });
  }, [userId, username, handleData, removePeer, updateConnectionStatus]);

  // 连接到其他 peer
  const connectToPeer = useCallback((targetPeerId: string) => {
    if (!peerRef.current) return;
    
    // 避免重复连接
    if (connectionsRef.current.has(targetPeerId)) {
      console.log('Already connected to:', targetPeerId);
      return;
    }

    console.log('Connecting to:', targetPeerId);
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

  // 初始化 Peer
  useEffect(() => {
    const peerId = `${roomId}_${userId}`;
    const peer = createPeer(peerId);
    peerRef.current = peer;

    peer.on('open', (id) => {
      console.log('My peer ID is:', id);
    });

    peer.on('connection', (conn) => {
      console.log('Incoming connection from:', conn.peer);
      setupConnection(conn);
    });

    peer.on('error', (error) => {
      console.error('Peer error:', error);
    });

    // 清理函数
    return () => {
      connectionsRef.current.forEach((conn) => {
        conn.close();
      });
      connectionsRef.current.clear();
      
      if (peer) {
        peer.destroy();
      }
    };
  }, [roomId, userId, setupConnection]);

  return {
    peer: peerRef.current,
    connectToPeer,
    sendMessage,
    broadcast,
  };
};

