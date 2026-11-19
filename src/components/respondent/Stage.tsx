import React, { useState, useEffect } from 'react';
import { WifiOff, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';

export function Stage({
  children,
  progress,
  isPreview = false,
}: {
  children: React.ReactNode;
  progress?: number;
  isPreview?: boolean;
}) {
  const [offline, setOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return (
    <div className="respondent-stage-bg relative flex min-h-screen flex-col justify-between">
      {/* Slim progress indicator with no numbers */}
      <div className="w-full">
        {progress !== undefined ? (
          <div
            className="h-1.5 w-full bg-[#E0E0E0]/60"
            role="progressbar"
            aria-label="Survey progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
          >
            <div
              className="h-full bg-[#034C58] transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(4, progress * 100))}%` }}
            />
          </div>
        ) : (
          <div className="h-1.5 w-full" />
        )}

        <div className="mx-auto flex max-w-6xl items-center justify-end gap-3 px-6 pt-3">
          {isPreview && (
            <span className="text-xs font-semibold text-[#034C58]">
              Student Preview Mode
            </span>
          )}
          {offline && (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#373737]"
              title="Offline mode — answers are saved locally"
            >
              <WifiOff size={15} aria-hidden="true" />
              <span>Saved locally</span>
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowPrivacy(true)}
            aria-label="Data protection notice"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#373737]/70 hover:bg-white/70 hover:text-[#034C58] cursor-pointer"
          >
            <ShieldCheck size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Main Centered Viewport */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-6">
        {children}
      </main>

      {/* Subtle Partner Footer matching wireframes */}
      <footer className="pb-6 pt-2 text-center text-xs font-medium text-[#373737]/80">
        Powered by Microsoft &amp; UNICEF Ghana
      </footer>

      {showPrivacy && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-title"
        >
          <div className="w-full max-w-lg rounded-[24px] bg-white p-7 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <h2 id="privacy-title" className="font-heading text-xl font-semibold text-[#151515]">
                Your Privacy &amp; Consent
              </h2>
              <button
                type="button"
                aria-label="Close privacy notice"
                onClick={() => setShowPrivacy(false)}
                className="grid h-10 w-10 place-items-center rounded-full hover:bg-[#F4F4F4] cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-base leading-relaxed text-[#373737]">
              <p>
                This survey is anonymous. You are never asked for your email,
                phone number, or personal identifier unless an open prompt asks
                and you choose to share.
              </p>
              <p>
                Recorded Ghana Sign Language videos are encrypted and visible
                only to authorized research reviewers in the hosting
                organisation, in compliance with Ghana’s Data Protection Act,
                2012 (Act 843).
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <Button variant="teal" size="sm" onClick={() => setShowPrivacy(false)}>
                Understood
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
