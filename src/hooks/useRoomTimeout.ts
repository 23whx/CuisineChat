import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '@/store/chatStore';
import { useTranslation } from 'react-i18next';

/**
 * 房间超时管理 Hook
 * 当房间内只剩一个人且超过指定时间后，提示用户房间即将关闭
 */
export const useRoomTimeout = (timeoutMinutes: number = 10) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { peers, currentUser } = useChatStore();
  const timeoutRef = useRef<number | null>(null);
  const warningShownRef = useRef(false);

  useEffect(() => {
    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const onlinePeersCount = Array.from(peers.values()).filter(
      (p) => p.status === 'connected'
    ).length;

    // 如果房间内只有当前用户（没有其他人连接）
    if (onlinePeersCount === 0 && currentUser) {
      console.log(`房间内只剩一个人，${timeoutMinutes}分钟后将自动关闭`);

      // 设置超时定时器
      timeoutRef.current = setTimeout(() => {
        if (!warningShownRef.current) {
          warningShownRef.current = true;
          
          const shouldLeave = window.confirm(
            t('room.emptyRoomTimeout', {
              minutes: timeoutMinutes,
              defaultValue: `房间已经 ${timeoutMinutes} 分钟没有其他人加入了。是否离开房间？`,
            })
          );

          if (shouldLeave) {
            navigate('/');
          } else {
            // 用户选择继续等待，重置警告标志
            warningShownRef.current = false;
          }
        }
      }, timeoutMinutes * 60 * 1000); // 转换为毫秒
    } else {
      // 有其他人在线，重置警告标志
      warningShownRef.current = false;
    }

    // 清理函数
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [peers, currentUser, timeoutMinutes, navigate, t]);

  return {
    isEmpty: Array.from(peers.values()).filter((p) => p.status === 'connected').length === 0,
  };
};


