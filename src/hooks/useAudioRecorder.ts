import { useState, useRef, useCallback, useEffect, type MutableRefObject } from 'react';

export interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
}

// Safari 不支持 webm，按优先级挑选浏览器支持的编码
const PREFERRED_MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];

const pickMimeType = (): string | undefined => {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return undefined;
  return PREFERRED_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
};

const clearTimer = (ref: MutableRefObject<number | null>) => {
  if (ref.current !== null) {
    window.clearInterval(ref.current);
    ref.current = null;
  }
};

const stopStream = (ref: MutableRefObject<MediaStream | null>) => {
  ref.current?.getTracks().forEach((track) => track.stop());
  ref.current = null;
};

const revokeObjectUrl = (ref: MutableRefObject<string | null>) => {
  if (ref.current) {
    URL.revokeObjectURL(ref.current);
    ref.current = null;
  }
};

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  // 每次开始/取消都会递增；用于丢弃已过期的异步结果
  const sessionRef = useRef(0);

  const stopTimer = () => clearTimer(timerRef);

  // setRecordingTime 是稳定的，startTimer 只依赖 ref 和它
  const startTimer = useCallback(() => {
    clearTimer(timerRef);
    timerRef.current = window.setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  }, []);

  const releaseStream = () => stopStream(streamRef);

  const revokeUrl = () => revokeObjectUrl(audioUrlRef);

  const startRecording = useCallback(async () => {
    const session = ++sessionRef.current;
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // 等待授权期间已被取消/卸载（包括 StrictMode 的二次挂载），立即释放麦克风
      if (session !== sessionRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;

      const mimeType = pickMimeType();
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        releaseStream();
        if (session !== sessionRef.current) return; // 已取消，丢弃录音
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || mimeType || 'audio/webm' });
        revokeUrl();
        const url = URL.createObjectURL(blob);
        audioUrlRef.current = url;
        setAudioBlob(blob);
        setAudioUrl(url);
      };

      mediaRecorder.start(100); // 每100ms收集一次数据
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      startTimer();
    } catch (err) {
      if (session !== sessionRef.current) return;
      console.error('Failed to start recording:', err);
      releaseStream();
      setError('无法访问麦克风，请检查权限设置');
    }
  }, [startTimer]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
    setIsRecording(false);
    setIsPaused(false);
    stopTimer();
  }, []);

  const pauseRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder?.state === 'recording') {
      recorder.pause();
      setIsPaused(true);
      stopTimer();
    }
  }, []);

  const resumeRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder?.state === 'paused') {
      recorder.resume();
      setIsPaused(false);
      startTimer();
    }
  }, [startTimer]);

  const cancelRecording = useCallback(() => {
    sessionRef.current++; // 让进行中的 getUserMedia / onstop 失效
    const recorder = mediaRecorderRef.current;
    mediaRecorderRef.current = null;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
    releaseStream();
    stopTimer();
    revokeUrl();
    chunksRef.current = [];
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setAudioBlob(null);
    setAudioUrl(null);
  }, []);

  const resetRecording = useCallback(() => {
    revokeUrl();
    chunksRef.current = [];
    setRecordingTime(0);
    setAudioBlob(null);
    setAudioUrl(null);
  }, []);

  // 卸载时释放麦克风、计时器和 Object URL
  useEffect(() => {
    const session = sessionRef;
    const recorderRef = mediaRecorderRef;
    return () => {
      session.current++;
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== 'inactive') recorder.stop();
      stopStream(streamRef);
      clearTimer(timerRef);
      revokeObjectUrl(audioUrlRef);
    };
  }, []);

  return {
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
    resetRecording,
  };
};
