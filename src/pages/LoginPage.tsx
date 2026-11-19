import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Building2, Lock, User, ArrowRight } from 'lucide-react';
import { Logo } from '@/src/components/ui/Logo';
import { Button } from '@/src/components/ui/Button';
import { api, getStoredToken } from '@/src/lib/api';

type AuthMode = 'signin' | 'signup';

export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [orgName, setOrgName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getStoredToken()) return;
    let cancelled = false;
    api
      .me()
      .then(() => {
        if (!cancelled) navigate('/dashboard', { replace: true });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleDemoSignIn = async (demoEmail: string) => {
    setError(null);
    setLoading(true);
    try {
      await api.login(demoEmail, undefined, true);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'signup') {
        await api.signup({
          email,
          password,
          fullName,
          organisationName: orgName,
        });
      } else {
        await api.login(email, password, false);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#FAFAFA] px-6 py-8">
      <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between">
        <Logo />
        <Link
          to="/"
          className="text-sm font-medium text-[#373737] hover:underline"
        >
          Back to home
        </Link>
      </div>

      <main className="mx-auto my-10 w-full max-w-md rounded-[24px] border border-[#E0E0E0] bg-white p-8 shadow-xs">
        <div
          role="tablist"
          aria-label="Authentication mode"
          className="grid grid-cols-2 gap-1 rounded-[10px] border border-[#E0E0E0] bg-[#FAFAFA] p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signin'}
            onClick={() => {
              setMode('signin');
              setError(null);
            }}
            className={`h-10 rounded-[8px] text-sm font-semibold transition-colors cursor-pointer ${
              mode === 'signin'
                ? 'bg-[#151515] text-white'
                : 'text-[#373737] hover:text-[#151515]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`h-10 rounded-[8px] text-sm font-semibold transition-colors cursor-pointer ${
              mode === 'signup'
                ? 'bg-[#151515] text-white'
                : 'text-[#373737] hover:text-[#151515]'
            }`}
          >
            Sign Up
          </button>
        </div>

        <h1 className="mt-6 font-heading text-2xl font-bold text-[#151515]">
          {mode === 'signin' ? 'Creator Studio Sign In' : 'Create Creator Account'}
        </h1>
        <p className="mt-1.5 text-base text-[#373737]">
          {mode === 'signin'
            ? 'Access your organisation’s sign language surveys and responses.'
            : 'Set up your team workspace to build and share GSL surveys.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label
                  htmlFor="signup-name"
                  className="block text-sm font-semibold text-[#151515]"
                >
                  Full name
                </label>
                <div className="relative mt-1.5">
                  <User
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999EA1]"
                    aria-hidden="true"
                  />
                  <input
                    id="signup-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Kwame Boateng"
                    className="h-12 w-full rounded-[10px] border border-[#E0E0E0] pl-10 pr-4 text-base focus:border-[#034C58]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="signup-org"
                  className="block text-sm font-semibold text-[#151515]"
                >
                  Organisation or school name
                </label>
                <div className="relative mt-1.5">
                  <Building2
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999EA1]"
                    aria-hidden="true"
                  />
                  <input
                    id="signup-org"
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Kumasi Deaf Inclusion Unit"
                    className="h-12 w-full rounded-[10px] border border-[#E0E0E0] pl-10 pr-4 text-base focus:border-[#034C58]"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label
              htmlFor="auth-email"
              className="block text-sm font-semibold text-[#151515]"
            >
              Work or school email
            </label>
            <div className="relative mt-1.5">
              <Mail
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999EA1]"
                aria-hidden="true"
              />
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@organisation.org"
                className="h-12 w-full rounded-[10px] border border-[#E0E0E0] pl-10 pr-4 text-base focus:border-[#034C58]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="block text-sm font-semibold text-[#151515]"
            >
              Password
            </label>
            <div className="relative mt-1.5">
              <Lock
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#999EA1]"
                aria-hidden="true"
              />
              <input
                id="auth-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                className="h-12 w-full rounded-[10px] border border-[#E0E0E0] pl-10 pr-4 text-base focus:border-[#034C58]"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm font-medium text-[#DC2626]" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="dark"
            size="md"
            disabled={loading}
            className="w-full"
          >
            {loading
              ? mode === 'signup'
                ? 'Creating account...'
                : 'Signing in...'
              : mode === 'signup'
              ? 'Create Account'
              : 'Sign In'}
            <ArrowRight size={17} aria-hidden="true" />
          </Button>
        </form>

        <div className="mt-8 border-t border-[#EEEEEE] pt-6">
          <p className="text-xs font-semibold text-[#999EA1]">
            Quick demo accounts
          </p>
          <div className="mt-3 space-y-2.5">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoSignIn('staff@ticsurvey.org')}
              className="flex w-full items-center justify-between rounded-[10px] border border-[#E0E0E0] px-4 py-3 text-left text-sm hover:bg-[#F4F4F4] cursor-pointer"
            >
              <div>
                <p className="font-semibold text-[#151515]">UNICEF Ghana &amp; TIC</p>
                <p className="text-xs text-[#373737]">staff@ticsurvey.org · UPSHIFT Survey</p>
              </div>
              <ArrowRight size={16} className="text-[#034C58]" />
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoSignIn('research@accradeaf.edu.gh')}
              className="flex w-full items-center justify-between rounded-[10px] border border-[#E0E0E0] px-4 py-3 text-left text-sm hover:bg-[#F4F4F4] cursor-pointer"
            >
              <div>
                <p className="font-semibold text-[#151515]">Accra School for the Deaf</p>
                <p className="text-xs text-[#373737]">research@accradeaf.edu.gh · Campus Survey</p>
              </div>
              <ArrowRight size={16} className="text-[#034C58]" />
            </button>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-[#999EA1]">
        TIC Survey · Creator Studio
      </footer>
    </div>
  );
}
