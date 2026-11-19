import { useRef, useState } from 'react';
import { Upload, Video, Film, X } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Recorder } from '@/src/components/respondent/Recorder';
import { api } from '@/src/lib/api';

const SAMPLE_CLIPS = [
  { label: 'GSL Intro Signer', path: '/media/presenter-intro.mp4' },
  { label: 'GSL Question Signer', path: '/media/presenter-question.mp4' },
  { label: 'GSL Option Clip', path: '/media/presenter-option.mp4' },
];

export function VideoPicker({
  label,
  value,
  onChange,
  compact = false,
}: {
  label: string;
  value: string;
  onChange: (videoPath: string) => void;
  compact?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const { path } = await api.uploadCreatorMedia(file);
      onChange(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[#373737]">{label}</span>
        {value && (
          <span className="font-mono text-[11px] text-[#034C58]">Video ready</span>
        )}
      </div>

      <div className={`flex items-center gap-3 ${compact ? '' : 'flex-wrap'}`}>
        {value && (
          <video
            src={value}
            muted
            playsInline
            controls={!compact}
            className={`rounded-[10px] border border-[#E0E0E0] bg-[#F4F4F4] object-cover ${
              compact ? 'h-16 w-16 shrink-0' : 'h-24 w-32 shrink-0'
            }`}
          />
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={14} aria-hidden="true" />
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            onChange={handleFile}
            className="hidden"
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => setRecordOpen(true)}
          >
            <Video size={14} aria-hidden="true" />
            Record
          </Button>

          <select
            aria-label={`Choose sample clip for ${label}`}
            value={SAMPLE_CLIPS.some((c) => c.path === value) ? value : ''}
            onChange={(e) => {
              if (e.target.value) onChange(e.target.value);
            }}
            className="h-10 rounded-[10px] border border-[#E0E0E0] bg-white px-2.5 text-xs font-medium text-[#151515]"
          >
            <option value="">Sample GSL clip...</option>
            {SAMPLE_CLIPS.map((c) => (
              <option key={c.path} value={c.path}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="text-xs text-[#DC2626]" role="alert">
          {error}
        </p>
      )}

      {recordOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="Record sign language video"
        >
          <div className="w-full max-w-lg rounded-[24px] bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film size={18} className="text-[#034C58]" />
                <h2 className="font-heading text-lg font-semibold">
                  Record {label}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close recorder"
                onClick={() => setRecordOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-[#F4F4F4] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <Recorder
              keepLabel="Save Video"
              onCancel={() => setRecordOpen(false)}
              onKeep={async (blob) => {
                setUploading(true);
                try {
                  const { path } = await api.uploadCreatorMedia(blob);
                  onChange(path);
                } finally {
                  setUploading(false);
                  setRecordOpen(false);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
