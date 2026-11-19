import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CreatorLayout } from '@/src/components/creator/CreatorLayout';
import { Button } from '@/src/components/ui/Button';
import { api } from '@/src/lib/api';

export function NewSurveyPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (title.trim().length < 2) {
      setError('Enter a survey title (at least 2 characters).');
      return;
    }
    setCreating(true);
    try {
      const { survey } = await api.createSurvey(title.trim(), description.trim());
      navigate(`/surveys/${survey.id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create survey');
    } finally {
      setCreating(false);
    }
  };

  return (
    <CreatorLayout
      title="New Survey"
      breadcrumb="Creator Studio / Surveys / New"
      actions={
        <Link to="/dashboard">
          <Button variant="outline" size="sm">
            Cancel
          </Button>
        </Link>
      }
    >
      <div className="mx-auto max-w-xl rounded-[20px] border border-[#E0E0E0] bg-white p-8">
        <h2 className="font-heading text-xl font-semibold text-[#151515]">
          Name your sign language survey
        </h2>
        <p className="mt-1.5 text-sm text-[#373737]">
          You will add GSL question videos, answer options, and preview the
          student experience on the next screen.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="survey-title"
              className="block text-sm font-semibold text-[#151515]"
            >
              Survey title
            </label>
            <input
              id="survey-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Term 3 Student Wellbeing Check"
              className="mt-1.5 h-12 w-full rounded-[10px] border border-[#E0E0E0] px-4 text-base focus:border-[#034C58]"
            />
          </div>

          <div>
            <label
              htmlFor="survey-desc"
              className="block text-sm font-semibold text-[#151515]"
            >
              Short description (optional)
            </label>
            <textarea
              id="survey-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Context for facilitators and cohort notes..."
              className="mt-1.5 w-full rounded-[10px] border border-[#E0E0E0] p-4 text-base focus:border-[#034C58]"
            />
          </div>

          {error && (
            <p className="text-sm font-medium text-[#DC2626]" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" variant="teal" size="md" disabled={creating}>
              {creating ? 'Creating...' : 'Open Survey Builder'}
            </Button>
            <Link to="/dashboard">
              <Button variant="outline" size="md">
                Back
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </CreatorLayout>
  );
}
