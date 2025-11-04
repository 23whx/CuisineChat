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
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="text-center">
          {/* 录音状态 */}
          <div className="mb-6">
            {isRecording && !audioBlob && (
              <div className="flex flex-col items-center">
                <div className={`w-20 h-20 rounded-full bg-red-500 flex items-center justify-center mb-4 ${!isPaused ? 'animate-pulse' : ''}`}>
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {formatTime(recordingTime)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {isPaused ? t('audio.paused') : t('audio.recording')}
                </div>
              </div>
            )}

            {audioBlob && audioUrl && (
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-wechat-500 flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {formatTime(recordingTime)}
                </div>
                <audio src={audioUrl} controls className="w-full mb-4" />
              </div>
            )}
          </div>

          {/* 控制按钮 */}
          <div className="flex justify-center gap-3">
            {isRecording && !audioBlob && (
              <>
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  {t('audio.cancel')}
                </button>

                {!isPaused ? (
                  <button
                    onClick={pauseRecording}
                    className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    {t('audio.pause')}
                  </button>
                ) : (
                  <button
                    onClick={resumeRecording}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    {t('audio.resume')}
                  </button>
                )}

                <button
                  onClick={stopRecording}
                  className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  {t('audio.stop')}
                </button>
              </>
            )}

            {audioBlob && (
              <>
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  {t('audio.cancel')}
                </button>
                <button
                  onClick={handleSend}
                  className="px-6 py-3 btn-wechat"
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


