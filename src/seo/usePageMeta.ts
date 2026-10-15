import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HTML_LANG, OG_LOCALE, langUrl, type Lang } from './site';

const setMeta = (selector: string, attr: 'name' | 'property', key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
};

const setCanonical = (href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
};

export const setRobots = (content: string) => setMeta('meta[name="robots"]', 'name', 'robots', content);

export const INDEXABLE_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1';

/**
 * 首頁的 <head> 與目前語言同步。
 * 每個語言網址的初始 HTML 已在建置時預渲染好；這裡只處理站內切換語言（不重新載入頁面）的情況，
 * 讓 Google 渲染後看到的標記與預渲染一致。
 */
export const useHomePageMeta = (lang: Lang) => {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    // 等 i18n 切換到目標語言後再寫入，避免短暫寫入舊語言的文字
    if (i18n.language !== lang) return;
    const title = t('seo.title');
    const description = t('seo.description');
    const imageAlt = t('seo.imageAlt');
    const url = langUrl(lang);

    document.title = title;
    document.documentElement.lang = HTML_LANG[lang];
    setRobots(INDEXABLE_ROBOTS);
    setCanonical(url);
    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[name="keywords"]', 'name', 'keywords', t('seo.keywords'));
    setMeta('meta[property="og:url"]', 'property', 'og:url', url);
    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:locale"]', 'property', 'og:locale', OG_LOCALE[lang]);
    setMeta('meta[property="og:image:alt"]', 'property', 'og:image:alt', imageAlt);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    setMeta('meta[name="twitter:image:alt"]', 'name', 'twitter:image:alt', imageAlt);
  }, [lang, t, i18n.language]);
};

/**
 * 不應被收錄的頁面（聊天室、404）：設定標題並加上 noindex，離開時恢復可收錄。
 */
export const useNoIndexPage = (title: string) => {
  useEffect(() => {
    document.title = title;
    setRobots('noindex, nofollow');
    return () => setRobots(INDEXABLE_ROBOTS);
  }, [title]);
};
