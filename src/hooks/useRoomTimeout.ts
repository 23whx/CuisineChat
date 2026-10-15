import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore, selectOnlinePeerCount } from '@/store/chatStore';
import { useTranslation } from 'react-i18next';

/**
 * 房间超时管理 Hook
 * 当房间内只剩一个人且超过指定时间后，提示用户是否离开
 */
export const useRoomTimeout = (timeoutMinutes: number = 10) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // 只订阅在线人数（原始值），成员状态的其他变化不会重置计时
  const onlinePeersCount = useChatStore(selectOnlinePeerCount);
  const hasUser = useChatStore((s) => s.currentUser !== null);
  const isEmpty = onlinePeersCount === 0;

  useEffect(() => {
    if (!isEmpty || !hasUser) return;

    const timer = window.setTimeout(() => {
      const shouldLeave = window.confirm(
        t('room.emptyRoomTimeout', {
          minutes: timeoutMinutes,
          defaultValue: `房间已经 ${timeoutMinutes} 分钟没有其他人加入了。是否离开房间？`,
        })
      );
      if (shouldLeave) {
        navigate('/');
      }
    }, timeoutMinutes * 60 * 1000);

    return () => window.clearTimeout(timer);
  }, [isEmpty, hasUser, timeoutMinutes, navigate, t]);

  return { isEmpty };
};
