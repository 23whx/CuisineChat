import { useEffect, useMemo, useRef } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useUIStore } from '@/store/uiStore';
import { getRoomKey, loadMessages, saveMessages, updateRetention } from '@/utils/chatHistory';
import type { Message } from '@/types';

/**
 * 房间内的本机聊天记录：
 * - 进入房间时载入本机保存且未过期的记录
 * - 开启保留时，把新消息（包括开启前本次会话已有的消息）写入本机
 * - 修改保留时长时，按新时长重新计算已保存记录的到期时间
 */
export const useChatHistory = (roomId: string, password: string) => {
  const enabled = useUIStore((s) => s.historyEnabled);
  const hours = useUIStore((s) => s.historyHours);
  const roomKey = useMemo(() => (roomId && password ? getRoomKey(roomId, password) : null), [roomId, password]);
  // 已写入（或正在写入）本机的消息 ID，避免重复保存
  const savedIdsRef = useRef<Set<string>>(new Set());

  // 进入房间：载入历史
  useEffect(() => {
    if (!roomKey) return;
    let cancelled = false;
    savedIdsRef.current = new Set();
    loadMessages(roomKey)
      .then((history) => {
        if (cancelled || history.length === 0) return;
        // 先登记为已保存，合并后触发的保存逻辑就不会把它们重写一次（那样会重置到期时间）
        history.forEach((m) => savedIdsRef.current.add(m.id));
        useChatStore.getState().mergeMessages(history);
      })
      .catch((error) => console.warn('[聊天记录] 载入失败：', error));
    return () => {
      cancelled = true;
    };
  }, [roomKey]);

  // 开启保留时：保存新消息
  useEffect(() => {
    if (!roomKey || !enabled) return;

    const persist = (messages: Message[]) => {
      const fresh = messages.filter((m) => !savedIdsRef.current.has(m.id));
      if (fresh.length === 0) return;
      fresh.forEach((m) => savedIdsRef.current.add(m.id));
      saveMessages(roomKey, fresh, hours).catch((error) => {
        // 例如存储空间不足：允许之后重试
        fresh.forEach((m) => savedIdsRef.current.delete(m.id));
        console.warn('[聊天记录] 保存失败：', error);
      });
    };

    persist(useChatStore.getState().messages);
    return useChatStore.subscribe((state, prev) => {
      if (state.messages !== prev.messages) persist(state.messages);
    });
  }, [roomKey, enabled, hours]);

  // 修改保留时长：重新计算到期时间（拖动滑杆时稍作延迟，只在停下后写一次）
  useEffect(() => {
    if (!enabled) return;
    const timer = window.setTimeout(() => {
      updateRetention(hours).catch((error) => console.warn('[聊天记录] 更新保留时长失败：', error));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [enabled, hours]);
};
