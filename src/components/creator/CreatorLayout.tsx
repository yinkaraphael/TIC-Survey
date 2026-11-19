import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, PlusCircle, LogOut, ExternalLink } from 'lucide-react';
import { Logo } from '@/src/components/ui/Logo';
import { api } from '@/src/lib/api';
import type { Profile } from '@/src/lib/types';

export function CreatorLayout({
  title,
  breadcrumb,
  actions,
  children,
}: {
  title: string;
  breadcrumb?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then((res) => {
        if (!cancelled) {
          setProfile(res.profile);
          setAuthChecked(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAuthChecked(true);
          navigate('/login', { replace: true });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleLogout = async () => {
    await api.logout();
    navigate('/login');
  };

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#E0E0E0] border-t-[#034C58]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#FAFAFA] text-[#151515]">
      {/* Left Workspace Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-[#E0E0E0] bg-white p-6 md:flex">
        <div>
          <Logo />

          {profile && (
            <div className="mt-6 border-b border-[#EEEEEE] pb-4">
              <p className="text-xs font-semibold text-[#999EA1]">Organisation</p>
              <p className="mt-0.5 truncate text-sm font-semibold text-[#151515]">
                {profile.organisationName}
              </p>
              <p className="truncate text-xs text-[#373737]">{profile.email}</p>
            </div>
          )}

          <nav aria-label="Creator navigation" className="mt-6 space-y-1">
            <Link
              to="/dashboard"
              className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors ${
                location.pathname === '/dashboard'
                  ? 'bg-[#E6F1F6] text-[#034C58] font-semibold'
                  : 'text-[#373737] hover:bg-[#F4F4F4]'
              }`}
            >
              <LayoutGrid size={18} aria-hidden="true" />
              <span>Surveys</span>
            </Link>

            <Link
              to="/surveys/new"
              className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors ${
                location.pathname === '/surveys/new'
                  ? 'bg-[#E6F1F6] text-[#034C58] font-semibold'
                  : 'text-[#373737] hover:bg-[#F4F4F4]'
              }`}
            >
              <PlusCircle size={18} aria-hidden="true" />
              <span>New Survey</span>
            </Link>
          </nav>
        </div>

        <div className="space-y-2 border-t border-[#EEEEEE] pt-4">
          <Link
            to="/s/upshift-2026"
            className="flex items-center gap-2 rounded-[10px] px-3 py-2 text-sm text-[#373737] hover:bg-[#F4F4F4]"
          >
            <ExternalLink size={16} aria-hidden="true" />
            <span>Demo Student View</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left text-sm text-[#373737] hover:bg-[#F4F4F4] cursor-pointer"
          >
            <LogOut size={16} aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E0E0E0] bg-white px-6 py-4 lg:px-8">
          <div className="min-w-0">
            {breadcrumb && (
              <p className="text-xs font-medium text-[#999EA1]">{breadcrumb}</p>
            )}
            <h1 className="truncate font-heading text-xl font-semibold text-[#151515]">
              {title}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">{actions}</div>
        </header>

        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
