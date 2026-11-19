import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/src/components/ui/Logo';
import { Button } from '@/src/components/ui/Button';
import { api, getStoredToken } from '@/src/lib/api';

const links = [
  { href: '#home', label: 'Home' },
  { href: '#about', label: 'About' },
  { href: '#resources', label: 'Resources' },
  { href: '#contact', label: 'Contact' },
];

export function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (!getStoredToken()) return;
    let cancelled = false;
    api
      .me()
      .then(() => {
        if (!cancelled) setIsLoggedIn(true);
      })
      .catch(() => {
        if (!cancelled) setIsLoggedIn(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <header className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-8 px-6 py-7 lg:px-10">
      <Logo />

      <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="text-base font-medium text-[#151515] hover:underline whitespace-nowrap shrink-0 transition-colors"
          >
            {l.label}
          </a>
        ))}
      </nav>

      <div className="shrink-0">
        <Link to={isLoggedIn ? '/dashboard' : '/login'}>
          <Button variant="dark" size="md">
            {isLoggedIn ? 'Dashboard' : 'Create Survey'}
          </Button>
        </Link>
      </div>
    </header>
  );
}
