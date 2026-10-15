import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useChatStore } from '@/store/chatStore';
import { useUIStore } from '@/store/uiStore';
import { generateUserId, getRandomCuisineName } from '@/utils/username';
import { getAvatarDataUrl } from '@/utils/avatar';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Footer } from '@/components/Footer';
import { PinInput } from '@/components/PinInput';
import { getSavedLanguage, initializeLanguage, isSupportedLanguage } from '@/utils/language';

export const Home: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setCurrentUser = useChatStore((s) => s.setCurrentUser);
  const setRoom = useChatStore((s) => s.setRoom);
  const setLanguage = useUIStore((s) => s.setLanguage);
  
  // 通过邀请链接进入时预填房间号
  const [roomId, setRoomId] = useState(() => searchParams.get('room') ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  // 已保存过语言时无需等待，只有首次访问才需要进行（网络）检测
  const [isDetectingLanguage, setIsDetectingLanguage] = useState(() => getSavedLanguage() === null);

  useEffect(() => {
    if (!isDetectingLanguage) return;
    let cancelled = false;
    initializeLanguage()
      .then((detectedLang) => {
        if (cancelled || !isSupportedLanguage(detectedLang)) return;
        setLanguage(detectedLang);
        i18n.changeLanguage(detectedLang);
      })
      .catch((error) => console.error('语言检测失败:', error))
      .finally(() => {
        if (!cancelled) setIsDetectingLanguage(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isDetectingLanguage, setLanguage, i18n]);

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
    const avatarSeed = username; // 使用用户名作为头像种子
    const avatar = getAvatarDataUrl(avatarSeed);

    setCurrentUser({
      id: userId,
      username,
      avatar,
      avatarSeed,
      joinedAt: Date.now(),
    });

    setRoom(roomId.trim(), password);
    // 房間號是自由輸入的，含 / ? # 等字元時必須編碼，否則路由會被截斷
    navigate(`/room/${encodeURIComponent(roomId.trim())}`);
  };

  const handleCreateRoom = () => {
    const randomRoomId = `room_${Math.random().toString(36).slice(2, 11)}`;
    setRoomId(randomRoomId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      handleJoinRoom();
    }
  };

  const norenChars = Array.from(t('home.noren'));

  if (isDetectingLanguage) {
    return (
      <div className="min-h-screen flex items-center justify-center lantern-glow">
        <div className="w-14 h-16 lantern-body shadow-lantern animate-pulse" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex justify-center lantern-glow">
        <div className="w-full max-w-md px-5 pb-10 flex flex-col items-center text-center">
          {/* 暖簾 */}
          <div
            className="w-full grid gap-1"
            style={{ gridTemplateColumns: `repeat(${norenChars.length}, minmax(0, 1fr))` }}
            aria-hidden="true"
          >
            {norenChars.map((char, i) => (
              <span
                key={i}
                className="bg-noren-cloth border-t-[3px] border-noren rounded-b-md pt-5 pb-6 font-serif font-black text-xl text-ink"
              >
                {char}
              </span>
            ))}
          </div>

          <div className="w-full flex justify-end mt-4">
            <LanguageSwitcher variant="compact" />
          </div>

          {/* 燈籠 */}
          <div className="relative w-24 h-[120px] mt-4 mb-5 lantern-body shadow-lantern grid place-items-center font-serif font-black text-3xl text-noren-cloth">
            <span className="absolute -top-1 left-[30%] right-[30%] h-2 rounded-sm bg-[#2a1712]" />
            食
            <span className="absolute -bottom-1 left-[30%] right-[30%] h-2 rounded-sm bg-[#2a1712]" />
          </div>

          <h1 className="font-serif font-bold text-[26px] tracking-[0.1em]">{t('app.title')}</h1>
          <p className="text-ink-muted text-sm mt-2 mb-7 text-balance">{t('home.tagline')}</p>

          <form
            className="w-full flex flex-col gap-4 text-left"
            onSubmit={(e) => {
              e.preventDefault();
              handleJoinRoom();
            }}
          >
            <div>
              <label htmlFor="room-id" className="block text-xs tracking-widest text-ink-muted mb-1.5">
                {t('home.roomId')}
              </label>
              <div className="flex gap-2">
                <input
                  id="room-id"
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('home.roomIdPlaceholder')}
                  className="input-field flex-1 min-w-0 h-12"
                  autoComplete="off"
                />
                <button type="button" onClick={handleCreateRoom} className="btn-ghost whitespace-nowrap text-sm">
                  {t('home.create')}
                </button>
              </div>
            </div>

            <div>
              <span className="block text-xs tracking-widest text-ink-muted mb-1.5">
                {t('home.password')} · {t('home.passwordPlaceholder')}
              </span>
              <PinInput value={password} onChange={setPassword} onSubmit={handleJoinRoom} label={t('home.password')} />
            </div>

            {error && (
              <div role="alert" className="text-sm text-noren bg-noren/10 border border-noren/30 rounded-xl px-4 py-2">
                {error}
              </div>
            )}

            <button type="submit" className="btn-lantern h-[52px] mt-2 text-base tracking-[0.1em] shadow-glow-lg">
              {t('home.enter')}
            </button>
          </form>

          {/* 提示 */}
          <ul className="w-full mt-8 pt-5 border-t border-night-line text-left text-xs text-ink-muted space-y-2">
            {['tip1', 'tip2', 'tip3'].map((key) => (
              <li key={key} className="flex gap-2">
                <span className="text-lantern">◆</span>
                <span>{t(`home.${key}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
};
