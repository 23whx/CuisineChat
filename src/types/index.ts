import type { DataConnection } from 'peerjs';

// 用户类型
export interface User {
  id: string;
  username: string;
  avatar: string;
  avatarSeed: string;
  joinedAt: number;
}

// 消息类型
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  AUDIO = 'audio',
  SYSTEM = 'system',
  USER_JOIN = 'user_join',
  USER_LEAVE = 'user_leave',
}

// 基础消息接口
export interface BaseMessage {
  id: string;
  type: MessageType;
  senderId: string;
  senderName: string;
  timestamp: number;
}

// 文本消息
export interface TextMessage extends BaseMessage {
  type: MessageType.TEXT;
  content: string;
}

// 图片消息
export interface ImageMessage extends BaseMessage {
  type: MessageType.IMAGE;
  imageData: string; // base64
  filename: string;
  size: number;
}

// 文件消息
export interface FileMessage extends BaseMessage {
  type: MessageType.FILE;
  filename: string;
  size: number;
  mimeType: string;
  fileData?: string; // base64，分片传输时可能为空
  progress?: number; // 传输进度 0-100
}

// 语音消息
export interface AudioMessage extends BaseMessage {
  type: MessageType.AUDIO;
  audioData: string; // base64
  duration: number; // 时长（秒）
  size: number;
}

// 系统消息
export interface SystemMessage extends BaseMessage {
  type: MessageType.SYSTEM | MessageType.USER_JOIN | MessageType.USER_LEAVE;
  content: string;
}

// 联合类型
export type Message = TextMessage | ImageMessage | FileMessage | AudioMessage | SystemMessage;

// 房间信息
export interface RoomInfo {
  roomId: string;
  password: string;
  createdAt: number;
}

// 连接状态
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  FAILED = 'failed',
}

// Peer 连接信息
export interface PeerConnection {
  peerId: string;
  connection: DataConnection;
  user: User;
  status: ConnectionStatus;
}

// 文件传输状态
export interface FileTransfer {
  id: string;
  filename: string;
  size: number;
  progress: number;
  status: 'pending' | 'transferring' | 'completed' | 'failed';
}

// WebRTC 数据通道消息类型
export enum DataChannelMessageType {
  USER_INFO = 'user_info',
  MESSAGE = 'message',
  FILE_CHUNK = 'file_chunk',
  PING = 'ping',
  PONG = 'pong',
}

// 数据通道消息
export interface DataChannelMessage {
  type: DataChannelMessageType;
  payload: any;
}

