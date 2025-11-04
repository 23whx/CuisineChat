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
    console.log('[信令] 启动房间信令，Hub ID =', this.hubPeerId);

    // 尝试成为 hub
    try {
      this.hubPeer = createPeer(this.hubPeerId);
      
      await new Promise<void>((resolve, reject) => {
        if (!this.hubPeer) {
          reject(new Error('Failed to create hub peer'));
          return;
        }

        this.hubPeer.on('open', (id) => {
          console.log('[信令][Hub] 成为房间 Hub 成功，ID =', id);
          this.isHub = true;
          
          // Hub 自己也要加入房间列表（使用 clientPeer 的 ID）
          if (this.clientPeer.id) {
            this.roomPeers.set(this.clientPeer.id, {
              userId: this.userId,
              username: this.username,
              avatarSeed: this.avatarSeed,
            });
            console.log('[信令][Hub] 已将自身加入房间列表：', this.clientPeer.id);
          }
          
          this.setupHubListeners();
          resolve();
        });

        this.hubPeer.on('error', (error: any) => {
          console.log('[信令] 无法成为 Hub（可能已存在）：', error?.type || error);
          if (error.type === 'unavailable-id') {
            // Hub 已存在，作为普通客户端连接
            reject(error);
          }
        });

        // 超时处理
        setTimeout(() => reject(new Error('Hub creation timeout')), 5000);
      });
    } catch (error) {
      console.log('[信令] 以客户端身份加入已存在的 Hub');
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
      console.log('[信令][Hub] 收到连接：来自', conn.peer);
      
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

        console.log('[信令][Hub] 已发送房间内 peers 给', conn.peer, '：', peers);

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
            console.log('[信令][Hub] 新用户完成注册：', conn.peer, msg.username);
          }
        }
      });

      conn.on('close', () => {
        console.log('[信令][Hub] 连接关闭：', conn.peer);
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
    const tryConnect = (attempt: number): Promise<void> => {
      return new Promise((resolve, reject) => {
        const myPeerId = this.clientPeer.id;
        if (!myPeerId) {
          reject(new Error('[信令] 客户端 Peer 尚未打开，无法连接 Hub'));
          return;
        }

        console.log(`[信令] [尝试 ${attempt}] 我的 PeerID = ${myPeerId}，连接 Hub = ${this.hubPeerId}`);
        const conn = this.clientPeer.connect(this.hubPeerId, {
          reliable: true,
          metadata: {
            userId: this.userId,
            username: this.username,
            avatarSeed: this.avatarSeed,
          },
        });

        let timeoutId = window.setTimeout(() => {
          console.warn(`[信令] 连接 Hub 超时（尝试 ${attempt}）`);
          try { conn.close(); } catch {}
          reject(new Error('Hub connection timeout'));
        }, 20000);

        conn.on('open', () => {
          window.clearTimeout(timeoutId);
          console.log('[信令] 已连接 Hub');
          this.hubConn = conn;
  
          // 发送加入消息
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
            console.log('[信令] 收到 Hub 返回的房间 peers：', msg.peers);
            msg.peers.forEach(peerId => {
              if (peerId !== myPeerId) {
                console.log('[信令] 发现对等方：', peerId);
                this.onPeerDiscovered(peerId);
              }
            });
          } else if (msg.type === 'peer_joined' && msg.peerId) {
            console.log('[信令] 有新用户加入：', msg.peerId);
            if (msg.peerId !== myPeerId) {
              this.onPeerDiscovered(msg.peerId);
            }
          } else if (msg.type === 'peer_left' && msg.peerId) {
            console.log('[信令] 有用户离开：', msg.peerId);
          }
        });

        conn.on('error', (error) => {
          window.clearTimeout(timeoutId);
          console.error('[信令] 连接 Hub 出错：', error);
          reject(error);
        });

        conn.on('close', () => {
          window.clearTimeout(timeoutId);
          console.log('[信令] 与 Hub 的连接已关闭');
        });
      });
    };

    // 重试 3 次，并在失败后指数退避
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await tryConnect(attempt);
        return;
      } catch (err) {
        console.warn(`[信令] 第 ${attempt} 次连接 Hub 失败：`, err);
        if (attempt < 3) {
          const waitMs = 1000 * Math.pow(2, attempt - 1);
          await new Promise(r => setTimeout(r, waitMs));
        }
      }
    }
    throw new Error('[信令] 多次尝试后无法连接到 Hub');
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

