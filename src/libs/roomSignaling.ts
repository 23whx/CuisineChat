/**
 * 简化的房间信令服务
 * 策略：第一个进入房间的用户会尝试创建一个 "房间 hub" peer
 * 后续用户连接到这个 hub，hub 会告诉他们房间里还有谁
 */

import Peer, { DataConnection } from 'peerjs';
import { createPeer } from './peerConfig';

interface RoomHubMessage {
  type: 'join' | 'peer_list' | 'peer_joined' | 'relay';
  peerId?: string;
  peers?: string[];
  userId?: string;
  username?: string;
  avatarSeed?: string;
  data?: any;
}

/**
 * 房间信令管理器
 */
export class RoomSignalingManager {
  private hubPeerId: string;
  private isHub: boolean = false;
  private hubPeer: Peer | null = null;
  private hubConn: DataConnection | null = null;
  private hubConnections: Map<string, DataConnection> = new Map();
  private onPeerDiscovered: (peerId: string) => void;
  private roomPeers: Map<string, { userId: string; username: string; avatarSeed: string }> = new Map();
  private clientPeer: Peer;

  constructor(
    clientPeer: Peer,
    private roomId: string,
    private password: string,
    private userId: string,
    private username: string,
    private avatarSeed: string,
    onPeerDiscovered: (peerId: string) => void
  ) {
    this.clientPeer = clientPeer;
    this.onPeerDiscovered = onPeerDiscovered;
    // 使用房间 ID 和密码的组合创建确定性的 hub peer ID
    this.hubPeerId = `hub_${roomId}_${password}`;
  }

  /**
   * 启动信令
   */
  async start(): Promise<void> {
    console.log('Starting room signaling, hub ID:', this.hubPeerId);

    // 尝试成为 hub
    try {
      this.hubPeer = createPeer(this.hubPeerId);
      
      await new Promise<void>((resolve, reject) => {
        if (!this.hubPeer) {
          reject(new Error('Failed to create hub peer'));
          return;
        }

        this.hubPeer.on('open', (id) => {
          console.log('Successfully became room hub:', id);
          this.isHub = true;
          
          // Hub 自己也要加入房间列表（使用 clientPeer 的 ID）
          if (this.clientPeer.id) {
            this.roomPeers.set(this.clientPeer.id, {
              userId: this.userId,
              username: this.username,
              avatarSeed: this.avatarSeed,
            });
            console.log('Hub: Added self to room peers:', this.clientPeer.id);
          }
          
          this.setupHubListeners();
          resolve();
        });

        this.hubPeer.on('error', (error: any) => {
          console.log('Cannot become hub (already exists):', error.type);
          if (error.type === 'unavailable-id') {
            // Hub 已存在，作为普通客户端连接
            reject(error);
          }
        });

        // 超时处理
        setTimeout(() => reject(new Error('Hub creation timeout')), 5000);
      });
    } catch (error) {
      console.log('Joining existing hub as client');
      this.isHub = false;
      await this.connectToHub();
    }
  }

  /**
   * 设置 Hub 监听器
   */
  private setupHubListeners() {
    if (!this.hubPeer) return;

    this.hubPeer.on('connection', (conn) => {
      console.log('Hub: New connection from', conn.peer);
      
      conn.on('open', () => {
        this.hubConnections.set(conn.peer, conn);

        // 先将新用户添加到房间列表（使用默认信息，后续 join 消息会更新）
        this.roomPeers.set(conn.peer, {
          userId: conn.peer,
          username: 'Unknown',
          avatarSeed: conn.peer,
        });

        // 发送当前房间内的所有 peers（不包括新加入的这个）
        const peers = Array.from(this.roomPeers.keys()).filter(p => p !== conn.peer);
        conn.send({
          type: 'peer_list',
          peers,
        } as RoomHubMessage);

        console.log('Hub: Sent peer list to', conn.peer, ':', peers);

        // 通知其他人有新 peer 加入
        this.broadcastFromHub({
          type: 'peer_joined',
          peerId: conn.peer,
        }, conn.peer);
      });

      conn.on('data', (data: any) => {
        const msg = data as RoomHubMessage;
        
        if (msg.type === 'join') {
          // 记录新用户信息
          if (conn.peer && msg.userId && msg.username && msg.avatarSeed) {
            this.roomPeers.set(conn.peer, {
              userId: msg.userId,
              username: msg.username,
              avatarSeed: msg.avatarSeed,
            });
          }
        }
      });

      conn.on('close', () => {
        console.log('Hub: Connection closed with', conn.peer);
        this.hubConnections.delete(conn.peer);
        this.roomPeers.delete(conn.peer);
        
        // 通知其他人有 peer 离开
        this.broadcastFromHub({
          type: 'peer_left',
          peerId: conn.peer,
        });
      });
    });
  }

  /**
   * 连接到 Hub
   */
  private async connectToHub(): Promise<void> {
    return new Promise((resolve, reject) => {
      const myPeerId = this.clientPeer.id;
      if (!myPeerId) {
        reject(new Error('Client peer not opened'));
        return;
      }

      console.log('My peer ID:', myPeerId, 'connecting to hub:', this.hubPeerId);
      const conn = this.clientPeer.connect(this.hubPeerId, {
        reliable: true,
        metadata: {
          userId: this.userId,
          username: this.username,
          avatarSeed: this.avatarSeed,
        },
      });

      conn.on('open', () => {
        console.log('Connected to hub');
        this.hubConn = conn;

        // 发送加入消息，告知 hub 我们用于聊天的 peerId（即 clientPeer.id）
        conn.send({
          type: 'join',
          peerId: myPeerId,
          userId: this.userId,
          username: this.username,
          avatarSeed: this.avatarSeed,
        } as RoomHubMessage);

        resolve();
      });

      conn.on('data', (data: any) => {
        const msg = data as RoomHubMessage;
        
        if (msg.type === 'peer_list' && msg.peers) {
          console.log('Received peer list from hub:', msg.peers);
          msg.peers.forEach(peerId => {
            if (peerId !== myPeerId) {
              this.onPeerDiscovered(peerId);
            }
          });
        } else if (msg.type === 'peer_joined' && msg.peerId) {
          console.log('New peer joined:', msg.peerId);
          if (msg.peerId !== myPeerId) {
            this.onPeerDiscovered(msg.peerId);
          }
        } else if (msg.type === 'peer_left' && msg.peerId) {
          // 可选：处理用户离开
          console.log('Peer left:', msg.peerId);
        }
      });

      conn.on('error', (error) => {
        console.error('Hub connection error:', error);
        reject(error);
      });

      conn.on('close', () => {
        console.log('Hub connection closed');
      });

      setTimeout(() => reject(new Error('Hub connection timeout')), 10000);
    });
  }

  /**
   * 从 Hub 广播消息
   */
  private broadcastFromHub(message: RoomHubMessage, excludePeerId?: string) {
    this.hubConnections.forEach((conn, peerId) => {
      if (peerId !== excludePeerId && conn.open) {
        try {
          conn.send(message);
        } catch (error) {
          console.error('Failed to broadcast to', peerId, error);
        }
      }
    });
  }

  /**
   * 停止信令
   */
  stop() {
    if (this.hubConn) {
      this.hubConn.close();
      this.hubConn = null;
    }

    if (this.hubPeer) {
      this.hubConnections.forEach(conn => conn.close());
      this.hubConnections.clear();
      this.hubPeer.destroy();
      this.hubPeer = null;
    }

    this.roomPeers.clear();
  }
}

