import type { DataConnection } from 'peerjs';

const HEARTBEAT_INTERVAL = 5000;
const HEARTBEAT_TIMEOUT = 20000;

/**
 * 为数据通道加上应用层心跳。
 * 对方崩溃、断网或进程被杀时，WebRTC 往往长时间不会触发 close，
 * 这里定期发送 ping，超时未收到任何数据就主动关闭连接，交给上层的 close 逻辑处理。
 * 收到 ping 会自动回复 pong（与 DataChannelMessageType.PING / PONG 一致）。
 */
export const watchConnection = (conn: DataConnection): (() => void) => {
  let lastSeen = Date.now();

  const send = (type: 'ping' | 'pong') => {
    try {
      conn.send({ type, payload: {} });
    } catch {
      // 通道正在关闭，交给超时处理
    }
  };

  const onData = (data: unknown) => {
    lastSeen = Date.now();
    if ((data as { type?: string } | null)?.type === 'ping') send('pong');
  };

  const timer = window.setInterval(() => {
    if (!conn.open) return;
    if (Date.now() - lastSeen > HEARTBEAT_TIMEOUT) {
      console.warn('[心跳] 连接超时，关闭：', conn.peer);
      conn.close();
      return;
    }
    send('ping');
  }, HEARTBEAT_INTERVAL);

  const stop = () => {
    window.clearInterval(timer);
    conn.off('data', onData);
    conn.off('close', stop);
  };

  conn.on('data', onData);
  conn.on('close', stop);
  return stop;
};
