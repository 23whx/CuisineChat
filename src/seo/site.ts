/**
 * 站點與多語言 SEO 常數。前端與建置期預渲染（vite.config.ts）共用，不能依賴瀏覽器 API。
 */

// 換成自有網域時只需改這裡（同時更新 public/robots.txt 的 Sitemap 行）
export const SITE_URL = 'https://cuisine-chat.oumashu.top';

export const LANGS = ['en', 'zh', 'ja', 'ko'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'en';

export const isLang = (value: unknown): value is Lang =>
  typeof value === 'string' && (LANGS as readonly string[]).includes(value);

/** 每種語言首頁的路徑：英文是根目錄，其餘為 /zh、/ja、/ko（不帶結尾斜線） */
export const langPath = (lang: Lang): string => (lang === DEFAULT_LANG ? '/' : `/${lang}`);

export const langUrl = (lang: Lang): string => `${SITE_URL}${langPath(lang)}`;

/** 從網址路徑判斷語言（/zh、/zh/... → zh），否則回傳 null */
export const langFromPath = (pathname: string): Lang | null => {
  const first = pathname.split('/')[1];
  return isLang(first) && first !== DEFAULT_LANG ? first : null;
};

/** <html lang> */
export const HTML_LANG: Record<Lang, string> = { en: 'en', zh: 'zh-CN', ja: 'ja', ko: 'ko' };

/** hreflang：中文頁面使用簡體字 */
export const HREFLANG: Record<Lang, string> = { en: 'en', zh: 'zh-Hans', ja: 'ja', ko: 'ko' };

export const OG_LOCALE: Record<Lang, string> = { en: 'en_US', zh: 'zh_CN', ja: 'ja_JP', ko: 'ko_KR' };

export const LANG_LABEL: Record<Lang, string> = { en: 'English', zh: '中文', ja: '日本語', ko: '한국어' };

export const OG_IMAGE = `${SITE_URL}/og-image.jpg`;
export const LOGO_IMAGE = `${SITE_URL}/icon-512.png`;

/** 作者資訊（與頁尾公開的聯絡方式一致），用於結構化資料的實體連結 */
export const AUTHOR = {
  name: 'Rollkey4',
  url: 'https://oumashu.top',
  sameAs: ['https://x.com/Rollkey4', 'https://oumashu.top'],
};

/** 首頁「使用方法 / 特色 / 常見問題」的條目編號（對應翻譯 landing.how1… / f1… / q1…） */
export const HOW_STEPS = [1, 2, 3] as const;
export const FEATURES = [1, 2, 3, 4, 5, 6] as const;
export const FAQS = [1, 2, 3, 4, 5] as const;
