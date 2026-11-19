import { useRef, useState, useEffect } from 'react';
import { Volume2, VolumeX, Maximize2, RotateCcw, Play } from 'lucide-react';
import presenterPoster from '@/src/assets/images/gsl_presenter_question_1794577276418.jpg';

function formatTime(secs: number): string {
  if (!Number.isFinite(secs) || secs < 0) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function SignerCard({
  src,
  poster,
  overlayCaption,
  autoPlay = true,
  replaySignal = 0,
  className = '',
}: {
  src: string;
  poster?: string;
  overlayCaption?: string;
  autoPlay?: boolean;
  replaySignal?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [speed, setSpeed] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(6);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = 0;
    if (autoPlay) {
      vid.play().then(() => setPaused(false)).catch(() => setPaused(true));
    }
  }, [src, autoPlay, replaySignal]);

  const handleReplay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = 0;
    vid.play().then(() => setPaused(false)).catch(() => {});
  };

  const handleCycleSpeed = () => {
    const speeds = [0.75, 1, 1.25];
    const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
    setSpeed(next);
  };

  const handleToggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      el.requestFullscreen?.().catch(() => {});
    }
  };

  const togglePlayPause = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play().then(() => setPaused(false)).catch(() => {});
    } else {
      vid.pause();
      setPaused(true);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-[24px] bg-[#E8E2D7] shadow-[0_14px_40px_rgba(15,23,42,0.08)] ${className}`}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster || presenterPoster}
        autoPlay={autoPlay}
        playsInline
        muted={muted}
        loop
        onClick={togglePlayPause}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          if (e.currentTarget.duration) {
            setDuration(e.currentTarget.duration);
          }
        }}
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
        className="aspect-[4/4.3] w-full cursor-pointer object-cover"
      />

      {/* Top Gradient Scrim when caption or controls sit over video */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/50 via-black/20 to-transparent" />

      {/* Top-left Question Caption Overlay (used on permission/recording screens) */}
      {overlayCaption && (
        <div className="pointer-events-none absolute left-5 right-36 top-12 z-10">
          <p className="font-heading text-lg font-semibold leading-snug text-white drop-shadow-sm md:text-xl">
            {overlayCaption}
          </p>
        </div>
      )}

      {/* Top-right Video Controls matching Figma screenshots */}
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <span className="font-mono text-xs font-medium text-white drop-shadow tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? 'Unmute video' : 'Mute video'}
          className="grid h-8 w-8 place-items-center rounded-[6px] bg-white/95 text-[#151515] shadow-xs hover:bg-white cursor-pointer"
        >
          {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>

        <button
          type="button"
          onClick={handleCycleSpeed}
          aria-label={`Playback speed ${speed}x`}
          className="h-8 rounded-[6px] bg-black/35 px-2.5 font-mono text-xs font-semibold text-white backdrop-blur-xs hover:bg-black/50 cursor-pointer tabular-nums"
        >
          {speed}x
        </button>

        <button
          type="button"
          onClick={handleToggleFullscreen}
          aria-label="Toggle fullscreen"
          className="grid h-8 w-8 place-items-center rounded-[6px] bg-black/35 text-white backdrop-blur-xs hover:bg-black/50 cursor-pointer"
        >
          <Maximize2 size={14} />
        </button>
      </div>

      {/* Play button if autoplay was paused */}
      {paused && (
        <button
          type="button"
          onClick={togglePlayPause}
          aria-label="Play signer video"
          className="absolute left-1/2 top-1/2 z-10 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white backdrop-blur-xs hover:bg-black/60 cursor-pointer"
        >
          <Play size={26} fill="white" className="ml-0.5" />
        </button>
      )}

      {/* Bottom-right Watch Again control (56px touch target) */}
      <button
        type="button"
        onClick={handleReplay}
        aria-label="Watch sign video again"
        title="Watch again"
        className="absolute bottom-4 right-4 z-10 grid h-14 w-14 place-items-center rounded-full bg-white/95 text-[#151515] shadow-md transition-transform hover:scale-105 cursor-pointer"
      >
        <RotateCcw size={22} />
      </button>
    </div>
  );
}
