import Peer from 'peerjs';

// 从环境变量获取配置
const PEER_SECURE = import.meta.env.VITE_PEER_SECURE === 'true';
const PEER_HOST = import.meta.env.VITE_PEER_HOST || '0.peerjs.com';
const PEER_PORT = parseInt(import.meta.env.VITE_PEER_PORT || '443');
const PEER_PATH = import.meta.env.VITE_PEER_PATH || '/';

// ICE 服务器配置
const ICE_SERVERS_STRING = import.meta.env.VITE_ICE_SERVERS || 
  'stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302';

const parseIceServers = (serversString: string): RTCIceServer[] => {
  return serversString.split(',').map(url => ({ urls: url.trim() }));
};

export const ICE_SERVERS = parseIceServers(ICE_SERVERS_STRING);

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

