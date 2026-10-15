import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'zh' | 'en' | 'ja' | 'ko';

interface UIState {
  language: Language;

  setLanguage: (language: Language) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      language: 'en', // 默認英文

      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'cuisine-chat-ui',
      // 舊版本還存了 theme，只持久化語言，順便把它清掉
      partialize: (state) => ({ language: state.language }),
    }
  )
);
