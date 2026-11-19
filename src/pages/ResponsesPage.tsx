import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import JSZip from 'jszip';
import {
  Download,
  FileArchive,
  Play,
  CheckCircle2,
  X,
  ArrowLeft,
} from 'lucide-react';
import { CreatorLayout } from '@/src/components/creator/CreatorLayout';
import { Button } from '@/src/components/ui/Button';
import { api } from '@/src/lib/api';
import type {
  Survey,
  SessionWithResponses,
  QuestionResponse,
  SurveyQuestion,
} from '@/src/lib/types';

export function ResponsesPage() {
  const { id = '' } = useParams();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [sessions, setSessions] = useState<SessionWithResponses[]>([]);
  const [filterQuestionId, setFilterQuestionId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [activeReview, setActiveReview] = useState<{
    session: SessionWithResponses;
    question: SurveyQuestion;
    response: QuestionResponse;
  } | null>(null);
  const [transcriptDraft, setTranscriptDraft] = useState('');
  const [reviewedDraft, setReviewedDraft] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [exportingZip, setExportingZip] = useState(false);

  const reviewVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getResponses(id)
      .then((res) => {
        if (!cancelled) {
          setSurvey(res.survey);
          setSessions(res.sessions);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (reviewVideoRef.current) {
      reviewVideoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, activeReview]);

  const openReviewer = (
    session: SessionWithResponses,
    question: SurveyQuestion,
    response: QuestionResponse
  ) => {
    setActiveReview({ session, question, response });
    setTranscriptDraft(response.transcript || '');
    setReviewedDraft(response.reviewed);
    setPlaybackRate(1);
  };

  const handleSaveReview = async () => {
    if (!activeReview) return;
    setSavingReview(true);
    try {
      const { response } = await api.updateResponseReview(
        activeReview.response.id,
        {
          transcript: transcriptDraft,
          reviewed: reviewedDraft,
        }
      );
      setSessions((prev) =>
        prev.map((s) =>
          s.id !== activeReview.session.id
            ? s
            : {
                ...s,
                responses: s.responses.map((r) =>
                  r.id === response.id ? response : r
                ),
              }
        )
      );
      setActiveReview(null);
    } finally {
      setSavingReview(false);
    }
  };

  const handleExportCsv = () => {
    if (!survey) return;
    const headers = [
      'session_id',
      'completed_at',
      ...survey.questions.map((q, i) => `Q${i + 1}: ${q.promptText}`),
    ];

    const rows = sessions.map((sess) => {
      const cols = survey.questions.map((q) => {
        const resp = sess.responses.find((r) => r.questionId === q.id);
        if (!resp) return '';
        if (q.kind === 'text') return resp.textAnswer || '';
        if (q.kind === 'signed') {
          return resp.transcript
            ? `${resp.transcript} (${resp.videoPath || 'video'})`
            : resp.videoPath || 'Video recorded';
        }
        return (resp.optionIds || [])
          .map((oid) => q.options.find((o) => o.id === oid)?.label || oid)
          .join('; ');
      });
      return [sess.id, sess.completedAt || sess.startedAt, ...cols]
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(',');
    });

    const csv = [headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${survey.slug}-responses.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportZip = async () => {
    if (!survey) return;
    setExportingZip(true);
    try {
      const zip = new JSZip();
      const manifest: Array<{
        sessionId: string;
        questionId: string;
        questionPrompt: string;
        fileName: string;
        transcript: string;
        reviewed: boolean;
      }> = [];

      for (const sess of sessions) {
        for (const resp of sess.responses) {
          if (!resp.videoPath) continue;
          const q = survey.questions.find((item) => item.id === resp.questionId);
          const ext = resp.videoPath.endsWith('.mp4') ? 'mp4' : 'webm';
          const fileName = `videos/${sess.id}_${resp.questionId}.${ext}`;
          try {
            const res = await fetch(resp.videoPath);
            if (res.ok) {
              const buf = await res.arrayBuffer();
              zip.file(fileName, buf);
            }
          } catch {
            // ignore missing video file
          }
          manifest.push({
            sessionId: sess.id,
            questionId: resp.questionId,
            questionPrompt: q?.promptText || resp.questionId,
            fileName,
            transcript: resp.transcript || '',
            reviewed: resp.reviewed,
          });
        }
      }

      zip.file('manifest.json', JSON.stringify(manifest, null, 2));
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${survey.slug}-videos.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportingZip(false);
    }
  };

  if (loading || !survey) {
    return (
      <CreatorLayout title="Responses" breadcrumb="Creator Studio / Responses">
        <div className="py-12 text-center text-sm text-[#373737]">
          Loading responses...
        </div>
      </CreatorLayout>
    );
  }

  const visibleQuestions =
    filterQuestionId === 'all'
      ? survey.questions
      : survey.questions.filter((q) => q.id === filterQuestionId);

  const choiceQuestions = visibleQuestions.filter(
    (q) => q.kind === 'single' || q.kind === 'multi'
  );

  return (
    <CreatorLayout
      title={`${survey.title} — Responses`}
      breadcrumb={`Creator Studio / Surveys / ${sessions.length} Completed`}
      actions={
        <>
          <Link to={`/surveys/${survey.id}/edit`}>
            <Button variant="outline" size="sm">
              <ArrowLeft size={15} />
              Builder
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download size={15} />
            Export CSV
          </Button>
          <Button
            variant="teal"
            size="sm"
            disabled={exportingZip}
            onClick={handleExportZip}
          >
            <FileArchive size={15} />
            {exportingZip ? 'Bundling...' : 'Export Videos (.zip)'}
          </Button>
        </>
      }
    >
      {/* Question Filter */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label
            htmlFor="filter-q"
            className="text-xs font-semibold text-[#373737]"
          >
            Filter by question
          </label>
          <select
            id="filter-q"
            value={filterQuestionId}
            onChange={(e) => setFilterQuestionId(e.target.value)}
            className="h-10 rounded-[10px] border border-[#E0E0E0] bg-white px-3 text-sm"
          >
            <option value="all">All questions ({survey.questions.length})</option>
            {survey.questions.map((q, idx) => (
              <option key={q.id} value={q.id}>
                Q{idx + 1}: {q.promptText}
              </option>
            ))}
          </select>
        </div>

        <span className="font-mono text-xs text-[#373737] tabular-nums">
          {sessions.length} submitted {sessions.length === 1 ? 'session' : 'sessions'}
        </span>
      </div>

      {/* Choice Summary Charts */}
      {choiceQuestions.length > 0 && (
        <section className="mb-8 grid gap-6 md:grid-cols-2">
          {choiceQuestions.map((q) => {
            const totalForQ = sessions.filter((s) =>
              s.responses.some((r) => r.questionId === q.id)
            ).length;

            return (
              <div
                key={q.id}
                className="rounded-[16px] border border-[#E0E0E0] bg-white p-6"
              >
                <h2 className="font-heading text-sm font-semibold text-[#151515]">
                  {q.promptText}
                </h2>
                <div className="mt-4 space-y-3">
                  {q.options.map((opt) => {
                    const count = sessions.filter((s) =>
                      s.responses.some(
                        (r) =>
                          r.questionId === q.id &&
                          r.optionIds?.includes(opt.id)
                      )
                    ).length;
                    const pct = totalForQ ? Math.round((count / totalForQ) * 100) : 0;

                    return (
                      <div key={opt.id}>
                        <div className="flex justify-between text-xs font-medium text-[#373737]">
                          <span>{opt.label}</span>
                          <span className="font-mono tabular-nums">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-[#F4F4F4]">
                          <div
                            className="h-full rounded-full bg-[#034C58] transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Respondent Grid */}
      <div className="overflow-hidden rounded-[16px] border border-[#E0E0E0] bg-white">
        {sessions.length === 0 ? (
          <div className="p-12 text-center">
            <h2 className="font-heading text-lg font-semibold text-[#151515]">
              No completed student responses yet
            </h2>
            <p className="mt-1 text-sm text-[#373737]">
              Share the student survey link to start collecting Ghana Sign
              Language responses.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#E0E0E0] bg-[#FAFAFA] text-xs font-semibold text-[#373737]">
                  <th className="px-5 py-3.5">Respondent</th>
                  {visibleQuestions.map((q) => (
                    <th key={q.id} className="min-w-[180px] px-4 py-3.5">
                      {q.internalNote || q.promptText}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEEEEE]">
                {sessions.map((sess, sIdx) => (
                  <tr key={sess.id} className="hover:bg-[#FAFAFA]">
                    <td className="px-5 py-4 align-top">
                      <p className="font-mono text-xs font-semibold text-[#151515] tabular-nums">
                        Student #{sIdx + 1}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-[#999EA1] tabular-nums">
                        {new Date(sess.completedAt || sess.startedAt).toLocaleDateString()}
                      </p>
                    </td>

                    {visibleQuestions.map((q) => {
                      const resp = sess.responses.find(
                        (r) => r.questionId === q.id
                      );
                      if (!resp) {
                        return (
                          <td key={q.id} className="px-4 py-4 text-xs text-[#999EA1]">
                            —
                          </td>
                        );
                      }

                      if (q.kind === 'signed') {
                        return (
                          <td key={q.id} className="px-4 py-4 align-top">
                            <div className="flex flex-col items-start gap-1.5">
                              <button
                                type="button"
                                onClick={() => openReviewer(sess, q, resp)}
                                className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-[#E6F1F6] px-3 text-xs font-semibold text-[#034C58] hover:bg-[#D1E6EE] cursor-pointer"
                              >
                                <Play size={13} fill="currentColor" />
                                <span>Play Sign Video</span>
                              </button>
                              {resp.reviewed && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#16A34A]">
                                  <CheckCircle2 size={12} />
                                  Reviewed
                                </span>
                              )}
                              {resp.transcript && (
                                <p className="line-clamp-2 max-w-[220px] text-xs text-[#373737]">
                                  “{resp.transcript}”
                                </p>
                              )}
                            </div>
                          </td>
                        );
                      }

                      if (q.kind === 'text') {
                        return (
                          <td key={q.id} className="px-4 py-4 align-top font-medium text-[#151515]">
                            {resp.textAnswer}
                          </td>
                        );
                      }

                      const labels = (resp.optionIds || [])
                        .map((oid) => q.options.find((o) => o.id === oid)?.label)
                        .filter(Boolean)
                        .join(', ');

                      return (
                        <td key={q.id} className="px-4 py-4 align-top text-[#151515]">
                          {labels}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Signed Video Reviewer Modal */}
      {activeReview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reviewer-title"
        >
          <div className="grid w-full max-w-3xl gap-6 rounded-[24px] bg-white p-6 shadow-2xl md:grid-cols-12 md:p-8">
            <div className="md:col-span-6">
              <div className="overflow-hidden rounded-[16px] bg-[#151515]">
                <video
                  ref={reviewVideoRef}
                  src={activeReview.response.videoPath}
                  controls
                  autoPlay
                  playsInline
                  className="aspect-[4/4.3] w-full object-cover"
                />
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#373737]">
                  Playback speed
                </span>
                <div className="flex gap-1.5">
                  {[0.5, 0.75, 1, 1.25].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => setPlaybackRate(spd)}
                      className={`rounded-[6px] px-2.5 py-1 font-mono text-xs font-semibold cursor-pointer tabular-nums ${
                        playbackRate === spd
                          ? 'bg-[#034C58] text-white'
                          : 'border border-[#E0E0E0] bg-white text-[#151515]'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between md:col-span-6">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h2
                    id="reviewer-title"
                    className="font-heading text-lg font-semibold text-[#151515]"
                  >
                    {activeReview.question.promptText}
                  </h2>
                  <button
                    type="button"
                    aria-label="Close reviewer"
                    onClick={() => setActiveReview(null)}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-[#F4F4F4] cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <label
                  htmlFor="transcript-box"
                  className="mt-5 block text-xs font-semibold text-[#373737]"
                >
                  Written GSL Transcript / Reviewer Notes
                </label>
                <textarea
                  id="transcript-box"
                  rows={5}
                  value={transcriptDraft}
                  onChange={(e) => setTranscriptDraft(e.target.value)}
                  placeholder="Type English translation of the student's signed response..."
                  className="mt-1.5 w-full rounded-[10px] border border-[#E0E0E0] p-3 text-sm text-[#151515] focus:border-[#034C58]"
                />

                <label className="mt-4 flex items-center gap-2.5 text-sm font-medium text-[#151515] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reviewedDraft}
                    onChange={(e) => setReviewedDraft(e.target.checked)}
                    className="h-4 w-4 accent-[#034C58]"
                  />
                  <span>Mark response as reviewed</span>
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveReview(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="teal"
                  size="sm"
                  disabled={savingReview}
                  onClick={handleSaveReview}
                >
                  {savingReview ? 'Saving...' : 'Save Review'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </CreatorLayout>
  );
}
