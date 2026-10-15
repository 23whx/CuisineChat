import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useChatStore } from '@/store/chatStore';
import { Avatar } from './Avatar';
import { LanguageSwitcher } from './LanguageSwitcher';
import { isValidUsername } from '@/utils/username';
import { getAvatarDataUrl } from '@/utils/avatar';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const currentUser = useChatStore((s) => s.currentUser);
  const setCurrentUser = useChatStore((s) => s.setCurrentUser);
  const [newUsername, setNewUsername] = useState('');

  // Esc 關閉
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trimmed = newUsername.trim();
  const canRename = isValidUsername(trimmed) && trimmed !== currentUser?.username;

  const handleUsernameChange = () => {
    if (!canRename || !currentUser) return;
    setCurrentUser({
      ...currentUser,
      username: trimmed,
      avatarSeed: trimmed,
      avatar: getAvatarDataUrl(trimmed),
    });
    setNewUsername('');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="modal-panel max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="settings-title" className="font-serif text-xl font-bold tracking-wide">
            {t('settings.title')}
          </h2>
          <button onClick={onClose} className="btn-icon" aria-label={t('settings.close')}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* 用戶信息 */}
          {currentUser && (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-night-raised">
              <Avatar username={currentUser.username} size="lg" />
              <div className="min-w-0">
                <div className="font-serif font-bold text-lg truncate">{currentUser.username}</div>
                <div className="text-xs text-ink-muted">{t('room.you')}</div>
              </div>
            </div>
          )}

          {/* 更改用戶名 */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUsernameChange();
            }}
          >
            <label htmlFor="new-username" className="block text-xs tracking-widest text-ink-muted mb-1.5">
              {t('settings.username')}
            </label>
            <div className="flex gap-2">
              <input
                id="new-username"
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder={t('settings.usernamePlaceholder')}
                className="input-field flex-1 min-w-0"
                maxLength={30}
                autoComplete="off"
              />
              <button type="submit" disabled={!canRename} className="btn-lantern whitespace-nowrap text-sm">
                {t('settings.changeUsername')}
              </button>
            </div>
          </form>

          {/* 語言 */}
          <div>
            <span className="block text-xs tracking-widest text-ink-muted mb-1.5">{t('settings.language')}</span>
            <LanguageSwitcher />
          </div>
        </div>

        <div className="mt-7 flex justify-end">
          <button onClick={onClose} className="btn-ghost">
            {t('settings.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
