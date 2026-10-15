/**
 * 基于 IP 地址检测用户所在地区并返回对应的语言代码
 */
export const detectLanguageByIP = async (): Promise<string> => {
  try {
    // 使用免费的 IP 地理位置 API；首页会等待检测结果，必须设置超时
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 2500);
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    }).finally(() => window.clearTimeout(timer));

    if (!response.ok) {
      throw new Error('Failed to fetch IP info');
    }

    const data = await response.json();
    const countryCode = data.country_code?.toLowerCase();

    console.log('检测到的国家代码:', countryCode);

    // 根据国家代码返回语言
    switch (countryCode) {
      case 'cn': // 中国大陆
      case 'tw': // 台湾
      case 'hk': // 香港
      case 'mo': // 澳门
        return 'zh';
      
      case 'jp': // 日本
        return 'ja';
      
      case 'kr': // 韩国
        return 'ko';
      
      default:
        return 'en'; // 默认英文
    }
  } catch (error) {
    console.error('IP 检测失败，使用默认语言:', error);
    // 如果 API 失败，尝试使用浏览器语言
    return detectLanguageByBrowser();
  }
};

/**
 * 基于浏览器语言设置检测语言（备用方案）
 */
export const detectLanguageByBrowser = (): string => {
  const browserLang = navigator.language.toLowerCase();
  
  if (browserLang.startsWith('zh')) {
    return 'zh';
  } else if (browserLang.startsWith('ja')) {
    return 'ja';
  } else if (browserLang.startsWith('ko')) {
    return 'ko';
  }
  
  return 'en'; // 默认英文
};

const SUPPORTED_LANGUAGES = ['zh', 'en', 'ja', 'ko'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const isSupportedLanguage = (lang: unknown): lang is SupportedLanguage =>
  typeof lang === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(lang);

/**
 * 同步读取用户保存过的语言（zustand persist 写入的 cuisine-chat-ui）
 */
export const getSavedLanguage = (): SupportedLanguage | null => {
  try {
    const saved = localStorage.getItem('cuisine-chat-ui');
    const language = saved ? JSON.parse(saved)?.state?.language : null;
    return isSupportedLanguage(language) ? language : null;
  } catch {
    return null;
  }
};

/**
 * 获取或初始化语言设置
 */
export const initializeLanguage = async (): Promise<string> => {
  // 检查本地存储是否有保存的语言设置
  const savedLanguage = getSavedLanguage();
  if (savedLanguage) {
    return savedLanguage;
  }

  // 如果没有保存的设置，进行 IP 检测
  console.log('首次访问，进行语言检测...');
  const detectedLanguage = await detectLanguageByIP();
  console.log('检测到的语言:', detectedLanguage);
  
  return detectedLanguage;
};



