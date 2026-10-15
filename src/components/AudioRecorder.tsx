import React from 'react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useTranslation } from 'react-i18next';

interface AudioRecorderProps {
  onSend: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onSend, onCancel }) => {
  const { t } = useTranslation();
  const {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    audioUrl,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
  } = useAudioRecorder();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob, recordingTime);
    }
  };

  const handleCancel = () => {
    cancelRecording();
    onCancel();
  };

  React.useEffect(() => {
    startRecording();
    return () => {
      cancelRecording();
    };
  }, [startRecording, cancelRecording]);

  return (
    <div className="modal-backdrop">
      <div role="dialog" aria-modal="true" className="modal-panel max-w-md p-6">
        <div className="text-center">
          {/* 录音状态 */}
          <div className="mb-6">
            {isRecording && !audioBlob && (
              <div className="flex flex-col items-center">
                <div className={`w-20 h-20 rounded-full bg-noren shadow-[0_0_40px_-6px_#d64933] flex items-center justify-center mb-4 ${!isPaused ? 'animate-pulse' : ''}`}>
                  <svg className="w-10 h-10 text-ink" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="font-serif text-3xl font-bold mb-2 tabular-nums">
                  {formatTime(recordingTime)}
                </div>
                <div className="text-sm text-ink-muted">
                  {isPaused ? t('audio.paused') : t('audio.recording')}
                </div>
              </div>
            )}

            {audioBlob && audioUrl && (
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-lantern text-lantern-ink shadow-lantern flex items-center justify-center mb-4">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="font-serif text-2xl font-bold mb-4 tabular-nums">
                  {formatTime(recordingTime)}
                </div>
                <audio src={audioUrl} controls className="w-full mb-4" />
              </div>
            )}
          </div>

          {/* 麦克风不可用 / 正在生成录音 */}
          {!isRecording && !audioBlob && (
            <div className="mb-6 text-sm text-ink-muted">
              {error ?? '…'}
            </div>
          )}

          {/* 控制按钮 */}
          <div className="flex justify-center gap-3">
            {/* 未在录音时也必须能关闭弹窗，否则拒绝麦克风权限后会被卡住 */}
            {!isRecording && !audioBlob && (
              <button
                onClick={handleCancel}
                className="btn-ghost px-5 py-2.5 text-ink-muted"
              >
                {t('audio.cancel')}
              </button>
            )}

            {isRecording && !audioBlob && (
              <>
                <button
                  onClick={handleCancel}
                  className="btn-ghost px-5 py-2.5 text-ink-muted"
                >
                  {t('audio.cancel')}
                </button>

                {!isPaused ? (
                  <button
                    onClick={pauseRecording}
                    className="btn-ghost px-5 py-2.5"
                  >
                    {t('audio.pause')}
                  </button>
                ) : (
                  <button
                    onClick={resumeRecording}
                    className="btn-ghost px-5 py-2.5"
                  >
                    {t('audio.resume')}
                  </button>
                )}

                <button
                  onClick={stopRecording}
                  className="px-5 py-2.5 rounded-xl bg-noren text-ink font-bold transition-all hover:brightness-110 active:scale-[0.97]"
                >
                  {t('audio.stop')}
                </button>
              </>
            )}

            {audioBlob && (
              <>
                <button
                  onClick={handleCancel}
                  className="btn-ghost px-5 py-2.5 text-ink-muted"
                >
                  {t('audio.cancel')}
                </button>
                <button
                  onClick={handleSend}
                  className="btn-lantern px-6 py-2.5"
                >
                  {t('audio.send')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};



