import Peer from 'peerjs';

// 从环境变量获取配置（提供合理的默认值）
const PEER_SECURE = (import.meta.env.VITE_PEER_SECURE ?? 'true') === 'true';
const PEER_HOST = import.meta.env.VITE_PEER_HOST || '0.peerjs.com';
const PEER_PORT = parseInt(import.meta.env.VITE_PEER_PORT || '443');
// 公开的 PeerJS 云默认 path 是 /peerjs
const PEER_PATH = import.meta.env.VITE_PEER_PATH || '/peerjs';

// ICE 服务器配置（默认包含 STUN + 公共 TURN）
// 如果需要自定义，请在环境变量中提供 JSON 字符串 VITE_ICE_SERVERS_JSON
const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  // 公共 TURN（OpenRelay），在复杂 NAT 场景下也能连通
  { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelay' },
  { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelay' },
  { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelay' },
];

let ICE_SERVERS: RTCIceServer[] = DEFAULT_ICE_SERVERS;
try {
  const raw = import.meta.env.VITE_ICE_SERVERS_JSON as string | undefined;
  if (raw) {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      ICE_SERVERS = parsed as RTCIceServer[];
    }
  }
} catch (e) {
  // 使用默认配置
}
export { ICE_SERVERS };

/**
 * 创建 Peer 实例的配置
 */
export const createPeerConfig = (peerId?: string): Peer.PeerJSOption => {
  return {
    host: PEER_HOST,
    port: PEER_PORT,
    path: PEER_PATH,
    secure: PEER_SECURE,
    config: {
      iceServers: ICE_SERVERS,
    },
    debug: import.meta.env.DEV ? 2 : 0,
  };
};

/**
 * 创建 Peer 实例
 */
export const createPeer = (peerId?: string): Peer => {
  const config = createPeerConfig(peerId);
  return new Peer(peerId, config);
};

