import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Video, CornerDownLeft, Sparkles, PartyPopper, Check, ArrowRight } from 'lucide-react';
import { Stage } from '@/src/components/respondent/Stage';
import { SignerCard } from '@/src/components/respondent/SignerCard';
import { OptionCard } from '@/src/components/respondent/OptionCard';
import { Recorder } from '@/src/components/respondent/Recorder';
import { ReviewList, type UploadStatus } from '@/src/components/respondent/ReviewList';
import { useFlow, type RespondentStep } from '@/src/components/respondent/useFlow';
import { Button } from '@/src/components/ui/Button';
import { api } from '@/src/lib/api';
import {
  saveRecording,
  loadRecording,
  saveProgress,
  loadProgress,
  clearProgress,
  clearRecording,
  uploadWithRetry,
} from '@/src/lib/offline';
import type { Survey, SurveyQuestion } from '@/src/lib/types';

const PRACTICE_CHOICE_Q = {
  id: 'practice-color',
  promptText: 'Practice: Which colour do you like most?',
  videoPath: '/media/presenter-question.mp4',
  options: [
    { id: 'p-teal', label: 'Teal', videoPath: '/media/presenter-option.mp4' },
    { id: 'p-gold', label: 'Yellow', videoPath: '/media/presenter-option.mp4' },
    { id: 'p-blue', label: 'Blue', videoPath: '/media/presenter-option.mp4' },
  ],
};

const PRACTICE_SIGNED_Q = {
  id: 'practice-sign',
  promptText: 'Practice: Sign your favourite greeting to the camera',
  videoPath: '/media/presenter-question.mp4',
};

export function RespondentPage() {
  const { slug = 'upshift-2026' } = useParams();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === '1';

  const {
    sessionId,
    step,
    practiceIndex,
    index,
    answers,
    practiceAnswers,
    initSession,
    go,
    setPracticeIndex,
    answerPractice,
    answer,
    next,
    jumpTo,
  } = useFlow();

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [recordingOpen, setRecordingOpen] = useState(false);
  const [replaySignal, setReplaySignal] = useState(0);
  const [showIdleHint, setShowIdleHint] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadStatuses, setUploadStatuses] = useState<Record<string, UploadStatus>>({});

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      setLoading(true);
      setLoadError(null);
      try {
        const saved = await loadProgress(slug);
        const { sessionId: newSid, survey: loadedSurvey } = await api.startRespondent(
          slug,
          isPreview
        );
        if (cancelled) return;
        setSurvey(loadedSurvey);

        if (saved && saved.sessionId && !isPreview && saved.step !== 'done') {
          initSession(saved.sessionId, {
            step: saved.step as RespondentStep,
            index: saved.index,
            answers: saved.answers,
          });
        } else {
          initSession(newSid);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Unable to load survey');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    boot();
    return () => {
      cancelled = true;
    };
  }, [slug, isPreview, initSession]);

  // Persist progress to IndexedDB on every change
  useEffect(() => {
    if (!sessionId || !survey || isPreview) return;
    if (step === 'done') return;
    saveProgress(slug, {
      sessionId,
      slug,
      step,
      index,
      answers,
      updatedAt: Date.now(),
    }).catch(() => {});
  }, [sessionId, survey, slug, step, index, answers, isPreview]);

  // 20-second idle detour: replay signer once and highlight options
  useEffect(() => {
    setShowIdleHint(false);
    if (step !== 'question' && step !== 'practice-q') return;
    const timer = window.setTimeout(() => {
      setReplaySignal((n) => n + 1);
      setShowIdleHint(true);
    }, 20000);
    return () => window.clearTimeout(timer);
  }, [step, index, practiceIndex]);

  const currentQuestion: SurveyQuestion | undefined = survey?.questions[index];

  const handleKeyboardContinue = useCallback(
    (canContinue: boolean, action: () => void) => {
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && canContinue && !recordingOpen) {
          const tag = (e.target as HTMLElement)?.tagName;
          if (tag === 'TEXTAREA') return;
          e.preventDefault();
          action();
        }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    },
    [recordingOpen]
  );

  // Enter-key support on question screen
  const canContinueRealQuestion = (() => {
    if (step !== 'question' || !currentQuestion) return false;
    const ans = answers[currentQuestion.id];
    if (!currentQuestion.required) return true;
    if (currentQuestion.kind === 'text') return Boolean(ans?.textAnswer?.trim());
    if (currentQuestion.kind === 'single' || currentQuestion.kind === 'multi') {
      return Boolean(ans?.optionIds && ans.optionIds.length > 0);
    }
    if (currentQuestion.kind === 'signed') {
      return Boolean(ans?.hasLocalVideo || ans?.videoPath);
    }
    return false;
  })();

  useEffect(() => {
    if (step !== 'question' || !survey) return;
    return handleKeyboardContinue(canContinueRealQuestion, () => {
      setRecordingOpen(false);
      next(survey.questions.length);
    });
  }, [step, survey, canContinueRealQuestion, next, handleKeyboardContinue]);

  const handleSubmitAll = async () => {
    if (!survey || !sessionId) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const finalAnswers: Record<
        string,
        { optionIds?: string[]; textAnswer?: string; videoPath?: string }
      > = {};

      for (const q of survey.questions) {
        const ans = answers[q.id];
        if (!ans) continue;

        if (q.kind === 'signed' && ans.hasLocalVideo && !ans.videoPath) {
          setUploadStatuses((prev) => ({ ...prev, [q.id]: 'sending' }));
          const blob = await loadRecording(sessionId, q.id);
          if (blob) {
            const { uploadUrl } = await api.getRespondentUploadUrl(sessionId, q.id);
            const result = await uploadWithRetry(uploadUrl, blob, 4);
            if (!result.ok || !result.videoPath) {
              setUploadStatuses((prev) => ({ ...prev, [q.id]: 'error' }));
              throw new Error(
                'A video could not upload yet. Your recordings are safely saved—please check your connection and tap Submit again.'
              );
            }
            setUploadStatuses((prev) => ({ ...prev, [q.id]: 'sent' }));
            finalAnswers[q.id] = { videoPath: result.videoPath };
            answer(q.id, { ...ans, videoPath: result.videoPath });
          }
        } else {
          finalAnswers[q.id] = {
            optionIds: ans.optionIds,
            textAnswer: ans.textAnswer,
            videoPath: ans.videoPath,
          };
        }
      }

      await api.submitRespondent(sessionId, finalAnswers);
      for (const q of survey.questions) {
        await clearRecording(sessionId, q.id).catch(() => {});
      }
      await clearProgress(slug).catch(() => {});
      go('done');
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Unable to submit right now.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Stage isPreview={isPreview}>
        <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#E0E0E0] border-t-[#034C58]" />
          <p className="mt-4 text-lg font-medium text-[#373737]">
            Preparing sign language survey...
          </p>
        </div>
      </Stage>
    );
  }

  if (loadError || !survey) {
    return (
      <Stage isPreview={isPreview}>
        <div className="mx-auto max-w-md rounded-[24px] bg-white p-8 text-center shadow-sm">
          <h1 className="font-heading text-2xl font-semibold text-[#151515]">
            Survey Unavailable
          </h1>
          <p className="mt-2 text-base text-[#373737]">
            {loadError || 'This survey link could not be found.'}
          </p>
          <div className="mt-6">
            <Link to="/">
              <Button variant="teal" size="md">
                Go to Homepage
              </Button>
            </Link>
          </div>
        </div>
      </Stage>
    );
  }

  // Compute progress fraction (0..1) without numeric text
  const progressValue = (() => {
    if (step === 'welcome' || step === 'done') return undefined;
    if (step === 'practice-intro' || step === 'practice-q' || step === 'practice-record') {
      return 0.12;
    }
    if (step === 'ready') return 0.2;
    if (step === 'question') {
      return 0.25 + ((index + 1) / Math.max(1, survey.questions.length)) * 0.65;
    }
    if (step === 'review') return 0.95;
    return undefined;
  })();

  // STEP 1: Welcome
  if (step === 'welcome') {
    return (
      <Stage progress={progressValue} isPreview={isPreview}>
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <SignerCard src={survey.introVideoPath || '/media/presenter-intro.mp4'} />
          </div>
          <div className="lg:col-span-6">
            <p className="text-sm font-semibold text-[#034C58]">
              Ghana Sign Language Survey
            </p>
            <h1 className="mt-2 font-heading text-3xl font-bold leading-tight text-[#151515] md:text-4xl">
              {survey.title}
            </h1>
            {survey.description && (
              <p className="mt-4 max-w-lg text-lg leading-relaxed text-[#373737]">
                {survey.description}
              </p>
            )}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                variant="teal"
                size="lg"
                onClick={() => go('practice-intro')}
              >
                Start
                <ArrowRight size={20} aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </Stage>
    );
  }

  // STEP 2: Practice Area Intro (matches Practice_Area screenshot)
  if (step === 'practice-intro') {
    return (
      <Stage progress={progressValue} isPreview={isPreview}>
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <SignerCard src={survey.introVideoPath || '/media/presenter-intro.mp4'} />
          </div>
          <div className="lg:col-span-6">
            <p className="max-w-md text-base font-semibold text-[#151515]">
              In case you are not familiar with this or nervous about taking the
              survey
            </p>
            <h1 className="mt-3 max-w-md font-heading text-4xl font-bold leading-[1.12] text-[#151515] md:text-5xl">
              Let’s take a quick practice test
            </h1>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                variant="teal"
                size="lg"
                onClick={() => {
                  setPracticeIndex(0);
                  go('practice-q');
                }}
              >
                Continue
              </Button>
              <Button
                variant="teal-outline"
                size="lg"
                onClick={() => {
                  setRecordingOpen(false);
                  go('question');
                }}
              >
                Skip Practice
              </Button>
            </div>
          </div>
        </div>
      </Stage>
    );
  }

  // STEP 3: Practice Choice Question & Practice Recording Trigger
  if (step === 'practice-q') {
    if (practiceIndex === 0) {
      const selectedIds = practiceAnswers[PRACTICE_CHOICE_Q.id]?.optionIds || [];
      return (
        <Stage progress={progressValue} isPreview={isPreview}>
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <SignerCard
                src={PRACTICE_CHOICE_Q.videoPath}
                replaySignal={replaySignal}
              />
            </div>
            <div className="lg:col-span-6">
              <h1 className="font-heading text-2xl font-semibold text-[#151515]">
                {PRACTICE_CHOICE_Q.promptText}
              </h1>

              {showIdleHint && (
                <p className="mt-2 text-sm font-semibold text-[#034C58]">
                  Tap one of the video cards below to choose your answer.
                </p>
              )}

              <div className="mt-5 grid grid-cols-3 gap-4">
                {PRACTICE_CHOICE_Q.options.map((opt, oIdx) => (
                  <OptionCard
                    key={opt.id}
                    index={oIdx}
                    label={opt.label}
                    src={opt.videoPath}
                    selected={selectedIds.includes(opt.id)}
                    hintPulse={showIdleHint}
                    onSelect={() => {
                      setShowIdleHint(false);
                      answerPractice(PRACTICE_CHOICE_Q.id, { optionIds: [opt.id] });
                    }}
                  />
                ))}
              </div>

              <div className="mt-7 flex items-center gap-4">
                <Button
                  variant="teal"
                  size="lg"
                  disabled={selectedIds.length === 0}
                  onClick={() => setPracticeIndex(1)}
                >
                  Continue
                </Button>
                <span className="hidden items-center gap-1 text-xs font-medium text-[#373737] sm:inline-flex">
                  Press Enter <CornerDownLeft size={13} aria-hidden="true" />
                </span>
              </div>
            </div>
          </div>
        </Stage>
      );
    }

    // Practice Q2 -> Signed video practice (matches Practice_Q3 screenshot)
    return (
      <Stage progress={progressValue} isPreview={isPreview}>
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <SignerCard
              src={PRACTICE_SIGNED_Q.videoPath}
              replaySignal={replaySignal}
            />
          </div>
          <div className="lg:col-span-6">
            <h1 className="max-w-md font-heading text-2xl font-semibold leading-snug text-[#151515]">
              {PRACTICE_SIGNED_Q.promptText}
            </h1>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Button
                variant="teal"
                size="lg"
                onClick={() => go('practice-record')}
              >
                <Video size={20} aria-hidden="true" />
                Record your answer
              </Button>
              <Button
                variant="teal-outline"
                size="lg"
                onClick={() => go('ready')}
              >
                Skip to survey
              </Button>
            </div>
          </div>
        </div>
      </Stage>
    );
  }

  // STEP 4 & 5: Practice Camera Permission & Practice Recording (matches Practice_Video_permission & Practice_recording_screen)
  if (step === 'practice-record') {
    return (
      <Stage progress={progressValue} isPreview={isPreview}>
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <SignerCard
              src={PRACTICE_SIGNED_Q.videoPath}
              overlayCaption={PRACTICE_SIGNED_Q.promptText}
            />
          </div>
          <div className="lg:col-span-6">
            <Recorder
              keepLabel="Continue"
              onKeep={() => go('ready')}
              onCancel={() => go('practice-q')}
            />
          </div>
        </div>
      </Stage>
    );
  }

  // STEP 6: Ready ("Amazing!!! Now let's do the real thing")
  if (step === 'ready') {
    return (
      <Stage progress={progressValue} isPreview={isPreview}>
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <SignerCard src={survey.introVideoPath || '/media/presenter-intro.mp4'} />
          </div>
          <div className="lg:col-span-6">
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-4xl font-bold text-[#151515] md:text-5xl">
                Amazing!!!
              </h1>
              <Sparkles size={34} className="text-[#F2BE3A]" aria-hidden="true" />
            </div>
            <p className="mt-2 font-heading text-3xl font-medium leading-tight text-[#151515] md:text-4xl">
              Now let’s do the
              <br />
              real thing
            </p>
            <div className="mt-8">
              <Button
                variant="teal"
                size="lg"
                onClick={() => {
                  setRecordingOpen(false);
                  go('question');
                }}
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      </Stage>
    );
  }

  // STEP 7: Real Questions
  if (step === 'question' && currentQuestion) {
    const ans = answers[currentQuestion.id] || {};

    // Recording mode for a signed question
    if (currentQuestion.kind === 'signed' && recordingOpen) {
      return (
        <Stage progress={progressValue} isPreview={isPreview}>
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <SignerCard
                src={currentQuestion.videoPath}
                poster={currentQuestion.thumbPath}
                overlayCaption={currentQuestion.promptText}
                replaySignal={replaySignal}
              />
            </div>
            <div className="lg:col-span-6">
              <Recorder
                keepLabel="Keep & Continue"
                initialVideoUrl={ans.videoPath || (ans.hasLocalVideo ? 'local' : null)}
                onKeep={async (blob) => {
                  if (sessionId) {
                    await saveRecording(sessionId, currentQuestion.id, blob);
                  }
                  answer(currentQuestion.id, {
                    hasLocalVideo: true,
                    videoPath: undefined,
                  });
                  setRecordingOpen(false);
                  next(survey.questions.length);
                }}
                onCancel={() => setRecordingOpen(false)}
              />
            </div>
          </div>
        </Stage>
      );
    }

    return (
      <Stage progress={progressValue} isPreview={isPreview}>
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <SignerCard
              src={currentQuestion.videoPath}
              poster={currentQuestion.thumbPath}
              replaySignal={replaySignal}
            />
          </div>

          <div className="lg:col-span-6">
            <h1 className="font-heading text-2xl font-semibold leading-snug text-[#151515] md:text-[26px]">
              {currentQuestion.promptText}
            </h1>

            {showIdleHint && (
              <p className="mt-2 text-sm font-semibold text-[#034C58]">
                Watch the sign video on the left again, then make your choice.
              </p>
            )}

            {/* Text / Number Question (matches Practice_Q1 screenshot) */}
            {currentQuestion.kind === 'text' && (
              <div className="mt-5">
                <input
                  type="text"
                  value={ans.textAnswer || ''}
                  onChange={(e) =>
                    answer(currentQuestion.id, { textAnswer: e.target.value })
                  }
                  placeholder="Type your answer here"
                  aria-label={currentQuestion.promptText}
                  className="h-14 w-full max-w-md rounded-[10px] border border-[#999EA1] bg-[#E8F1F4]/60 px-4 text-lg text-[#151515] placeholder:text-[#5C666A] focus:border-[#034C58] focus:bg-white"
                />
              </div>
            )}

            {/* Single or Multiple Choice Question (matches Practice_Q2 & Q_3 screenshots) */}
            {(currentQuestion.kind === 'single' ||
              currentQuestion.kind === 'multi') && (
              <>
                {currentQuestion.kind === 'multi' && (
                  <p className="mt-1.5 text-sm font-medium text-[#373737]">
                    You can select more than one option
                  </p>
                )}
                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {currentQuestion.options.map((opt, oIdx) => {
                    const selectedList = ans.optionIds || [];
                    const isSelected = selectedList.includes(opt.id);
                    return (
                      <OptionCard
                        key={opt.id}
                        index={oIdx}
                        label={opt.label}
                        src={opt.videoPath}
                        thumb={opt.thumbPath}
                        selected={isSelected}
                        hintPulse={showIdleHint}
                        onSelect={() => {
                          setShowIdleHint(false);
                          if (currentQuestion.kind === 'single') {
                            answer(currentQuestion.id, { optionIds: [opt.id] });
                          } else {
                            const nextList = isSelected
                              ? selectedList.filter((id) => id !== opt.id)
                              : [...selectedList, opt.id];
                            answer(currentQuestion.id, { optionIds: nextList });
                          }
                        }}
                      />
                    );
                  })}
                </div>
              </>
            )}

            {/* Signed Video Answer Trigger (matches Practice_Q3 screenshot) */}
            {currentQuestion.kind === 'signed' && (
              <div className="mt-6 space-y-4">
                {(ans.hasLocalVideo || ans.videoPath) && (
                  <div className="inline-flex items-center gap-2 rounded-[10px] bg-[#D6EDE2] px-4 py-2.5 text-sm font-semibold text-[#034C58]">
                    <Check size={18} aria-hidden="true" />
                    <span>Video Response Recorded</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4">
                  <Button
                    variant="teal"
                    size="lg"
                    onClick={() => setRecordingOpen(true)}
                  >
                    <Video size={20} aria-hidden="true" />
                    {ans.hasLocalVideo || ans.videoPath
                      ? 'Re-record your answer'
                      : 'Record your answer'}
                  </Button>

                  {(ans.hasLocalVideo || ans.videoPath || !currentQuestion.required) && (
                    <Button
                      variant="teal-outline"
                      size="lg"
                      onClick={() => next(survey.questions.length)}
                    >
                      Continue
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Primary Continue Button for Choice & Text Questions */}
            {currentQuestion.kind !== 'signed' && (
              <div className="mt-7 flex items-center gap-4">
                <Button
                  variant="teal"
                  size="lg"
                  disabled={!canContinueRealQuestion}
                  onClick={() => next(survey.questions.length)}
                >
                  Continue
                </Button>
                <span className="hidden items-center gap-1 text-xs font-medium text-[#373737] sm:inline-flex">
                  Press Enter <CornerDownLeft size={13} aria-hidden="true" />
                </span>
              </div>
            )}
          </div>
        </div>
      </Stage>
    );
  }

  // STEP 8: Review Answers (matches Review_answers screenshot)
  if (step === 'review') {
    return (
      <Stage progress={progressValue} isPreview={isPreview}>
        <ReviewList
          survey={survey}
          answers={answers}
          onEdit={(i) => {
            setRecordingOpen(false);
            jumpTo(i);
          }}
          onSubmit={handleSubmitAll}
          uploadStatuses={uploadStatuses}
          submitting={submitting}
          submitError={submitError}
        />
      </Stage>
    );
  }

  // STEP 9: Congratulations (matches Q_5 screenshot)
  return (
    <Stage isPreview={isPreview}>
      <div className="mx-auto flex max-w-md flex-col items-center py-12 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-[#FBF4E4] text-[#034C58] shadow-xs">
          <PartyPopper size={38} aria-hidden="true" />
        </div>
        <h1 className="mt-6 font-heading text-4xl font-bold text-[#151515] md:text-5xl">
          Congratulations
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-[#373737]">
          We’re proud to hear your story — every sign, every word, matters.
        </p>
        <div className="mt-8">
          <Link to="/">
            <Button variant="teal" size="lg">
              Go to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </Stage>
  );
}
