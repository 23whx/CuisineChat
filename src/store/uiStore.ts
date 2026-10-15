import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clampHours } from '@/utils/chatHistory';

type Language = 'zh' | 'en' | 'ja' | 'ko';

interface UIState {
  language: Language;
  /** 是否在本机保留聊天记录（默认关闭：关闭页面即消失） */
  historyEnabled: boolean;
  /** 保留时长（小时，1–27）。关闭保留时也记住上次的选择 */
  historyHours: number;

  setLanguage: (language: Language) => void;
  setHistoryEnabled: (enabled: boolean) => void;
  setHistoryHours: (hours: number) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      language: 'en', // 默認英文
      historyEnabled: false,
      historyHours: 6,

      setLanguage: (language) => set({ language }),
      setHistoryEnabled: (historyEnabled) => set({ historyEnabled }),
      setHistoryHours: (hours) => set({ historyHours: clampHours(hours) }),
    }),
    {
      name: 'cuisine-chat-ui',
      // 舊版本還存了 theme，只持久化需要的欄位，順便把它清掉
      partialize: (state) => ({
        language: state.language,
        historyEnabled: state.historyEnabled,
        historyHours: state.historyHours,
      }),
    }
  )
);
