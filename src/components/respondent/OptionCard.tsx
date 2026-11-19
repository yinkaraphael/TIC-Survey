import { useRef } from 'react';
import clsx from 'clsx';
import { Check } from 'lucide-react';
import optionPoster from '@/src/assets/images/gsl_presenter_option_1794577277460.jpg';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

export function OptionCard({
  index,
  label,
  src,
  thumb,
  selected,
  hintPulse = false,
  onSelect,
}: {
  index: number;
  label: string;
  src: string;
  thumb?: string;
  selected: boolean;
  hintPulse?: boolean;
  onSelect: () => void;
}) {
  const vidRef = useRef<HTMLVideoElement>(null);
  const letter = LETTERS[index] || String(index + 1);

  const handleClick = () => {
    if (vidRef.current) {
      vidRef.current.currentTime = 0;
      vidRef.current.play().catch(() => {});
    }
    onSelect();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={selected}
      className={clsx(
        'group relative flex flex-col overflow-hidden rounded-[14px] bg-[#DDEBF0] text-left transition-all duration-150 cursor-pointer min-h-[160px]',
        'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent',
        selected
          ? 'ring-2 ring-[#034C58] shadow-md'
          : 'ring-1 ring-[#B9D4DD] hover:ring-[#034C58]/60',
        hintPulse && !selected && 'ring-2 ring-[#F2BE3A]'
      )}
    >
      {/* Top Square Video Thumbnail */}
      <div className="relative aspect-[1/0.92] w-full overflow-hidden bg-[#ECE6DA] p-1.5 pb-0">
        <div className="h-full w-full overflow-hidden rounded-[10px]">
          <video
            ref={vidRef}
            src={src}
            poster={thumb || optionPoster}
            muted
            loop
            playsInline
            onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
            onMouseLeave={(e) => e.currentTarget.pause()}
            onFocus={(e) => e.currentTarget.play().catch(() => {})}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
        </div>

        {/* Diagonal Top-Right Corner Checkmark Badge matching Practice_Q2 screenshot */}
        {selected && (
          <span
            aria-hidden="true"
            className="absolute right-0 top-0 z-10 flex h-10 w-10 items-start justify-end bg-[#034C58] p-1.5 text-white"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}
          >
            <Check size={14} strokeWidth={3} />
          </span>
        )}
      </div>

      {/* Bottom Label Strip matching A Male / B Female / C Other */}
      <div className="flex items-center gap-2.5 px-3 py-3">
        <span
          className={clsx(
            'grid h-6 w-6 shrink-0 place-items-center rounded-[5px] font-heading text-xs font-bold transition-colors',
            selected
              ? 'bg-[#034C58] text-white'
              : 'border border-[#B6CDD6] bg-white text-[#151515]'
          )}
        >
          {letter}
        </span>
        <span className="truncate text-sm font-medium text-[#151515]">
          {label}
        </span>
      </div>
    </button>
  );
}
