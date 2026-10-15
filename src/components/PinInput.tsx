import React, { useRef } from 'react';

interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  length?: number;
  label?: string;
}

/**
 * 分格的數字密碼輸入：自動跳格、退格回上一格、支援整段貼上
 */
export const PinInput: React.FC<PinInputProps> = ({ value, onChange, onSubmit, length = 3, label }) => {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  // 輸入後會在同一事件內移動焦點，此時 props.value 還是舊值，
  // onFocus 必須讀取這裡同步更新的最新值，否則會誤判並把焦點拉回前一格
  const latestRef = useRef(value);
  latestRef.current = value;
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const focusAt = (index: number) => {
    inputsRef.current[Math.max(0, Math.min(length - 1, index))]?.focus();
  };

  const setDigits = (next: string[]) => {
    // 只保留從第一格開始連續填寫的數字，避免中間出現空洞
    const firstEmpty = next.findIndex((d) => !d);
    const joined = (firstEmpty === -1 ? next : next.slice(0, firstEmpty)).join('');
    latestRef.current = joined;
    onChange(joined);
  };

  const handleChange = (index: number, raw: string) => {
    const incoming = raw.replace(/\D/g, '');
    if (!incoming) return;
    const next = [...digits];
    // 一次輸入多位（貼上、自動填入）時依序往後填
    incoming.slice(0, length - index).split('').forEach((d, offset) => {
      next[index + offset] = d;
    });
    setDigits(next);
    focusAt(index + incoming.length);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = [...digits];
      if (next[index]) {
        next.splice(index);
      } else if (index > 0) {
        next.splice(index - 1);
        focusAt(index - 1);
      }
      setDigits(next);
    } else if (e.key === 'ArrowLeft') {
      focusAt(index - 1);
    } else if (e.key === 'ArrowRight') {
      focusAt(index + 1);
    } else if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      onSubmit?.();
    }
  };

  return (
    <div className="flex gap-3" role="group" aria-label={label}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputsRef.current[index] = el)}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          // 點擊時跳到第一個未填的格子，保證按順序輸入
          onFocus={(e) => {
            const filled = latestRef.current.length;
            if (index > filled) focusAt(filled);
            else e.target.select();
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={length}
          aria-label={`${label ?? ''} ${index + 1}`}
          className="input-field flex-1 min-w-0 h-14 px-0 text-center text-2xl font-bold text-lantern caret-lantern"
        />
      ))}
    </div>
  );
};
