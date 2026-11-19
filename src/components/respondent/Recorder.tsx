import { useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Upload,
  X,
  Check,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { useSignRecorder } from '@/src/lib/recorder';

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function Recorder({
  onKeep,
  onCancel,
  keepLabel = 'Keep Recording',
  initialVideoUrl,
}: {
  onKeep: (blob: Blob) => void;
  onCancel: () => void;
  keepLabel?: string;
  initialVideoUrl?: string | null;
}) {
  const {
    phase,
    count,
    elapsed,
    maxSeconds,
    blob,
    previewUrl,
    stream,
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
  } = useSignRecorder(180);

  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (liveVideoRef.current && stream) {
      liveVideoRef.current.srcObject = stream;
    }
  }, [stream, phase]);

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedBlob(file);
  };

  // Permission / Initial Request Screen matching Practice_Video_permission screenshot
  if (phase === 'idle' || phase === 'asking' || phase === 'denied') {
    return (
      <div className="flex flex-col items-center text-center">
        <p className="max-w-sm font-heading text-base font-semibold leading-snug text-[#151515]">
          To record video, your browser will need to request access to your
          camera &amp; microphone.
        </p>

        <div className="mt-5 flex aspect-[4/2.7] w-full max-w-md flex-col items-center justify-center rounded-[16px] bg-[#E2E2E2] px-6 text-center">
          <VideoOff size={40} className="text-[#4B4B4B]" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-[#373737]">
            {phase === 'asking'
              ? 'Requesting camera access...'
              : 'Camera and microphone not active'}
          </p>
          {errorMessage && (
            <p className="mt-2 text-xs font-medium text-[#DC2626]" role="alert">
              {errorMessage}
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="teal"
            size="lg"
            disabled={phase === 'asking'}
            onClick={() => open(false)}
          >
            {phase === 'denied' ? 'Retry Permission' : 'Request Permission'}
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={18} aria-hidden="true" />
            Upload Video
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFilePick}
            className="hidden"
          />
        </div>

        {initialVideoUrl && (
          <button
            type="button"
            onClick={onCancel}
            className="mt-4 text-sm font-medium text-[#373737] hover:underline cursor-pointer"
          >
            Keep existing answer and go back
          </button>
        )}
      </div>
    );
  }

  // Review Recorded / Uploaded Video Screen
  if (phase === 'review' && previewUrl && blob) {
    return (
      <div className="flex flex-col items-center">
        <div className="relative aspect-[4/4.3] w-full overflow-hidden rounded-[24px] bg-[#151515] shadow-lg">
          <video
            src={previewUrl}
            controls
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="teal"
            size="md"
            onClick={() => {
              close();
              onKeep(blob);
            }}
          >
            <Check size={18} aria-hidden="true" />
            {keepLabel}
          </Button>

          <Button variant="outline" size="md" onClick={discard}>
            <RotateCcw size={18} aria-hidden="true" />
            Record again
          </Button>

          <Button
            variant="danger-outline"
            size="md"
            onClick={() => {
              discard();
              close();
              onCancel();
            }}
          >
            <Trash2 size={18} aria-hidden="true" />
            Delete
          </Button>
        </div>
      </div>
    );
  }

  // Live Camera Preview + Countdown + Recording State matching Practice_recording_screen & in_progress
  const remaining = Math.max(0, maxSeconds - elapsed);
  const progressRatio = Math.min(1, elapsed / maxSeconds);
  const radius = 26;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative aspect-[4/4.3] w-full overflow-hidden rounded-[24px] bg-[#1E1E1E] shadow-lg">
      <video
        ref={liveVideoRef}
        autoPlay
        muted
        playsInline
        className={`h-full w-full -scale-x-100 object-cover ${
          camEnabled ? 'opacity-100' : 'opacity-20'
        }`}
      />

      {!camEnabled && (
        <div className="absolute inset-0 flex items-center justify-center text-white/80">
          <p className="text-sm font-medium">Camera paused</p>
        </div>
      )}

      {/* Top Scrim + 3 Circular Controls: Upload, Microphone, Camera */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/55 to-transparent" />
      <div className="absolute inset-x-0 top-4 z-10 flex items-start justify-center gap-5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center gap-1 text-white cursor-pointer"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-black/50 backdrop-blur-xs hover:bg-black/70">
            <Upload size={17} />
          </span>
          <span className="text-[11px] font-medium drop-shadow">Upload</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFilePick}
          className="hidden"
        />

        <button
          type="button"
          onClick={toggleMic}
          className="flex flex-col items-center gap-1 text-white cursor-pointer"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-black/50 backdrop-blur-xs hover:bg-black/70">
            {micEnabled ? <Mic size={17} /> : <MicOff size={17} />}
          </span>
          <span className="text-[11px] font-medium drop-shadow">Microphone</span>
        </button>

        <button
          type="button"
          onClick={toggleCam}
          className="flex flex-col items-center gap-1 text-white cursor-pointer"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-black/50 backdrop-blur-xs hover:bg-black/70">
            {camEnabled ? <Video size={17} /> : <VideoOff size={17} />}
          </span>
          <span className="text-[11px] font-medium drop-shadow">Camera</span>
        </button>
      </div>

      {/* Big 3-2-1 Countdown Overlay */}
      {phase === 'countdown' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/35 backdrop-blur-[1px]">
          <span className="font-heading text-7xl font-bold text-white drop-shadow-lg tabular-nums">
            {count}
          </span>
        </div>
      )}

      {/* Bottom Scrim + Record / Finish Controls */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/65 to-transparent" />
      <div className="absolute inset-x-0 bottom-5 z-10 flex flex-col items-center">
        {phase === 'ready' && (
          <>
            <p className="mb-3 text-sm font-semibold text-white drop-shadow">
              Hit <span className="text-[#FF4D4D]">RECORD</span> to start!
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={start}
                aria-label="Start recording"
                className="grid h-16 w-16 place-items-center rounded-full border-[3px] border-white/80 bg-[#EF2D2D] shadow-lg transition-transform hover:scale-105 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => {
                  close();
                  onCancel();
                }}
                aria-label="Cancel recording"
                className="grid h-10 w-10 place-items-center rounded-full bg-black/55 text-white hover:bg-black/75 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </>
        )}

        {phase === 'recording' && (
          <div className="flex flex-col items-center gap-1.5">
            <span className="font-mono text-xs font-semibold text-white drop-shadow tabular-nums">
              {formatDuration(remaining)}
            </span>
            <button
              type="button"
              onClick={stop}
              aria-label="Finish recording"
              className="relative grid h-16 w-16 place-items-center rounded-full bg-black/60 cursor-pointer"
            >
              <svg
                className="absolute inset-0 -rotate-90"
                width="64"
                height="64"
                viewBox="0 0 64 64"
              >
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="4"
                />
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  fill="none"
                  stroke="#EF2D2D"
                  strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progressRatio)}
                  strokeLinecap="round"
                />
              </svg>
              <span className="h-6 w-6 rounded-[5px] bg-[#EF2D2D]" />
            </button>
            <span className="text-xs font-semibold text-white drop-shadow">
              Finish
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
