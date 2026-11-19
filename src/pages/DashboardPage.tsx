import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Copy,
  Check,
  ExternalLink,
  SquarePen,
  BarChart3,
  Trash2,
  Search,
} from 'lucide-react';
import { CreatorLayout } from '@/src/components/creator/CreatorLayout';
import { Button } from '@/src/components/ui/Button';
import { api } from '@/src/lib/api';
import type { Survey, SurveyStatus } from '@/src/lib/types';

export function DashboardPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SurveyStatus>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.listSurveys();
      setSurveys(res.surveys);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCopy = (survey: Survey) => {
    const url = `${window.location.origin}/s/${survey.slug}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopiedId(survey.id);
    window.setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (survey: Survey) => {
    await api.deleteSurvey(survey.id);
    setSurveys((prev) => prev.filter((s) => s.id !== survey.id));
  };

  const filtered = surveys.filter((s) => {
    const matchesSearch =
      !search.trim() ||
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.slug.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusText = (status: SurveyStatus) => {
    if (status === 'published') return 'Published';
    if (status === 'closed') return 'Closed';
    return 'Draft';
  };

  const statusColor = (status: SurveyStatus) => {
    if (status === 'published') return 'text-[#16A34A]';
    if (status === 'closed') return 'text-[#999EA1]';
    return 'text-[#D97706]';
  };

  return (
    <CreatorLayout
      title="Surveys"
      breadcrumb="Creator Studio / Surveys"
      actions={
        <Link to="/surveys/new">
          <Button variant="teal" size="sm">
            <Plus size={16} aria-hidden="true" />
            New survey
          </Button>
        </Link>
      }
    >
      {/* Filter & Search Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-xs">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999EA1]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search surveys..."
            aria-label="Search surveys"
            className="h-10 w-full rounded-[10px] border border-[#E0E0E0] bg-white pl-9 pr-3 text-sm focus:border-[#034C58]"
          />
        </div>

        <div className="flex items-center gap-1 rounded-[10px] border border-[#E0E0E0] bg-white p-1">
          {(['all', 'published', 'draft', 'closed'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`rounded-[7px] px-3 py-1.5 text-xs font-medium capitalize transition-colors cursor-pointer ${
                statusFilter === tab
                  ? 'bg-[#034C58] text-white'
                  : 'text-[#373737] hover:bg-[#F4F4F4]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Survey Table */}
      <div className="overflow-hidden rounded-[16px] border border-[#E0E0E0] bg-white">
        {loading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-11 animate-pulse rounded-[8px] bg-[#F4F4F4]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <h2 className="font-heading text-lg font-semibold text-[#151515]">
              No surveys match your filter
            </h2>
            <p className="mt-1 text-sm text-[#373737]">
              Create a new Ghana Sign Language survey or adjust your search.
            </p>
            <div className="mt-5">
              <Link to="/surveys/new">
                <Button variant="teal" size="sm">
                  Create First Survey
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#E0E0E0] bg-[#FAFAFA] text-xs font-semibold text-[#373737]">
                  <th className="px-5 py-3.5">Survey</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Questions</th>
                  <th className="px-4 py-3.5 text-right">Responses</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEEEEE]">
                {filtered.map((survey) => (
                  <tr
                    key={survey.id}
                    className="transition-colors hover:bg-[#FAFAFA]"
                  >
                    <td className="px-5 py-4">
                      <p className="font-heading font-semibold text-[#151515]">
                        {survey.title}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-[#999EA1]">
                        /s/{survey.slug}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`font-semibold ${statusColor(survey.status)}`}>
                        {statusText(survey.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-mono tabular-nums text-[#373737]">
                      {survey.questions.length}
                    </td>
                    <td className="px-4 py-4 text-right font-mono tabular-nums text-[#151515] font-semibold">
                      {survey.responseCount ?? 0}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopy(survey)}
                          title="Copy student share link"
                          className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[#E0E0E0] px-2.5 text-xs font-medium text-[#151515] hover:bg-[#F4F4F4] cursor-pointer"
                        >
                          {copiedId === survey.id ? (
                            <>
                              <Check size={14} className="text-[#16A34A]" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              <span>Share</span>
                            </>
                          )}
                        </button>

                        <Link
                          to={`/s/${survey.slug}${survey.status !== 'published' ? '?preview=1' : ''}`}
                          title="Open student view"
                          className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[#E0E0E0] px-2.5 text-xs font-medium text-[#151515] hover:bg-[#F4F4F4]"
                        >
                          <ExternalLink size={14} />
                          <span>Student</span>
                        </Link>

                        <Link
                          to={`/surveys/${survey.id}/edit`}
                          className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[#E0E0E0] px-2.5 text-xs font-medium text-[#151515] hover:bg-[#F4F4F4]"
                        >
                          <SquarePen size={14} />
                          <span>Edit</span>
                        </Link>

                        <Link
                          to={`/surveys/${survey.id}/responses`}
                          className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-[#034C58] px-3 text-xs font-medium text-white hover:bg-[#023A44]"
                        >
                          <BarChart3 size={14} />
                          <span>Responses</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDelete(survey)}
                          aria-label={`Delete ${survey.title}`}
                          className="grid h-9 w-9 place-items-center rounded-[8px] text-[#999EA1] hover:bg-red-50 hover:text-[#DC2626] cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </CreatorLayout>
  );
}
