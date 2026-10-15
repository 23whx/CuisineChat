import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zh from './locales/zh.json';
import en from './locales/en.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import { getSavedLanguage } from '@/utils/language';
import { HTML_LANG, isLang, langFromPath } from '@/seo/site';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      zh: { translation: zh },
      en: { translation: en },
      ja: { translation: ja },
      ko: { translation: ko },
    },
    // 網址上的語言（/zh、/ja、/ko）優先，與預渲染的頁面一致；其次是已保存的語言
    lng: langFromPath(window.location.pathname) ?? getSavedLanguage() ?? 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

// <html lang> 跟隨介面語言，供搜尋引擎、螢幕閱讀器與瀏覽器翻譯判斷
const syncHtmlLang = (lng: string) => {
  if (isLang(lng)) document.documentElement.lang = HTML_LANG[lng];
};
syncHtmlLang(i18n.language);
i18n.on('languageChanged', syncHtmlLang);

export default i18n;

