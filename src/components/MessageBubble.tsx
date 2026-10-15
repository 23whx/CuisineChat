import React, { useRef, useState } from 'react';
import { Message, MessageType } from '@/types';
import { Avatar } from './Avatar';
import { formatFileSize, base64ToBlob, downloadFile } from '@/utils/fileTransfer';
import { useTranslation } from 'react-i18next';

interface MessageBubbleProps {
  message: Message;
  isSent: boolean;
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDuration = (seconds: number) => {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const mins = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// 消息内容不可变，用 memo 避免每来一条新消息就重渲染整个列表
export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({ message, isSent }) => {
  const { t } = useTranslation();
  // 氣泡內按鈕、進度條的底色：琥珀底上用深色、暗底上用淺色
  const overlay = isSent ? 'bg-lantern-ink/10 hover:bg-lantern-ink/20' : 'bg-white/10 hover:bg-white/15';
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const handleDownload = () => {
    if (message.type === MessageType.FILE && 'fileData' in message && message.fileData) {
      const blob = base64ToBlob(message.fileData, message.mimeType);
      downloadFile(blob, message.filename);
    } else if (message.type === MessageType.IMAGE && 'imageData' in message) {
      const blob = base64ToBlob(message.imageData, message.mimeType || 'image/png');
      downloadFile(blob, message.filename);
    }
  };

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // play() 可能被拒绝（格式不支持、自动播放策略），失败时不要切换成播放状态
      audio.play().then(
        () => setIsPlaying(true),
        (error) => console.error('Failed to play audio:', error)
      );
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // 系统消息
  if (
    message.type === MessageType.SYSTEM ||
    message.type === MessageType.USER_JOIN ||
    message.type === MessageType.USER_LEAVE
  ) {
    return (
      <div className="flex justify-center my-2">
        <div className="font-serif text-ink-soft text-xs px-3 py-1">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-2 mb-4 ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
      <Avatar username={message.senderName} size="sm" />
      
      <div className={`flex flex-col ${isSent ? 'items-end' : 'items-start'}`}>
        {/* 自己的消息不重複顯示名字 */}
        {!isSent && (
          <div className="text-xs text-ink-muted mb-1 px-2">
            {message.senderName}
          </div>
        )}
        
        {/* 文本消息 */}
        {message.type === MessageType.TEXT && (
          <div className={isSent ? 'message-bubble-sent' : 'message-bubble-received'}>
            {message.content}
          </div>
        )}

        {/* 图片消息 */}
        {message.type === MessageType.IMAGE && 'imageData' in message && (
          <div className={`${isSent ? 'message-bubble-sent' : 'message-bubble-received'} p-1`}>
            <img
              src={`data:${message.mimeType || 'image/png'};base64,${message.imageData}`}
              alt={message.filename}
              className="max-w-xs rounded-lg cursor-pointer"
              loading="lazy"
              decoding="async"
              onClick={handleDownload}
            />
            <div className="text-xs mt-1 opacity-75">{message.filename}</div>
          </div>
        )}

        {/* 文件消息 */}
        {message.type === MessageType.FILE && (
          <div className={isSent ? 'message-bubble-sent' : 'message-bubble-received'}>
            <div className="flex items-center gap-2">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
              </svg>
              <div className="flex-1">
                <div className="font-medium truncate max-w-[200px]">{message.filename}</div>
                <div className="text-xs opacity-75">
                  {formatFileSize(message.size)}
                </div>
              </div>
            </div>
            {'fileData' in message && message.fileData && (
              <button
                onClick={handleDownload}
                className={`mt-2 w-full py-1 px-3 ${overlay} rounded-lg text-sm transition-colors`}
              >
                {t('message.download')}
              </button>
            )}
          </div>
        )}

        {/* 语音消息 */}
        {message.type === MessageType.AUDIO && 'audioData' in message && (
          <div className={isSent ? 'message-bubble-sent' : 'message-bubble-received'}>
            <div className="flex items-center gap-3 min-w-[200px]">
              <button
                onClick={togglePlayPause}
                className={`w-10 h-10 rounded-full ${overlay} flex items-center justify-center transition-colors flex-shrink-0`}
              >
                {isPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 opacity-75" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm opacity-90">
                    {formatDuration(isPlaying ? currentTime : message.duration)}
                  </div>
                </div>
                <div className={`mt-1 h-1 rounded-full overflow-hidden ${isSent ? 'bg-lantern-ink/15' : 'bg-white/10'}`}>
                  <div 
                    className={`h-full transition-all ${isSent ? 'bg-lantern-ink/50' : 'bg-lantern'}`}
                    style={{ width: `${message.duration > 0 ? Math.min(100, (currentTime / message.duration) * 100) : 0}%` }}
                  />
                </div>
              </div>

              <audio
                ref={audioRef}
                src={`data:${message.mimeType || 'audio/webm'};base64,${message.audioData}`}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleAudioEnded}
                onPause={() => setIsPlaying(false)}
                className="hidden"
              />
            </div>
          </div>
        )}

        <div className="text-[11px] text-ink-muted mt-1 px-2 tabular-nums">
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';
