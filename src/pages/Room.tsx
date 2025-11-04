import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useChatStore } from '@/store/chatStore';
import { usePeerConnection } from '@/hooks/usePeerConnection';
import { useRoomTimeout } from '@/hooks/useRoomTimeout';
import { MessageBubble } from '@/components/MessageBubble';
import { MessageInput } from '@/components/MessageInput';
import { SettingsModal } from '@/components/SettingsModal';
import { Avatar } from '@/components/Avatar';
import { Footer } from '@/components/Footer';
import { Message, MessageType } from '@/types';
import { fileToBase64 } from '@/utils/fileTransfer';

export const Room: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const { currentUser, messages, peers, reset, roomPassword } = useChatStore();
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { sendMessage } = usePeerConnection(
    roomId || '',
    roomPassword || '',
    currentUser?.id || '',
    currentUser?.username || '',
    currentUser?.avatarSeed || ''
  );

  // 房间超时管理（10分钟无人自动提示）
  const { isEmpty } = useRoomTimeout(10);

  useEffect(() => {
    if (!currentUser || !roomId) {
      navigate('/');
    }
  }, [currentUser, roomId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (content: string) => {
    if (!currentUser) return;

    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: MessageType.TEXT,
      senderId: currentUser.id,
      senderName: currentUser.username,
      timestamp: Date.now(),
      content,
    };

    sendMessage(message);
  };

  const handleSendImage = async (file: File) => {
    if (!currentUser) return;

    try {
      const imageData = await fileToBase64(file);
      const message: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: MessageType.IMAGE,
        senderId: currentUser.id,
        senderName: currentUser.username,
        timestamp: Date.now(),
        imageData,
        filename: file.name,
        size: file.size,
      };

      sendMessage(message);
    } catch (error) {
      console.error('Failed to send image:', error);
    }
  };

  const handleSendFile = async (file: File) => {
    if (!currentUser) return;

    try {
      const fileData = await fileToBase64(file);
      const message: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: MessageType.FILE,
        senderId: currentUser.id,
        senderName: currentUser.username,
        timestamp: Date.now(),
        filename: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        fileData,
      };

      sendMessage(message);
    } catch (error) {
      console.error('Failed to send file:', error);
    }
  };

  const handleSendAudio = async (audioBlob: Blob, duration: number) => {
    if (!currentUser) return;

    try {
      const audioData = await fileToBase64(audioBlob as File);
      const message: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: MessageType.AUDIO,
        senderId: currentUser.id,
        senderName: currentUser.username,
        timestamp: Date.now(),
        audioData,
        duration,
        size: audioBlob.size,
      };

      sendMessage(message);
    } catch (error) {
      console.error('Failed to send audio:', error);
    }
  };

  const handleLeaveRoom = () => {
    if (window.confirm(t('room.leave') + '?')) {
      reset();
      navigate('/');
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link);
    alert(t('room.linkCopied'));
  };

  const onlinePeers = Array.from(peers.values()).filter(p => p.status === 'connected');

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* 顶部栏 */}
      <div className="bg-wechat-500 dark:bg-wechat-700 text-white px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">🍜 {roomId}</h1>
          <div className="text-sm bg-white/20 px-3 py-1 rounded-full">
            {t('room.online')}: {onlinePeers.length + 1} {t('room.people')}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title={t('room.copyLink')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title={t('room.settings')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          
          <button
            onClick={handleLeaveRoom}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title={t('room.leave')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* 在线用户列表 */}
      {onlinePeers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
            {currentUser && (
              <div className="flex items-center gap-2 px-3 py-1 bg-wechat-50 dark:bg-wechat-900 rounded-full whitespace-nowrap">
                <Avatar username={currentUser.username} size="sm" />
                <span className="text-sm font-medium">{currentUser.username} ({t('room.you')})</span>
              </div>
            )}
            {onlinePeers.map((peer) => (
              <div
                key={peer.peerId}
                className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full whitespace-nowrap"
              >
                <Avatar username={peer.user.username} size="sm" />
                <span className="text-sm">{peer.user.username}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-400 dark:text-gray-500">
              <p className="text-lg mb-2">👋 {t('home.welcome')}</p>
              <p className="text-sm">{t('home.description')}</p>
              {isEmpty && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-700 dark:text-yellow-400 text-sm">
                  <p>⏰ {t('room.roomEmpty')}</p>
                  <p className="text-xs mt-1">{t('room.waitingForOthers')}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
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

      {/* 输入区域 */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onSendFile={handleSendFile}
        onSendImage={handleSendImage}
        onSendAudio={handleSendAudio}
      />

      {/* 设置模态框 */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Footer */}
      <Footer />
    </div>
  );
};

