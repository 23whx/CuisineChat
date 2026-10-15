import { create } from 'zustand';
import { Message, User, PeerUser, ConnectionStatus, PeerConnection } from '@/types';

interface ChatState {
  // 当前用户
  currentUser: User | null;

  // 房间信息
  roomId: string | null;
  roomPassword: string | null;

  // 消息列表
  messages: Message[];

  // 连接的 peers
  peers: Map<string, PeerConnection>;

  // 操作方法
  setCurrentUser: (user: User) => void;
  setRoom: (roomId: string, password: string) => void;
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  upsertPeer: (peerId: string, user: PeerUser) => void;
  removePeer: (peerId: string) => void;
  updateConnectionStatus: (peerId: string, status: ConnectionStatus) => void;
  /** 离开房间时清空消息与成员，保留当前用户 */
  clearRoom: () => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  currentUser: null,
  roomId: null,
  roomPassword: null,
  messages: [],
  peers: new Map(),

  setCurrentUser: (user) => set({ currentUser: user }),

  setRoom: (roomId, password) => set({ roomId, roomPassword: password }),

  addMessage: (message) =>
    set((state) => {
      // 重复连接或重传时可能收到同一条消息
      if (state.messages.some((m) => m.id === message.id)) return state;
      return { messages: [...state.messages, message] };
    }),

  clearMessages: () => set({ messages: [] }),

  // 收到 USER_INFO 说明数据通道已打开，直接视为已连接；改名时也会再次收到
  upsertPeer: (peerId, user) =>
    set((state) => {
      const newPeers = new Map(state.peers);
      newPeers.set(peerId, {
        peerId,
        user,
        status: ConnectionStatus.CONNECTED,
      });
      return { peers: newPeers };
    }),

  removePeer: (peerId) =>
    set((state) => {
      if (!state.peers.has(peerId)) return state;
      const newPeers = new Map(state.peers);
      newPeers.delete(peerId);
      return { peers: newPeers };
    }),

  updateConnectionStatus: (peerId, status) =>
    set((state) => {
      const peer = state.peers.get(peerId);
      if (!peer || peer.status === status) return state;
      const newPeers = new Map(state.peers);
      newPeers.set(peerId, { ...peer, status });
      return { peers: newPeers };
    }),

  clearRoom: () => set({ messages: [], peers: new Map() }),

  reset: () =>
    set({
      currentUser: null,
      roomId: null,
      roomPassword: null,
      messages: [],
      peers: new Map(),
    }),
}));

/** 已连接的其他成员数量（返回原始值，避免无关的 Map 更新触发重渲染） */
export const selectOnlinePeerCount = (state: ChatState) => {
  let count = 0;
  state.peers.forEach((p) => {
    if (p.status === ConnectionStatus.CONNECTED) count++;
  });
  return count;
};
