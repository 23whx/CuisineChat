import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/store/uiStore';
import { HISTORY_MAX_HOURS, HISTORY_MIN_HOURS, clearAllHistory } from '@/utils/chatHistory';

/**
 * 设置面板中的「聊天记录」：是否在本机保留，以及保留 1–27 小时
 */
export const HistorySettings: React.FC = () => {
  const { t } = useTranslation();
  const enabled = useUIStore((s) => s.historyEnabled);
  const hours = useUIStore((s) => s.historyHours);
  const setEnabled = useUIStore((s) => s.setHistoryEnabled);
  const setHours = useUIStore((s) => s.setHistoryHours);
  const [notice, setNotice] = useState('');

  const flash = (text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(''), 2000);
  };

  const deleteSaved = async () => {
    try {
      await clearAllHistory();
      flash(t('settings.historyCleared'));
    } catch (error) {
      console.warn('[聊天记录] 删除失败：', error);
    }
  };

  const handleToggle = () => {
    if (!enabled) {
      setEnabled(true);
      return;
    }
    // 关闭会删除已保存的记录，属于不可恢复的操作，先确认
    if (!window.confirm(t('settings.historyOffConfirm'))) return;
    setEnabled(false);
    deleteSaved();
  };

  return (
    <div>
      <span className="block text-xs tracking-widest text-ink-muted mb-1.5">{t('settings.history')}</span>

      <div className="rounded-xl bg-night-raised p-4 space-y-4">
        <label className="flex items-center justify-between gap-4 cursor-pointer">
          <span className="text-sm">{t('settings.historyToggle')}</span>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={handleToggle}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              enabled ? 'bg-lantern shadow-glow' : 'bg-night-border'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-ink transition-transform ${
                enabled ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </label>

        {enabled ? (
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <label htmlFor="history-hours" className="text-sm text-ink-soft">
                {t('settings.historyHours', { count: hours })}
              </label>
              <span className="font-serif text-lg font-bold text-lantern tabular-nums">{hours}h</span>
            </div>
            <input
              id="history-hours"
              type="range"
              min={HISTORY_MIN_HOURS}
              max={HISTORY_MAX_HOURS}
              step={1}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              aria-valuetext={t('settings.historyHours', { count: hours })}
              className="w-full accent-lantern cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-ink-muted mt-1 tabular-nums">
              <span>{HISTORY_MIN_HOURS}h</span>
              <span>{HISTORY_MAX_HOURS}h</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-ink-muted">{t('settings.historyOff')}</p>
        )}

        <p className="text-xs text-ink-muted leading-relaxed">{t('settings.historyHint')}</p>

        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={deleteSaved} className="text-xs text-noren hover:underline underline-offset-2">
            {t('settings.clearHistory')}
          </button>
          <span role="status" className="text-xs text-lantern">
            {notice}
          </span>
        </div>
      </div>
    </div>
  );
};
