import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/store/uiStore';
import { useChatStore } from '@/store/chatStore';
import { Avatar } from './Avatar';
import { isValidUsername } from '@/utils/username';
import { getAvatarDataUrl } from '@/utils/avatar';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const { theme, language, toggleTheme, setLanguage } = useUIStore();
  const { currentUser, setCurrentUser } = useChatStore();
  const [newUsername, setNewUsername] = useState('');

  if (!isOpen) return null;

  const handleUsernameChange = () => {
    if (newUsername && isValidUsername(newUsername) && currentUser) {
      const newAvatarSeed = newUsername;
      const newAvatar = getAvatarDataUrl(newAvatarSeed);
      setCurrentUser({ 
        ...currentUser, 
        username: newUsername,
        avatarSeed: newAvatarSeed,
        avatar: newAvatar
      });
      setNewUsername('');
    }
  };

  const handleLanguageChange = (lang: 'zh' | 'en' | 'ja' | 'ko') => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{t('settings.title')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* 用户信息 */}
          {currentUser && (
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Avatar username={currentUser.username} size="lg" />
              <div>
                <div className="font-medium text-lg">{currentUser.username}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">ID: {currentUser.id.slice(0, 8)}</div>
              </div>
            </div>
          )}

          {/* 更改用户名 */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('settings.username')}</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder={t('settings.usernamePlaceholder')}
                className="input-field flex-1"
                maxLength={30}
              />
              <button
                onClick={handleUsernameChange}
                disabled={!newUsername || !isValidUsername(newUsername)}
                className="btn-wechat disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('settings.changeUsername')}
              </button>
            </div>
          </div>

          {/* 主题切换 */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('settings.theme')}</label>
            <div className="flex gap-2">
              <button
                onClick={toggleTheme}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                  theme === 'light'
                    ? 'border-wechat-500 bg-wechat-50 dark:bg-wechat-900 text-wechat-700 dark:text-wechat-300'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                  {t('settings.light')}
                </div>
              </button>
              <button
                onClick={toggleTheme}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                  theme === 'dark'
                    ? 'border-wechat-500 bg-wechat-50 dark:bg-wechat-900 text-wechat-700 dark:text-wechat-300'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                  {t('settings.dark')}
                </div>
              </button>
            </div>
          </div>

          {/* 语言选择 */}
          <div>
            <label className="block text-sm font-medium mb-2">{t('settings.language')}</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { code: 'zh', label: t('settings.chinese') },
                { code: 'en', label: t('settings.english') },
                { code: 'ja', label: t('settings.japanese') },
                { code: 'ko', label: t('settings.korean') },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code as any)}
                  className={`py-2 px-4 rounded-lg border-2 transition-colors ${
                    language === lang.code
                      ? 'border-wechat-500 bg-wechat-50 dark:bg-wechat-900 text-wechat-700 dark:text-wechat-300'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="btn-wechat">
            {t('settings.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

