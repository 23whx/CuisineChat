import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';
type Language = 'zh' | 'en' | 'ja' | 'ko';

interface UIState {
  theme: Theme;
  language: Language;
  
  toggleTheme: () => void;
  setLanguage: (language: Language) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'light',
      language: 'en', // 默认英文

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),

      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'cuisine-chat-ui',
    }
  )
);

