import React from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/store/uiStore';

type LanguageCode = 'zh' | 'en' | 'ja' | 'ko';

interface LanguageSwitcherProps {
  variant?: 'full' | 'compact';
  className?: string;
}

// 用文字而不是國旗：Windows 不渲染國旗 emoji，只會顯示兩個字母
const languages: { code: LanguageCode; short: string; label: string }[] = [
  { code: 'zh', short: '中', label: '中文' },
  { code: 'en', short: 'EN', label: 'English' },
  { code: 'ja', short: '日', label: '日本語' },
  { code: 'ko', short: '한', label: '한국어' },
];

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'full',
  className = '',
}) => {
  const { i18n } = useTranslation();
  const language = useUIStore((s) => s.language);
  const setLanguage = useUIStore((s) => s.setLanguage);

  const handleLanguageChange = (code: LanguageCode) => {
    setLanguage(code);
    i18n.changeLanguage(code);
  };

  if (variant === 'compact') {
    return (
      <div className={`inline-flex gap-0.5 p-0.5 rounded-lg bg-night-surface border border-night-line ${className}`}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            aria-pressed={language === lang.code}
            title={lang.label}
            className={`min-w-[34px] px-2 py-1 rounded-md text-xs transition-colors ${
              language === lang.code ? 'bg-night-raised text-lantern' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {lang.short}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleLanguageChange(lang.code)}
          aria-pressed={language === lang.code}
          className={`py-2 px-4 rounded-xl border text-sm transition-colors ${
            language === lang.code
              ? 'border-lantern bg-lantern/10 text-lantern'
              : 'border-night-border text-ink-muted hover:text-ink hover:bg-night-raised'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
};
