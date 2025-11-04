import React from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/store/uiStore';

interface LanguageSwitcherProps {
  variant?: 'full' | 'compact';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  variant = 'full',
  className = '' 
}) => {
  const { i18n } = useTranslation();
  const { language, setLanguage } = useUIStore();

  const languages = [
    { code: 'zh', label: '中文', flag: '🇨🇳' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'ko', label: '한국어', flag: '🇰🇷' },
  ];

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode as any);
    i18n.changeLanguage(langCode);
  };

  if (variant === 'compact') {
    return (
      <div className={`flex gap-2 ${className}`}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              language === lang.code
                ? 'bg-wechat-500 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
            title={lang.label}
          >
            {lang.flag}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleLanguageChange(lang.code)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            language === lang.code
              ? 'bg-wechat-500 text-white'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
          }`}
        >
          <span className="mr-1">{lang.flag}</span>
          {lang.label}
        </button>
      ))}
    </div>
  );
};


