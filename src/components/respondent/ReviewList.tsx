import { useState } from 'react';
import { Check, Video, SquarePen, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { SignerCard } from '@/src/components/respondent/SignerCard';
import type { Survey } from '@/src/lib/types';
import type { RespondentAnswer } from '@/src/components/respondent/useFlow';

export type UploadStatus = 'waiting' | 'sending' | 'sent' | 'error';

export function ReviewList({
  survey,
  answers,
  onEdit,
  onSubmit,
  uploadStatuses,
  submitting,
  submitError,
}: {
  survey: Survey;
  answers: Record<string, RespondentAnswer>;
  onEdit: (index: number) => void;
  onSubmit: () => void;
  uploadStatuses: Record<string, UploadStatus>;
  submitting: boolean;
  submitError: string | null;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const getAnswerDisplay = (qIdx: number) => {
    const q = survey.questions[qIdx];
    const ans = answers[q.id];
    if (!ans) return { kind: 'empty' as const, label: 'Not answered yet' };

    if (q.kind === 'signed') {
      if (ans.hasLocalVideo || ans.videoPath) {
        return { kind: 'video' as const, label: 'Video Response Recorded' };
      }
      return { kind: 'empty' as const, label: 'No video recorded' };
    }

    if (q.kind === 'text') {
      return ans.textAnswer?.trim()
        ? { kind: 'text' as const, label: ans.textAnswer.trim() }
        : { kind: 'empty' as const, label: 'Not answered yet' };
    }

    const chosenLabels = (ans.optionIds || [])
      .map((id) => q.options.find((o) => o.id === id)?.label)
      .filter(Boolean);

    return chosenLabels.length > 0
      ? { kind: 'choice' as const, label: chosenLabels.join(', ') }
      : { kind: 'empty' as const, label: 'No option selected' };
  };

  return (
    <div className="mx-auto w-full max-w-3xl py-4">
      <h1 className="font-heading text-3xl font-bold text-[#151515] md:text-4xl">
        Take a minute to review your answers
      </h1>
      <p className="mt-2 text-base text-[#373737] md:text-lg">
        Feel free to re-record any video or change your answers before moving on
        to submit.
      </p>

      <div className="mt-7 space-y-4">
        {survey.questions.map((q, idx) => {
          const display = getAnswerDisplay(idx);
          const status = uploadStatuses[q.id];

          return (
            <div
              key={q.id}
              className="flex items-center justify-between gap-4 rounded-[14px] border border-[#E0E0E0] bg-white/85 px-6 py-5 shadow-xs backdrop-blur-xs"
            >
              <div className="min-w-0 flex-1">
                <p className="font-heading text-base font-semibold text-[#151515]">
                  {q.promptText}
                </p>

                <div className="mt-2.5 flex items-center gap-3">
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-[6px] ${
                      display.kind === 'video'
                        ? 'bg-[#D6EDE2] text-[#034C58]'
                        : display.kind === 'empty'
                        ? 'bg-[#EEEEEE] text-[#999EA1]'
                        : 'bg-[#E1ECEF] text-[#151515]'
                    }`}
                  >
                    {display.kind === 'video' ? (
                      <Video size={16} aria-hidden="true" />
                    ) : (
                      <Check size={16} strokeWidth={2.5} aria-hidden="true" />
                    )}
                  </span>

                  <span className="truncate text-sm font-medium text-[#373737]">
                    {display.label}
                  </span>

                  {status === 'sending' && (
                    <Loader2 size={16} className="animate-spin text-[#034C58]" aria-label="Uploading" />
                  )}
                  {status === 'sent' && (
                    <CheckCircle2 size={16} className="text-[#16A34A]" aria-label="Uploaded" />
                  )}
                  {status === 'error' && (
                    <AlertCircle size={16} className="text-[#DC2626]" aria-label="Upload queued for retry" />
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onEdit(idx)}
                aria-label={`Edit answer for ${q.promptText}`}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-[10px] bg-[#034C58] text-white transition-colors hover:bg-[#023A44] cursor-pointer"
              >
                <SquarePen size={20} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>

      {submitError && (
        <p className="mt-4 text-sm font-semibold text-[#DC2626]" role="alert">
          {submitError}
        </p>
      )}

      <div className="mt-8">
        <Button
          variant="teal"
          size="lg"
          disabled={submitting}
          onClick={() => setConfirmOpen(true)}
        >
          {submitting ? 'Submitting...' : 'Submit Response'}
        </Button>
      </div>

      {/* One-Tap Confirmation Modal with Signer Video */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-submit-title"
        >
          <div className="grid w-full max-w-2xl items-center gap-6 rounded-[24px] bg-white p-6 shadow-2xl md:grid-cols-2 md:p-8">
            <SignerCard src={survey.outroVideoPath || '/media/presenter-intro.mp4'} />

            <div>
              <h2
                id="confirm-submit-title"
                className="font-heading text-2xl font-bold text-[#151515]"
              >
                Are you finished?
              </h2>
              <p className="mt-2 text-base text-[#373737]">
                Tap Confirm below to send your survey answers privately.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  variant="teal"
                  size="lg"
                  disabled={submitting}
                  onClick={() => {
                    setConfirmOpen(false);
                    onSubmit();
                  }}
                >
                  {submitting ? 'Sending...' : 'Confirm & Submit'}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  disabled={submitting}
                  onClick={() => setConfirmOpen(false)}
                >
                  Go Back
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
