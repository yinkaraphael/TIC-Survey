import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Save,
  Check,
  Copy,
  Eye,
  Send,
  Lock,
  Video,
} from 'lucide-react';
import { CreatorLayout } from '@/src/components/creator/CreatorLayout';
import { VideoPicker } from '@/src/components/creator/VideoPicker';
import { SignerCard } from '@/src/components/respondent/SignerCard';
import { OptionCard } from '@/src/components/respondent/OptionCard';
import { Button } from '@/src/components/ui/Button';
import { api } from '@/src/lib/api';
import type { Survey, SurveyQuestion, QuestionKind } from '@/src/lib/types';

export function SurveyBuilderPage() {
  const { id = '' } = useParams();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [selectedQIdx, setSelectedQIdx] = useState(0);
  const [previewSelectedOpts, setPreviewSelectedOpts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getSurvey(id)
      .then((res) => {
        if (!cancelled) {
          setSurvey(res.survey);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setMessage({
            kind: 'err',
            text: err instanceof Error ? err.message : 'Unable to load survey',
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const updateQuestion = (idx: number, patch: Partial<SurveyQuestion>) => {
    if (!survey) return;
    const nextQuestions = survey.questions.map((q, i) => {
      if (i !== idx) return q;
      const merged = { ...q, ...patch };
      if (
        (merged.kind === 'single' || merged.kind === 'multi') &&
        merged.options.length < 2
      ) {
        merged.options = [
          {
            id: crypto.randomUUID(),
            questionId: merged.id,
            position: 0,
            videoPath: '/media/presenter-option.mp4',
            thumbPath: '/media/presenter-option.jpg',
            label: 'Option A',
          },
          {
            id: crypto.randomUUID(),
            questionId: merged.id,
            position: 1,
            videoPath: '/media/presenter-option.mp4',
            thumbPath: '/media/presenter-option.jpg',
            label: 'Option B',
          },
        ];
      }
      return merged;
    });
    setSurvey({ ...survey, questions: nextQuestions });
  };

  const moveQuestion = (idx: number, dir: -1 | 1) => {
    if (!survey) return;
    const target = idx + dir;
    if (target < 0 || target >= survey.questions.length) return;
    const arr = [...survey.questions];
    const [item] = arr.splice(idx, 1);
    arr.splice(target, 0, item);
    setSurvey({
      ...survey,
      questions: arr.map((q, p) => ({ ...q, position: p })),
    });
    setSelectedQIdx(target);
  };

  const addQuestion = () => {
    if (!survey) return;
    const qId = crypto.randomUUID();
    const newQ: SurveyQuestion = {
      id: qId,
      surveyId: survey.id,
      position: survey.questions.length,
      kind: 'single',
      required: true,
      videoPath: '/media/presenter-question.mp4',
      thumbPath: '/media/presenter-question.jpg',
      promptText: `Question ${survey.questions.length + 1}`,
      internalNote: '',
      options: [
        {
          id: crypto.randomUUID(),
          questionId: qId,
          position: 0,
          videoPath: '/media/presenter-option.mp4',
          thumbPath: '/media/presenter-option.jpg',
          label: 'Option A',
        },
        {
          id: crypto.randomUUID(),
          questionId: qId,
          position: 1,
          videoPath: '/media/presenter-option.mp4',
          thumbPath: '/media/presenter-option.jpg',
          label: 'Option B',
        },
      ],
    };
    setSurvey({ ...survey, questions: [...survey.questions, newQ] });
    setSelectedQIdx(survey.questions.length);
  };

  const removeQuestion = (idx: number) => {
    if (!survey || survey.questions.length <= 1) return;
    const nextQuestions = survey.questions
      .filter((_, i) => i !== idx)
      .map((q, p) => ({ ...q, position: p }));
    setSurvey({ ...survey, questions: nextQuestions });
    setSelectedQIdx(Math.max(0, Math.min(selectedQIdx, nextQuestions.length - 1)));
  };

  const saveDraft = async (): Promise<Survey | null> => {
    if (!survey) return null;
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.updateSurvey(survey.id, {
        title: survey.title,
        description: survey.description,
        introVideoPath: survey.introVideoPath,
        outroVideoPath: survey.outroVideoPath,
        questions: survey.questions,
      });
      setSurvey(res.survey);
      setMessage({ kind: 'ok', text: 'Changes saved.' });
      return res.survey;
    } catch (err) {
      setMessage({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Unable to save',
      });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    const saved = await saveDraft();
    if (!saved) return;
    try {
      const res = await api.publishSurvey(saved.id);
      setSurvey(res.survey);
      setMessage({ kind: 'ok', text: 'Survey published! Share link is active.' });
    } catch (err) {
      setMessage({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Validation failed',
      });
    }
  };

  const handleClose = async () => {
    if (!survey) return;
    const res = await api.closeSurvey(survey.id);
    setSurvey(res.survey);
    setMessage({ kind: 'ok', text: 'Survey closed to new responses.' });
  };

  const copyShareLink = () => {
    if (!survey) return;
    navigator.clipboard
      ?.writeText(`${window.location.origin}/s/${survey.slug}`)
      .catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !survey) {
    return (
      <CreatorLayout title="Survey Builder" breadcrumb="Creator Studio / Builder">
        <div className="py-12 text-center text-sm text-[#373737]">
          {loading ? 'Loading builder...' : message?.text || 'Survey not found'}
        </div>
      </CreatorLayout>
    );
  }

  const activeQ = survey.questions[selectedQIdx] || survey.questions[0];

  return (
    <CreatorLayout
      title={survey.title}
      breadcrumb={`Creator Studio / ${survey.status.toUpperCase()} · /s/${survey.slug}`}
      actions={
        <>
          <Button variant="outline" size="sm" onClick={copyShareLink}>
            {copied ? <Check size={15} className="text-[#16A34A]" /> : <Copy size={15} />}
            {copied ? 'Link Copied' : 'Copy Link'}
          </Button>

          <Link to={`/s/${survey.slug}?preview=1`} target="_blank">
            <Button variant="outline" size="sm">
              <Eye size={15} />
              Preview Student
            </Button>
          </Link>

          <Button variant="outline" size="sm" disabled={saving} onClick={saveDraft}>
            <Save size={15} />
            {saving ? 'Saving...' : 'Save'}
          </Button>

          {survey.status !== 'published' ? (
            <Button variant="teal" size="sm" disabled={saving} onClick={handlePublish}>
              <Send size={15} />
              Publish
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleClose}>
              <Lock size={15} />
              Close Survey
            </Button>
          )}
        </>
      }
    >
      {message && (
        <div
          role="status"
          className={`mb-5 rounded-[10px] border px-4 py-3 text-sm font-medium ${
            message.kind === 'ok'
              ? 'border-[#034C58]/30 bg-[#E6F1F6] text-[#034C58]'
              : 'border-[#DC2626]/30 bg-red-50 text-[#DC2626]'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Two-Column Builder: Question List (Left) + Live Student Preview (Right) */}
      <div className="grid gap-8 xl:grid-cols-12">
        {/* Left Column: Survey Settings & Question Cards */}
        <div className="space-y-6 xl:col-span-7">
          {/* Survey Header & Intro/Outro Videos */}
          <section className="rounded-[16px] border border-[#E0E0E0] bg-white p-6">
            <h2 className="font-heading text-base font-semibold text-[#151515]">
              Survey Details &amp; GSL Intro / Outro
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#373737]">
                  Survey Title
                </label>
                <input
                  type="text"
                  value={survey.title}
                  onChange={(e) => setSurvey({ ...survey, title: e.target.value })}
                  className="mt-1 h-10 w-full rounded-[10px] border border-[#E0E0E0] px-3 text-sm focus:border-[#034C58]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#373737]">
                  Description
                </label>
                <input
                  type="text"
                  value={survey.description || ''}
                  onChange={(e) =>
                    setSurvey({ ...survey, description: e.target.value })
                  }
                  className="mt-1 h-10 w-full rounded-[10px] border border-[#E0E0E0] px-3 text-sm focus:border-[#034C58]"
                />
              </div>
            </div>

            <div className="mt-5 grid gap-5 border-t border-[#EEEEEE] pt-5 md:grid-cols-2">
              <VideoPicker
                compact
                label="Welcome Intro Video"
                value={survey.introVideoPath}
                onChange={(path) => setSurvey({ ...survey, introVideoPath: path })}
              />
              <VideoPicker
                compact
                label="Closing Video"
                value={survey.outroVideoPath}
                onChange={(path) => setSurvey({ ...survey, outroVideoPath: path })}
              />
            </div>
          </section>

          {/* Ordered Questions List */}
          <div className="space-y-4">
            {survey.questions.map((q, qIdx) => {
              const isSelected = qIdx === selectedQIdx;
              return (
                <section
                  key={q.id}
                  onClick={() => {
                    setSelectedQIdx(qIdx);
                    setPreviewSelectedOpts([]);
                  }}
                  className={`rounded-[16px] border bg-white p-6 transition-colors ${
                    isSelected
                      ? 'border-[#034C58] ring-1 ring-[#034C58]'
                      : 'border-[#E0E0E0]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-[#034C58] tabular-nums">
                        Q{qIdx + 1}
                      </span>
                      <select
                        aria-label={`Question ${qIdx + 1} type`}
                        value={q.kind}
                        onChange={(e) =>
                          updateQuestion(qIdx, {
                            kind: e.target.value as QuestionKind,
                          })
                        }
                        className="h-9 rounded-[8px] border border-[#E0E0E0] bg-white px-2.5 text-xs font-semibold text-[#151515]"
                      >
                        <option value="single">Single choice</option>
                        <option value="multi">Multiple choice</option>
                        <option value="signed">Signed video answer</option>
                        <option value="text">Text / Number</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs font-medium text-[#373737] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={q.required}
                          onChange={(e) =>
                            updateQuestion(qIdx, { required: e.target.checked })
                          }
                          className="h-4 w-4 accent-[#034C58]"
                        />
                        <span>Required</span>
                      </label>

                      <button
                        type="button"
                        aria-label="Move question up"
                        disabled={qIdx === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveQuestion(qIdx, -1);
                        }}
                        className="grid h-8 w-8 place-items-center rounded-[8px] border border-[#E0E0E0] text-[#373737] disabled:opacity-35 hover:bg-[#F4F4F4] cursor-pointer"
                      >
                        <ArrowUp size={14} />
                      </button>

                      <button
                        type="button"
                        aria-label="Move question down"
                        disabled={qIdx === survey.questions.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveQuestion(qIdx, 1);
                        }}
                        className="grid h-8 w-8 place-items-center rounded-[8px] border border-[#E0E0E0] text-[#373737] disabled:opacity-35 hover:bg-[#F4F4F4] cursor-pointer"
                      >
                        <ArrowDown size={14} />
                      </button>

                      <button
                        type="button"
                        aria-label="Delete question"
                        disabled={survey.questions.length <= 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeQuestion(qIdx);
                        }}
                        className="grid h-8 w-8 place-items-center rounded-[8px] border border-[#E0E0E0] text-[#999EA1] disabled:opacity-35 hover:bg-red-50 hover:text-[#DC2626] cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-[#373737]">
                        Question Prompt
                      </label>
                      <input
                        type="text"
                        value={q.promptText}
                        onChange={(e) =>
                          updateQuestion(qIdx, { promptText: e.target.value })
                        }
                        className="mt-1 h-10 w-full rounded-[10px] border border-[#E0E0E0] px-3 text-sm focus:border-[#034C58]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#373737]">
                        Internal Note (hidden from students)
                      </label>
                      <input
                        type="text"
                        value={q.internalNote || ''}
                        onChange={(e) =>
                          updateQuestion(qIdx, { internalNote: e.target.value })
                        }
                        placeholder="e.g. Safe school indicator"
                        className="mt-1 h-10 w-full rounded-[10px] border border-[#E0E0E0] px-3 text-sm focus:border-[#034C58]"
                      />
                    </div>
                  </div>

                  <div className="mt-4 border-t border-[#EEEEEE] pt-4">
                    <VideoPicker
                      label="Question Sign Language Video"
                      value={q.videoPath}
                      onChange={(path) => updateQuestion(qIdx, { videoPath: path })}
                    />
                  </div>

                  {/* Choice Options Editor */}
                  {(q.kind === 'single' || q.kind === 'multi') && (
                    <div className="mt-5 border-t border-[#EEEEEE] pt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#373737]">
                          Answer Options (2–5)
                        </span>
                        {q.options.length < 5 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateQuestion(qIdx, {
                                options: [
                                  ...q.options,
                                  {
                                    id: crypto.randomUUID(),
                                    questionId: q.id,
                                    position: q.options.length,
                                    videoPath: '/media/presenter-option.mp4',
                                    thumbPath: '/media/presenter-option.jpg',
                                    label: `Option ${String.fromCharCode(
                                      65 + q.options.length
                                    )}`,
                                  },
                                ],
                              })
                            }
                          >
                            <Plus size={14} />
                            Add Option
                          </Button>
                        )}
                      </div>

                      <div className="mt-3 space-y-3">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={opt.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#E0E0E0] bg-[#FAFAFA] p-3"
                          >
                            <div className="flex flex-1 items-center gap-3 min-w-[200px]">
                              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[6px] bg-white border border-[#E0E0E0] font-heading text-xs font-bold">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <input
                                type="text"
                                value={opt.label}
                                onChange={(e) => {
                                  const nextOpts = q.options.map((o, i) =>
                                    i === oIdx ? { ...o, label: e.target.value } : o
                                  );
                                  updateQuestion(qIdx, { options: nextOpts });
                                }}
                                aria-label={`Option ${oIdx + 1} label`}
                                className="h-9 w-full rounded-[8px] border border-[#E0E0E0] bg-white px-2.5 text-sm"
                              />
                            </div>

                            <VideoPicker
                              compact
                              label="Sign"
                              value={opt.videoPath}
                              onChange={(path) => {
                                const nextOpts = q.options.map((o, i) =>
                                  i === oIdx ? { ...o, videoPath: path } : o
                                );
                                updateQuestion(qIdx, { options: nextOpts });
                              }}
                            />

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                aria-label="Move option up"
                                disabled={oIdx === 0}
                                onClick={() => {
                                  const arr = [...q.options];
                                  const [moved] = arr.splice(oIdx, 1);
                                  arr.splice(oIdx - 1, 0, moved);
                                  updateQuestion(qIdx, { options: arr });
                                }}
                                className="grid h-8 w-8 place-items-center rounded-[6px] bg-white border border-[#E0E0E0] disabled:opacity-35 cursor-pointer"
                              >
                                <ArrowUp size={13} />
                              </button>
                              <button
                                type="button"
                                aria-label="Move option down"
                                disabled={oIdx === q.options.length - 1}
                                onClick={() => {
                                  const arr = [...q.options];
                                  const [moved] = arr.splice(oIdx, 1);
                                  arr.splice(oIdx + 1, 0, moved);
                                  updateQuestion(qIdx, { options: arr });
                                }}
                                className="grid h-8 w-8 place-items-center rounded-[6px] bg-white border border-[#E0E0E0] disabled:opacity-35 cursor-pointer"
                              >
                                <ArrowDown size={13} />
                              </button>
                              <button
                                type="button"
                                aria-label="Remove option"
                                disabled={q.options.length <= 2}
                                onClick={() =>
                                  updateQuestion(qIdx, {
                                    options: q.options.filter((_, i) => i !== oIdx),
                                  })
                                }
                                className="grid h-8 w-8 place-items-center rounded-[6px] bg-white border border-[#E0E0E0] text-[#999EA1] hover:text-[#DC2626] disabled:opacity-35 cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          <Button variant="outline" size="md" onClick={addQuestion} className="w-full">
            <Plus size={18} />
            Add Question
          </Button>
        </div>

        {/* Right Column: Live Student Preview */}
        <aside className="xl:col-span-5">
          <div className="sticky top-6 rounded-[24px] border border-[#E0E0E0] bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#034C58]">
                Live Student Preview · Question {selectedQIdx + 1}
              </span>
              <span className="font-mono text-xs text-[#999EA1]">
                {activeQ.kind}
              </span>
            </div>

            <div className="respondent-stage-bg rounded-[18px] border border-[#EEEEEE] p-5">
              <div className="grid gap-5">
                <SignerCard
                  src={activeQ.videoPath}
                  poster={activeQ.thumbPath}
                  autoPlay={false}
                />

                <div>
                  <h3 className="font-heading text-lg font-semibold text-[#151515]">
                    {activeQ.promptText}
                  </h3>

                  {(activeQ.kind === 'single' || activeQ.kind === 'multi') && (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {activeQ.options.map((opt, idx) => {
                        const isSel = previewSelectedOpts.includes(opt.id);
                        return (
                          <OptionCard
                            key={opt.id}
                            index={idx}
                            label={opt.label}
                            src={opt.videoPath}
                            thumb={opt.thumbPath}
                            selected={isSel}
                            onSelect={() => {
                              if (activeQ.kind === 'single') {
                                setPreviewSelectedOpts([opt.id]);
                              } else {
                                setPreviewSelectedOpts((prev) =>
                                  isSel
                                    ? prev.filter((x) => x !== opt.id)
                                    : [...prev, opt.id]
                                );
                              }
                            }}
                          />
                        );
                      })}
                    </div>
                  )}

                  {activeQ.kind === 'text' && (
                    <input
                      type="text"
                      readOnly
                      placeholder="Type your answer here"
                      className="mt-4 h-12 w-full rounded-[10px] border border-[#999EA1] bg-white/80 px-3 text-sm"
                    />
                  )}

                  {activeQ.kind === 'signed' && (
                    <div className="mt-4">
                      <Button variant="teal" size="md">
                        <Video size={17} />
                        Record your answer
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </CreatorLayout>
  );
}
