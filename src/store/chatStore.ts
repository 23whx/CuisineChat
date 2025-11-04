import { create } from 'zustand';
import { Message, User, ConnectionStatus, PeerConnection } from '@/types';

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
  addPeer: (peerId: string, user: User) => void;
  removePeer: (peerId: string) => void;
  updateConnectionStatus: (peerId: string, status: ConnectionStatus) => void;
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
    set((state) => ({
      messages: [...state.messages, message],
    })),

  clearMessages: () => set({ messages: [] }),

  addPeer: (peerId, user) =>
    set((state) => {
      const newPeers = new Map(state.peers);
      if (!newPeers.has(peerId)) {
        newPeers.set(peerId, {
          peerId,
          user,
          connection: null as any, // 将在 hook 中设置
          status: ConnectionStatus.CONNECTING,
        });
      }
      return { peers: newPeers };
    }),

  removePeer: (peerId) =>
    set((state) => {
      const newPeers = new Map(state.peers);
      newPeers.delete(peerId);
      return { peers: newPeers };
    }),

  updateConnectionStatus: (peerId, status) =>
    set((state) => {
      const newPeers = new Map(state.peers);
      const peer = newPeers.get(peerId);
      if (peer) {
        newPeers.set(peerId, { ...peer, status });
      }
      return { peers: newPeers };
    }),

  reset: () =>
    set({
      currentUser: null,
      roomId: null,
      roomPassword: null,
      messages: [],
      peers: new Map(),
    }),
}));

