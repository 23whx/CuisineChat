import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AudioRecorder } from './AudioRecorder';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onSendFile: (file: File) => void;
  onSendImage: (file: File) => void;
  onSendAudio: (audioBlob: Blob, duration: number) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onSendFile,
  onSendImage,
  onSendAudio,
}) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 中日韩输入法选词时按回车不应发送消息
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        onSendImage(file);
      } else {
        onSendFile(file);
      }
    }
    // 重置 input
    e.target.value = '';
  };

  const handleAudioSend = (audioBlob: Blob, duration: number) => {
    onSendAudio(audioBlob, duration);
    setShowAudioRecorder(false);
  };

  const handleAudioCancel = () => {
    setShowAudioRecorder(false);
  };

  return (
    <>
      <div className="border-t border-night-line bg-night-surface px-3 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <div className="max-w-3xl mx-auto flex gap-2 items-end">
          {/* 附件按钮 */}
          <div className="flex">
            <button
              onClick={() => imageInputRef.current?.click()}
              className="btn-icon"
              title={t('room.sendImage')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-icon"
              title={t('room.sendFile')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>

            <button
              onClick={() => setShowAudioRecorder(true)}
              className="btn-icon"
              title={t('room.sendAudio')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          </div>

        {/* 输入框 */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('room.typing')}
          className="flex-1 min-w-0 resize-none input-field py-2 min-h-[42px] max-h-32"
          rows={1}
        />

        {/* 发送按钮 */}
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="btn-lantern h-[42px] whitespace-nowrap"
        >
          {t('room.send')}
        </button>
      </div>

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* 录音界面 */}
      {showAudioRecorder && (
        <AudioRecorder onSend={handleAudioSend} onCancel={handleAudioCancel} />
      )}
    </>
  );
};

