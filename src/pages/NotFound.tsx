import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNoIndexPage } from '@/seo/usePageMeta';
import { isLang, langPath } from '@/seo/site';

/**
 * 不存在的路徑。Vercel 對所有路徑都回傳 index.html（狀態碼 200），
 * 這裡加上 noindex，避免被 Google 當成重複內容或「軟 404」收錄。
 */
export const NotFound: React.FC = () => {
  const { t, i18n } = useTranslation();
  useNoIndexPage('404 · CuisineChat');
  const home = langPath(isLang(i18n.language) ? i18n.language : 'en');

  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center gap-5 px-6 text-center lantern-glow">
      <div className="w-14 h-16 lantern-body shadow-lantern opacity-60" aria-hidden="true" />
      <h1 className="font-serif text-4xl font-bold">404</h1>
      <Link to={home} className="btn-lantern px-6 py-2.5">
        {t('app.title')}
      </Link>
    </main>
  );
};
