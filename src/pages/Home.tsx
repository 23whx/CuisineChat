import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useChatStore } from '@/store/chatStore';
import { useUIStore } from '@/store/uiStore';
import { generateUserId, getRandomCuisineName } from '@/utils/username';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Footer } from '@/components/Footer';
import { PinInput } from '@/components/PinInput';
import { getSavedLanguage, initializeLanguage, isSupportedLanguage } from '@/utils/language';
import { DEFAULT_LANG, FAQS, FEATURES, HOW_STEPS, langPath, type Lang } from '@/seo/site';
import { useHomePageMeta } from '@/seo/usePageMeta';

interface HomeProps {
  /** 由網址決定的語言：/ → en，/zh、/ja、/ko */
  lang: Lang;
}

export const Home: React.FC<HomeProps> = ({ lang }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const setCurrentUser = useChatStore((s) => s.setCurrentUser);
  const setRoom = useChatStore((s) => s.setRoom);
  const setLanguage = useUIStore((s) => s.setLanguage);

  // 通过邀请链接进入时预填房间号
  const [roomId, setRoomId] = useState(() => searchParams.get('room') ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  // 首次渲染時的語言偏好（之後的同步會覆寫保存值，所以先記下來）
  const initialSavedRef = useRef(getSavedLanguage());

  useHomePageMeta(lang);

  // 介面語言跟隨網址
  useEffect(() => {
    setLanguage(lang);
    if (i18n.language !== lang) i18n.changeLanguage(lang);
  }, [lang, setLanguage, i18n]);

  // 只在根目錄（英文頁）且使用者沒有明確選過時，按偏好或地區導向對應語言頁。
  // 不阻塞渲染：先顯示英文內容，爬蟲（無保存值、美國 IP）會停留在英文頁。
  useEffect(() => {
    if (lang !== DEFAULT_LANG) return;
    let cancelled = false;
    const goTo = (target: string) => {
      if (cancelled || !isSupportedLanguage(target) || target === DEFAULT_LANG) return;
      navigate(`${langPath(target)}${location.search}`, { replace: true });
    };
    const saved = initialSavedRef.current;
    if (saved) {
      goTo(saved);
    } else {
      initializeLanguage().then(goTo, (err) => console.error('语言检测失败:', err));
    }
    return () => {
      cancelled = true;
    };
    // 只在進入頁面時判斷一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    // 生成临时用户信息（頭像由 Avatar 元件依用戶名即時生成）
    const username = getRandomCuisineName();
    setCurrentUser({
      id: generateUserId(),
      username,
      avatarSeed: username,
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

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 lantern-glow">
        <div className="mx-auto w-full max-w-md px-5 pb-10 flex flex-col items-center text-center">
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

          <nav className="w-full flex justify-end mt-4" aria-label={t('landing.languages')}>
            <LanguageSwitcher variant="compact" hrefFor={(code) => `${langPath(code)}${location.search}`} />
          </nav>

          {/* 燈籠 */}
          <div
            className="relative w-24 h-[120px] mt-4 mb-5 lantern-body shadow-lantern grid place-items-center font-serif font-black text-3xl text-noren-cloth"
            aria-hidden="true"
          >
            <span className="absolute -top-1 left-[30%] right-[30%] h-2 rounded-sm bg-[#2a1712]" />
            食
            <span className="absolute -bottom-1 left-[30%] right-[30%] h-2 rounded-sm bg-[#2a1712]" />
          </div>

          <p className="font-serif font-bold text-[26px] tracking-[0.1em]">{t('app.title')}</p>
          {/* 主標題承載核心關鍵字 */}
          <h1 className="mt-2 text-lg font-bold text-lantern text-balance">{t('home.h1')}</h1>
          <p className="text-ink-muted text-sm mt-1.5 mb-7 text-balance">{t('home.tagline')}</p>

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
        </div>

        {/* 介紹內容：與預渲染的靜態正文（src/seo/prerender.ts）使用同一份翻譯 */}
        <div className="mx-auto w-full max-w-3xl px-5 pb-16 space-y-14">
          {/* 自成一段的定義，方便搜尋引擎與 AI 直接引用 */}
          <section aria-labelledby="what-title" className="text-center">
            <h2 id="what-title" className="font-serif text-xl font-bold mb-3">
              {t('landing.whatTitle')}
            </h2>
            <p className="text-ink-soft leading-relaxed text-balance">{t('landing.what')}</p>
          </section>

          <section aria-labelledby="how-title">
            <h2 id="how-title" className="font-serif text-xl font-bold mb-5 text-center">
              {t('landing.howTitle')}
            </h2>
            <ol className="grid gap-3 sm:grid-cols-3">
              {HOW_STEPS.map((n) => (
                <li key={n} className="rounded-2xl border border-night-line bg-night-surface/70 p-4">
                  <span className="font-serif text-2xl font-black text-lantern">{n}</span>
                  <h3 className="mt-1 font-bold">{t(`landing.how${n}Title`)}</h3>
                  <p className="mt-1 text-sm text-ink-muted leading-relaxed">{t(`landing.how${n}`)}</p>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="features-title">
            <h2 id="features-title" className="font-serif text-xl font-bold mb-5 text-center">
              {t('landing.featuresTitle')}
            </h2>
            <ul className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              {FEATURES.map((n) => (
                <li key={n} className="flex gap-3">
                  <span className="text-lantern mt-0.5" aria-hidden="true">◆</span>
                  <div>
                    <h3 className="font-bold">{t(`landing.f${n}Title`)}</h3>
                    <p className="mt-0.5 text-sm text-ink-muted leading-relaxed">{t(`landing.f${n}`)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="faq-title">
            <h2 id="faq-title" className="font-serif text-xl font-bold mb-5 text-center">
              {t('landing.faqTitle')}
            </h2>
            <div className="divide-y divide-night-line rounded-2xl border border-night-line bg-night-surface/70">
              {FAQS.map((n) => (
                <details key={n} className="group px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
                    <h3 className="font-bold">{t(`landing.q${n}`)}</h3>
                    <span className="text-lantern transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                  </summary>
                  <p className="mt-2 text-sm text-ink-muted leading-relaxed">{t(`landing.a${n}`)}</p>
                </details>
              ))}
            </div>
          </section>

          <p className="text-center text-xs text-ink-muted">
            {t('landing.updated')}: <time dateTime={__BUILD_DATE__}>{__BUILD_DATE__}</time>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};
