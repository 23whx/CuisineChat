import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useChatStore } from '@/store/chatStore';
import { usePeerConnection } from '@/hooks/usePeerConnection';
import { useRoomTimeout } from '@/hooks/useRoomTimeout';
import { MessageBubble } from '@/components/MessageBubble';
import { MessageInput } from '@/components/MessageInput';
import { SettingsModal } from '@/components/SettingsModal';
import { Avatar } from '@/components/Avatar';
import { ConnectionStatus, Message, MessageType } from '@/types';
import { fileToBase64 } from '@/utils/fileTransfer';
import { useNoIndexPage } from '@/seo/usePageMeta';

// 文件整体以 base64 经数据通道发送，并在每个成员的内存中保留，需要限制大小
const MAX_FILE_SIZE = 20 * 1024 * 1024;

const createMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

export const Room: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const currentUser = useChatStore((s) => s.currentUser);
  const messages = useChatStore((s) => s.messages);
  const peers = useChatStore((s) => s.peers);
  const roomPassword = useChatStore((s) => s.roomPassword);
  const reset = useChatStore((s) => s.reset);
  const clearRoom = useChatStore((s) => s.clearRoom);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { sendMessage } = usePeerConnection(
    roomId || '',
    roomPassword || '',
    currentUser?.id || '',
    currentUser?.username || '',
    currentUser?.avatarSeed || ''
  );

  // 聊天室是私人、臨時的頁面，不應被搜尋引擎收錄
  useNoIndexPage(`${roomId ?? ''} · CuisineChat`);

  // 房间超时管理（10分钟无人自动提示）
  const { isEmpty } = useRoomTimeout(10);

  useEffect(() => {
    // 直接打开邀请链接或刷新页面时没有用户/密码，带上房间号回到首页
    if (!currentUser || !roomId || !roomPassword) {
      navigate(roomId ? `/?room=${encodeURIComponent(roomId)}` : '/', { replace: true });
    }
  }, [currentUser, roomId, roomPassword, navigate]);

  // 离开房间（包括浏览器后退）时清空消息和成员，避免带入下一个房间
  useEffect(() => () => clearRoom(), [roomId, clearRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendWithBase = useCallback(
    (build: (base: { id: string; senderId: string; senderName: string; timestamp: number }) => Message) => {
      if (!currentUser) return;
      sendMessage(
        build({
          id: createMessageId(),
          senderId: currentUser.id,
          senderName: currentUser.username,
          timestamp: Date.now(),
        })
      );
    },
    [currentUser, sendMessage]
  );

  const checkFileSize = (file: Blob) => {
    if (file.size > MAX_FILE_SIZE) {
      alert(`${t('error.fileTooLarge')} (≤ ${MAX_FILE_SIZE / 1024 / 1024} MB)`);
      return false;
    }
    return true;
  };

  const handleSendMessage = (content: string) => {
    sendWithBase((base) => ({ ...base, type: MessageType.TEXT, content }));
  };

  const handleSendImage = async (file: File) => {
    if (!checkFileSize(file)) return;
    try {
      const imageData = await fileToBase64(file);
      sendWithBase((base) => ({
        ...base,
        type: MessageType.IMAGE,
        imageData,
        filename: file.name,
        size: file.size,
        mimeType: file.type || 'image/png',
      }));
    } catch (error) {
      console.error('Failed to send image:', error);
      alert(t('error.uploadFailed'));
    }
  };

  const handleSendFile = async (file: File) => {
    if (!checkFileSize(file)) return;
    try {
      const fileData = await fileToBase64(file);
      sendWithBase((base) => ({
        ...base,
        type: MessageType.FILE,
        filename: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        fileData,
      }));
    } catch (error) {
      console.error('Failed to send file:', error);
      alert(t('error.uploadFailed'));
    }
  };

  const handleSendAudio = async (audioBlob: Blob, duration: number) => {
    try {
      const audioData = await fileToBase64(audioBlob);
      sendWithBase((base) => ({
        ...base,
        type: MessageType.AUDIO,
        audioData,
        duration,
        size: audioBlob.size,
        mimeType: audioBlob.type || 'audio/webm',
      }));
    } catch (error) {
      console.error('Failed to send audio:', error);
      alert(t('error.uploadFailed'));
    }
  };

  const handleLeaveRoom = () => {
    if (window.confirm(t('room.leave') + '?')) {
      reset();
      navigate('/');
    }
  };

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/?room=${encodeURIComponent(roomId || '')}`;
    try {
      await navigator.clipboard.writeText(link);
      alert(t('room.linkCopied'));
    } catch {
      // 非安全上下文（http 局域网访问）没有剪贴板权限时，让用户手动复制
      window.prompt(t('room.copyLink'), link);
    }
  };

  const onlinePeers = useMemo(
    () => Array.from(peers.values()).filter((p) => p.status === ConnectionStatus.CONNECTED),
    [peers]
  );

  return (
    <div className="h-[100dvh] flex flex-col bg-night">
      {/* 頂欄 */}
      <header className="bg-gradient-to-b from-noren-deep to-night-surface border-b border-night-border px-3 py-2.5 flex items-center gap-2">
        <button onClick={handleLeaveRoom} className="btn-icon" title={t('room.leave')} aria-label={t('room.leave')}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="font-serif font-bold text-lg leading-tight truncate">{roomId}</h1>
          <div className="flex items-center gap-1.5 text-xs text-ink-muted">
            <span className="w-[7px] h-[7px] rounded-full bg-lantern shadow-[0_0_8px_#f2a541]" />
            {t('room.online')}: {onlinePeers.length + 1} {t('room.people')}
          </div>
        </div>

        <span className="hidden sm:inline-block font-serif text-[11px] text-noren border border-noren rounded px-1.5 py-0.5">
          {t('room.open')}
        </span>

        <button onClick={handleCopyLink} className="btn-icon" title={t('room.copyLink')} aria-label={t('room.copyLink')}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 14a4 4 0 006 0l3-3a4 4 0 00-6-6l-1 1M14 10a4 4 0 00-6 0l-3 3a4 4 0 006 6l1-1" />
          </svg>
        </button>

        <button onClick={() => setShowSettings(true)} className="btn-icon" title={t('room.settings')} aria-label={t('room.settings')}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </header>

      {/* 在座成員 */}
      <div className="bg-night-surface border-b border-night-line px-3 py-2">
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
          {currentUser && (
            <div className="flex items-center gap-1.5 pl-0.5 pr-3 py-0.5 bg-night-raised rounded-full whitespace-nowrap">
              <Avatar username={currentUser.username} size="xs" />
              <span className="text-[13px]">
                {currentUser.username} <span className="text-ink-muted">({t('room.you')})</span>
              </span>
            </div>
          )}
          {onlinePeers.map((peer) => (
            <div key={peer.peerId} className="flex items-center gap-1.5 pl-0.5 pr-3 py-0.5 bg-night-raised rounded-full whitespace-nowrap">
              <Avatar username={peer.user.username} size="xs" />
              <span className="text-[13px]">{peer.user.username}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 消息區域 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3.5 py-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center lantern-glow">
            <div className="text-center px-6">
              <div className="w-12 h-14 mx-auto mb-5 lantern-body shadow-lantern" aria-hidden="true" />
              <p className="font-serif text-lg mb-1.5">{t('home.welcome')}</p>
              <p className="text-sm text-ink-muted">{t('home.description')}</p>
              {isEmpty && (
                <div className="mt-5 px-4 py-3 rounded-xl border border-lantern/30 bg-lantern/10 text-lantern text-sm">
                  <p>{t('room.roomEmpty')}</p>
                  <p className="text-xs mt-1 text-ink-soft">{t('room.waitingForOthers')}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isSent={message.senderId === currentUser?.id}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 輸入區域 */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onSendFile={handleSendFile}
        onSendImage={handleSendImage}
        onSendAudio={handleSendAudio}
      />

      {/* 設置彈窗 */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
};
