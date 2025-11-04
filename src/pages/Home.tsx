import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useChatStore } from '@/store/chatStore';
import { useUIStore } from '@/store/uiStore';
import { generateUserId, getRandomCuisineName } from '@/utils/username';
import { getAvatarDataUrl } from '@/utils/avatar';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Footer } from '@/components/Footer';
import { initializeLanguage } from '@/utils/language';

export const Home: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { setCurrentUser, setRoom } = useChatStore();
  const { setLanguage } = useUIStore();
  
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isDetectingLanguage, setIsDetectingLanguage] = useState(true);

  // 初始化语言设置（基于 IP 检测）
  useEffect(() => {
    const detectAndSetLanguage = async () => {
      try {
        const detectedLang = await initializeLanguage();
        setLanguage(detectedLang as any);
        i18n.changeLanguage(detectedLang);
        console.log('语言已设置为:', detectedLang);
      } catch (error) {
        console.error('语言检测失败:', error);
      } finally {
        setIsDetectingLanguage(false);
      }
    };

    detectAndSetLanguage();
  }, [setLanguage, i18n]);

  const validatePassword = (pwd: string): boolean => {
    return /^\d{3}$/.test(pwd);
  };

  const handleJoinRoom = () => {
    setError('');

    if (!roomId.trim()) {
      setError(t('home.invalidRoomId'));
      return;
    }

    if (!validatePassword(password)) {
      setError(t('home.invalidPassword'));
      return;
    }

    // 生成临时用户信息
    const userId = generateUserId();
    const username = getRandomCuisineName();
    const avatar = getAvatarDataUrl(username);

    setCurrentUser({
      id: userId,
      username,
      avatar,
      joinedAt: Date.now(),
    });

    setRoom(roomId.trim(), password);
    navigate(`/room/${roomId.trim()}`);
  };

  const handleCreateRoom = () => {
    const randomRoomId = `room_${Math.random().toString(36).substr(2, 9)}`;
    setRoomId(randomRoomId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoinRoom();
    }
  };

  // 显示加载状态（可选）
  if (isDetectingLanguage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-wechat-50 to-wechat-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wechat-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-wechat-50 to-wechat-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full">
        {/* 语言切换器 - 顶部右上角 */}
        <div className="flex justify-end mb-4">
          <LanguageSwitcher variant="compact" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-wechat-600 dark:text-wechat-400 mb-2">
            🍜 {t('app.title')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            {t('app.subtitle')}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {t('home.description')}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          <div className="space-y-4">
            {/* 房间 ID */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('home.roomId')}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t('home.roomIdPlaceholder')}
                  className="input-field flex-1"
                />
                <button
                  onClick={handleCreateRoom}
                  className="btn-wechat-outline whitespace-nowrap"
                >
                  {t('home.create')}
                </button>
              </div>
            </div>

            {/* 密码 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('home.password')}
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value.replace(/\D/g, '').slice(0, 3))}
                onKeyPress={handleKeyPress}
                placeholder={t('home.passwordPlaceholder')}
                className="input-field"
                maxLength={3}
                inputMode="numeric"
              />
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* 加入按钮 */}
            <button
              onClick={handleJoinRoom}
              className="w-full btn-wechat text-lg py-3"
            >
              {t('home.join')}
            </button>
          </div>

          {/* 提示 */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p>💡 {t('home.tips')}:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>{t('home.tip1')}</li>
                <li>{t('home.tip2')}</li>
                <li>{t('home.tip3')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8">
          <Footer />
        </div>
      </div>
    </div>
  );
};

