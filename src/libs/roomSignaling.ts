/**
 * 简化的房间信令服务 v3
 * 策略：使用 "房间信标" 进行成员发现
 * - 第一个进入房间的用户额外注册一个以房间号+密码派生 ID 的 "信标 Peer"
 * - 后来者连接信标，拿到当前成员列表，再由后来者主动与每个成员建立 P2P 连接
 *   （只由加入方发起，避免双方同时互连造成重复连接）
 * - 信标持有者离开后，其余成员会重新竞选信标，并把已知成员带入新信标，避免房间分裂
 */

import Peer, { DataConnection } from 'peerjs';
import { createPeer } from './peerConfig';
import { watchConnection } from './heartbeat';
import { hashString } from '@/utils/hash';

interface BeaconMessage {
  type: 'peer_list';
  peers: string[];
}

const BEACON_OPEN_TIMEOUT = 5000;
const BEACON_JOIN_TIMEOUT = 10000;
const MAX_START_ATTEMPTS = 5;

/**
 * 由房间号和密码派生信标 ID。
 * PeerJS 只接受 [A-Za-z0-9] 及 `_- ` 分隔符，房间号里的中文/符号会导致 invalid-id，
 * 因此使用哈希；同时加上应用前缀，避免在公共 PeerJS 服务器上与其他应用冲突。
 */
export const getBeaconPeerId = (roomId: string, password: string): string => {
  const key = `${roomId}\u0000${password}`;
  return `cuisinechat-beacon-${hashString(key, 1)}${hashString(key, 2)}`;
};

const delay = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/**
 * 房间信令管理器
 */
export class RoomSignalingManager {
  private readonly beaconPeerId: string;
  private beaconPeer: Peer | null = null;
  private beaconConnections: Map<string, DataConnection> = new Map();
  private clientConnection: DataConnection | null = null;
  private roomPeers: Set<string> = new Set();
  private stopped = false;
  private restartTimer: number | null = null;

  constructor(
    private clientPeer: Peer,
    roomId: string,
    password: string,
    private onPeerDiscovered: (peerId: string) => void,
    /** 当前已建立连接的成员，用于信标重新选举后补全成员列表 */
    private getKnownPeers: () => string[]
  ) {
    this.beaconPeerId = getBeaconPeerId(roomId, password);
  }

  private get myPeerId(): string {
    return this.clientPeer.id;
  }

  /**
   * 启动信令：优先成为信标，信标已存在则作为普通节点加入
   */
  async start(): Promise<void> {
    for (let attempt = 1; attempt <= MAX_START_ATTEMPTS && !this.stopped; attempt++) {
      console.log(`[信令] 启动（第 ${attempt} 次），信标 ID =`, this.beaconPeerId, '我的 ID =', this.myPeerId);
      try {
        await this.tryBecomeBeacon();
        return;
      } catch (error) {
        if ((error as { type?: string })?.type !== 'unavailable-id') {
          console.warn('[信令] 成为信标失败：', error);
        }
      }
      if (this.stopped) return;

      try {
        await this.joinAsClient();
        return;
      } catch (error) {
        console.warn('[信令] 加入信标失败：', error);
      }

      // 信标可能刚好下线，随机退避后重新竞选
      await delay(500 + Math.random() * 1000 * attempt);
    }
    if (!this.stopped) {
      throw new Error('房间信令启动失败');
    }
  }

  /**
   * 尝试成为信标
   */
  private tryBecomeBeacon(): Promise<void> {
    return new Promise((resolve, reject) => {
      const beacon = createPeer(this.beaconPeerId);
      this.beaconPeer = beacon;
      let settled = false;

      const fail = (error: unknown) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        beacon.destroy();
        if (this.beaconPeer === beacon) this.beaconPeer = null;
        reject(error);
      };

      const timeout = window.setTimeout(() => fail(new Error('成为信标超时')), BEACON_OPEN_TIMEOUT);

      beacon.on('open', () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        if (this.stopped) {
          beacon.destroy();
          resolve();
          return;
        }
        console.log('[信令][信标] 成为房间信标成功');

        // 自己以及已经连上的成员（信标重新选举时）都属于房间
        this.roomPeers = new Set([this.myPeerId, ...this.getKnownPeers()]);
        this.setupBeaconListeners(beacon);
        resolve();
      });

      // 任何错误都要结束 Promise（之前只处理 unavailable-id，其他错误会永远挂起）
      beacon.on('error', (error) => fail(error));
    });
  }

  /**
   * 设置信标监听器
   */
  private setupBeaconListeners(beacon: Peer) {
    beacon.on('connection', (conn) => {
      conn.on('open', () => {
        this.beaconConnections.set(conn.peer, conn);
        this.roomPeers.add(conn.peer);
        watchConnection(conn); // 及时清理已崩溃成员，避免把失效 ID 发给新人
        console.log('[信令][信标] 新成员加入，当前成员：', Array.from(this.roomPeers));

        // 发送房间成员列表（排除请求者自己），由新成员主动发起 P2P 连接
        const peers = Array.from(this.roomPeers).filter((p) => p !== conn.peer);
        conn.send({ type: 'peer_list', peers } satisfies BeaconMessage);
      });

      conn.on('close', () => {
        if (this.beaconConnections.get(conn.peer) === conn) {
          this.beaconConnections.delete(conn.peer);
          this.roomPeers.delete(conn.peer);
        }
      });

      conn.on('error', (err) => {
        console.error('[信令][信标] 连接错误：', conn.peer, err);
      });
    });
  }

  /**
   * 作为普通节点加入
   */
  private joinAsClient(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('[信令] 连接到信标：', this.beaconPeerId);

      const conn = this.clientPeer.connect(this.beaconPeerId, { reliable: true });
      let opened = false;
      let failed = false;

      const cleanup = () => {
        window.clearTimeout(timeout);
        this.clientPeer.off('error', onPeerError);
      };

      const fail = (error: unknown) => {
        if (opened || failed) return;
        failed = true;
        cleanup();
        conn.close();
        reject(error);
      };

      const timeout = window.setTimeout(() => fail(new Error('连接信标超时')), BEACON_JOIN_TIMEOUT);

      // peer-unavailable 只会在 Peer 上触发，不会在 DataConnection 上触发，
      // 监听它可以在信标不存在时立即失败，而不是干等超时
      const onPeerError = (error: { type?: string; message?: string }) => {
        if (error?.type === 'peer-unavailable' && error.message?.includes(this.beaconPeerId)) {
          fail(error);
        }
      };
      this.clientPeer.on('error', onPeerError);

      conn.on('open', () => {
        opened = true;
        cleanup();
        this.clientConnection = conn;
        // 信标持有者异常退出时，靠心跳超时触发 close，进而重新竞选信标
        watchConnection(conn);
        console.log('[信令] 已连接到信标');
        resolve();
      });

      conn.on('data', (data) => {
        const msg = data as BeaconMessage;
        if (msg?.type === 'peer_list' && Array.isArray(msg.peers)) {
          console.log('[信令] 收到房间成员列表：', msg.peers);
          msg.peers.forEach((peerId) => {
            if (typeof peerId === 'string' && peerId !== this.myPeerId) {
              this.onPeerDiscovered(peerId);
            }
          });
        }
      });

      conn.on('error', (error) => fail(error));

      conn.on('close', () => {
        if (!opened) {
          fail(new Error('信标连接被关闭'));
          return;
        }
        if (this.clientConnection === conn) this.clientConnection = null;
        console.log('[信令] 与信标的连接已关闭，准备重新竞选信标');
        this.scheduleRestart();
      });
    });
  }

  /**
   * 信标离线后，随机延迟重新启动信令，避免所有成员同时竞争
   */
  private scheduleRestart() {
    if (this.stopped || this.restartTimer !== null) return;
    this.restartTimer = window.setTimeout(() => {
      this.restartTimer = null;
      if (this.stopped) return;
      this.start().catch((error) => console.error('[信令] 重新启动失败：', error));
    }, 300 + Math.random() * 1500);
  }

  /**
   * 成员离开（P2P 连接关闭）时从信标的成员列表中移除。
   * 信标重新选举时成员列表来自本地已知连接，其中可能包含已离线、不会再连接信标的成员。
   */
  forgetPeer(peerId: string) {
    if (!this.beaconConnections.has(peerId)) {
      this.roomPeers.delete(peerId);
    }
  }

  /**
   * 停止信令
   */
  stop() {
    this.stopped = true;
    if (this.restartTimer !== null) {
      window.clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    this.clientConnection?.close();
    this.clientConnection = null;
    this.beaconConnections.forEach((conn) => conn.close());
    this.beaconConnections.clear();
    this.beaconPeer?.destroy();
    this.beaconPeer = null;
    this.roomPeers.clear();
  }
}
