import { useRef, useState, useCallback, useEffect } from 'react';

export type RecorderPhase =
  | 'idle'
  | 'asking'
  | 'ready'
  | 'denied'
  | 'countdown'
  | 'recording'
  | 'review';

export function useSignRecorder(maxSeconds = 180) {
  const [phase, setPhase] = useState<RecorderPhase>('idle');
  const [count, setCount] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [micEnabled, setMicEnabled] = useState(false);
  const [camEnabled, setCamEnabled] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const countdownTimerRef = useRef<number | null>(null);
  const elapsedTimerRef = useRef<number | null>(null);
  const maxTimeoutRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (elapsedTimerRef.current) {
      window.clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
    if (maxTimeoutRef.current) {
      window.clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = null;
    }
  }, []);

  const close = useCallback(() => {
    clearTimers();
    if (recRef.current && recRef.current.state === 'recording') {
      try {
        recRef.current.stop();
      } catch {
        // ignore
      }
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, [clearTimers]);

  useEffect(() => {
    return () => {
      close();
    };
  }, [close]);

  useEffect(() => {
    if (!blob) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  const open = useCallback(async (withAudio = false) => {
    setPhase('asking');
    setErrorMessage(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('Camera API is unavailable in this browser. You can upload a video file instead.');
      setPhase('denied');
      return null;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          facingMode: 'user',
        },
        audio: withAudio,
      });
      streamRef.current = s;
      setCamEnabled(true);
      setMicEnabled(withAudio);
      setPhase('ready');
      return s;
    } catch (err) {
      const msg =
        err instanceof Error && err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Allow access in your browser settings or upload a video.'
          : 'No active camera was found on this device. You can upload a recorded video instead.';
      setErrorMessage(msg);
      setPhase('denied');
      return null;
    }
  }, []);

  const toggleMic = useCallback(async () => {
    if (!streamRef.current) return;
    const audioTracks = streamRef.current.getAudioTracks();
    if (audioTracks.length > 0) {
      const next = !micEnabled;
      audioTracks.forEach((t) => {
        t.enabled = next;
      });
      setMicEnabled(next);
    } else {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStream.getAudioTracks().forEach((t) => streamRef.current?.addTrack(t));
        setMicEnabled(true);
      } catch {
        setMicEnabled(false);
      }
    }
  }, [micEnabled]);

  const toggleCam = useCallback(() => {
    if (!streamRef.current) return;
    const next = !camEnabled;
    streamRef.current.getVideoTracks().forEach((t) => {
      t.enabled = next;
    });
    setCamEnabled(next);
  }, [camEnabled]);

  const start = useCallback(() => {
    if (!streamRef.current) return;
    clearTimers();
    setPhase('countdown');
    let n = 3;
    setCount(n);

    countdownTimerRef.current = window.setInterval(() => {
      n -= 1;
      setCount(n);
      if (n <= 0) {
        if (countdownTimerRef.current) {
          window.clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        chunksRef.current = [];
        const preferredTypes = [
          'video/webm;codecs=vp9',
          'video/webm;codecs=vp8',
          'video/webm',
          'video/mp4',
        ];
        const mimeType =
          preferredTypes.find((t) => MediaRecorder.isTypeSupported(t)) || '';

        const options: MediaRecorderOptions = { videoBitsPerSecond: 2_500_000 };
        if (mimeType) options.mimeType = mimeType;

        const recorder = new MediaRecorder(streamRef.current!, options);
        recRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          clearTimers();
          const finalType = recorder.mimeType || mimeType || 'video/webm';
          const recordedBlob = new Blob(chunksRef.current, { type: finalType });
          setBlob(recordedBlob);
          setPhase('review');
        };

        recorder.start(1000);
        setElapsed(0);
        setPhase('recording');

        elapsedTimerRef.current = window.setInterval(() => {
          setElapsed((prev) => prev + 1);
        }, 1000);

        maxTimeoutRef.current = window.setTimeout(() => {
          if (recRef.current?.state === 'recording') {
            recRef.current.stop();
          }
        }, maxSeconds * 1000);
      }
    }, 1000);
  }, [clearTimers, maxSeconds]);

  const stop = useCallback(() => {
    clearTimers();
    if (recRef.current && recRef.current.state === 'recording') {
      recRef.current.stop();
    }
  }, [clearTimers]);

  const setUploadedBlob = useCallback((fileBlob: Blob) => {
    clearTimers();
    setBlob(fileBlob);
    setPhase('review');
  }, [clearTimers]);

  const discard = useCallback(() => {
    clearTimers();
    setBlob(null);
    setElapsed(0);
    setPhase(streamRef.current ? 'ready' : 'idle');
  }, [clearTimers]);

  return {
    phase,
    count,
    elapsed,
    maxSeconds,
    blob,
    previewUrl,
    stream: streamRef.current,
    micEnabled,
    camEnabled,
    errorMessage,
    open,
    start,
    stop,
    discard,
    close,
    toggleMic,
    toggleCam,
    setUploadedBlob,
  };
}
