import { Link } from 'react-router-dom';

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label="TIC Survey home"
      className={`inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 rounded-lg focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-accent ${className}`}
    >
      <img
        src="/logo.svg"
        alt="TIC Survey"
        width={154}
        height={34}
        className="h-8 w-auto"
      />
    </Link>
  );
}
