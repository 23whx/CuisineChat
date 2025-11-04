/**
 * 简化的房间信令服务 v2
 * 新策略：使用轻量级的 "发现协议"
 * - 不再创建单独的 Hub Peer
 * - 使用特殊的元数据标记来识别同房间用户
 * - 通过尝试连接预定义的 "房间信标" 来发现其他用户
 */

import Peer, { DataConnection } from 'peerjs';
import { createPeer } from './peerConfig';

interface BeaconMessage {
  type: 'announce' | 'peer_list' | 'relay';
  roomId: string;
  password: string;
  peerId?: string;
  peers?: string[];
  userId?: string;
  username?: string;
  avatarSeed?: string;
}

/**
 * 房间信令管理器 v2
 * 使用信标机制进行房间发现
 */
export class RoomSignalingManager {
  private beaconPeerId: string;
  private isBeacon: boolean = false;
  private beaconPeer: Peer | null = null;
  private beaconConnections: Map<string, DataConnection> = new Map();
  private onPeerDiscovered: (peerId: string) => void;
  private roomPeers: Set<string> = new Set();
  private myPeerId: string;

  constructor(
    private clientPeer: Peer,
    private roomId: string,
    private password: string,
    private userId: string,
    private username: string,
    private avatarSeed: string,
    onPeerDiscovered: (peerId: string) => void
  ) {
    this.onPeerDiscovered = onPeerDiscovered;
    this.myPeerId = clientPeer.id || '';
    // 使用房间 ID 和密码创建信标 ID
    this.beaconPeerId = `beacon_${roomId}_${password}`;
  }

  /**
   * 启动信令
   */
  async start(): Promise<void> {
    console.log('[信令] 启动，信标 ID =', this.beaconPeerId, '我的 ID =', this.myPeerId);

    // 尝试成为信标
    try {
      await this.tryBecomeBeacon();
    } catch (error) {
      console.log('[信令] 以普通节点身份加入');
      await this.joinAsClient();
    }
  }

  /**
   * 尝试成为信标
   */
  private async tryBecomeBeacon(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.beaconPeer = createPeer(this.beaconPeerId);

      const timeout = window.setTimeout(() => {
        reject(new Error('成为信标超时'));
      }, 5000);

      this.beaconPeer.on('open', (id) => {
        window.clearTimeout(timeout);
        console.log('[信令][信标] 成为房间信标成功，ID =', id);
        this.isBeacon = true;
        
        // 将自己加入房间列表
        this.roomPeers.add(this.myPeerId);
        console.log('[信令][信标] 房间成员：', Array.from(this.roomPeers));
        
        this.setupBeaconListeners();
        resolve();
      });

      this.beaconPeer.on('error', (error: any) => {
        window.clearTimeout(timeout);
        if (error.type === 'unavailable-id') {
          console.log('[信令] 信标已存在，作为普通节点加入');
          if (this.beaconPeer) {
            this.beaconPeer.destroy();
            this.beaconPeer = null;
          }
          reject(error);
        }
      });
    });
  }

  /**
   * 设置信标监听器
   */
  private setupBeaconListeners() {
    if (!this.beaconPeer) return;

    this.beaconPeer.on('connection', (conn) => {
      console.log('[信令][信标] 收到连接请求：', conn.peer);

      conn.on('open', () => {
        this.beaconConnections.set(conn.peer, conn);
        
        // 将新成员加入房间
        this.roomPeers.add(conn.peer);
        console.log('[信令][信标] 新成员加入，当前成员：', Array.from(this.roomPeers));
        
        // 发送房间成员列表（排除请求者自己）
        const peers = Array.from(this.roomPeers).filter(p => p !== conn.peer);
        conn.send({
          type: 'peer_list',
          roomId: this.roomId,
          password: this.password,
          peers,
        } as BeaconMessage);
        
        console.log('[信令][信标] 已发送成员列表给', conn.peer, '：', peers);

        // 通知其他成员有新人加入
        this.broadcastToRoom({
          type: 'announce',
          roomId: this.roomId,
          password: this.password,
          peerId: conn.peer,
        }, conn.peer);
      });

      conn.on('close', () => {
        console.log('[信令][信标] 成员离开：', conn.peer);
        this.beaconConnections.delete(conn.peer);
        this.roomPeers.delete(conn.peer);
        console.log('[信令][信标] 当前成员：', Array.from(this.roomPeers));
      });

      conn.on('error', (err) => {
        console.error('[信令][信标] 连接错误：', conn.peer, err);
      });
    });
  }

  /**
   * 作为普通节点加入
   */
  private async joinAsClient(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('[信令] 连接到信标：', this.beaconPeerId);
      
      const conn = this.clientPeer.connect(this.beaconPeerId, {
        reliable: true,
        metadata: {
          roomId: this.roomId,
          password: this.password,
          userId: this.userId,
          username: this.username,
          avatarSeed: this.avatarSeed,
        },
      });

      const timeout = window.setTimeout(() => {
        console.warn('[信令] 连接信标超时');
        try { conn.close(); } catch {}
        reject(new Error('连接信标超时'));
      }, 15000);

      conn.on('open', () => {
        window.clearTimeout(timeout);
        console.log('[信令] 已连接到信标');
        resolve();
      });

      conn.on('data', (data: any) => {
        const msg = data as BeaconMessage;

        if (msg.type === 'peer_list' && msg.peers) {
          console.log('[信令] 收到房间成员列表：', msg.peers);
          msg.peers.forEach(peerId => {
            if (peerId !== this.myPeerId) {
              console.log('[信令] 发现成员：', peerId);
              this.onPeerDiscovered(peerId);
            }
          });
        } else if (msg.type === 'announce' && msg.peerId) {
          console.log('[信令] 新成员加入：', msg.peerId);
          if (msg.peerId !== this.myPeerId) {
            this.onPeerDiscovered(msg.peerId);
          }
        }
      });

      conn.on('error', (error) => {
        window.clearTimeout(timeout);
        console.error('[信令] 连接信标出错：', error);
        reject(error);
      });

      conn.on('close', () => {
        console.log('[信令] 与信标的连接已关闭');
      });
    });
  }

  /**
   * 向房间广播消息
   */
  private broadcastToRoom(message: BeaconMessage, excludePeerId?: string) {
    this.beaconConnections.forEach((conn, peerId) => {
      if (peerId !== excludePeerId && conn.open) {
        try {
          conn.send(message);
        } catch (error) {
          console.error('[信令][信标] 广播失败：', peerId, error);
        }
      }
    });
  }

  /**
   * 停止信令
   */
  stop() {
    if (this.beaconPeer) {
      this.beaconConnections.forEach(conn => {
        try { conn.close(); } catch {}
      });
      this.beaconConnections.clear();
      this.beaconPeer.destroy();
      this.beaconPeer = null;
    }
    this.roomPeers.clear();
  }
}
