import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { api, getStoredToken } from '@/src/lib/api';
import heroPoster from '@/src/assets/images/hero_signer_banner_1794577275987.jpg';

export function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
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

  const togglePlay = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play().catch(() => {});
      vid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      vid.pause();
    }
  };

  return (
    <section
      id="home"
      className="mx-auto w-full max-w-[1320px] px-6 pb-20 pt-6 text-center lg:px-10"
    >
      <h1 className="mx-auto max-w-3xl font-heading text-4xl font-semibold leading-[1.14] text-[#151515] md:text-[52px]">
        Accessible Surveys,
        <br />
        Designed Without Barriers
      </h1>

      <p className="mx-auto mt-5 max-w-[780px] text-lg leading-relaxed text-[#373737] md:text-xl">
        Tech For Independent Communication transforms surveys for deaf and
        hard-of-hearing students into seamless, video-first sign language
        experiences built on dignity, independence, and speed.
      </p>

      <div className="mt-8 flex justify-center">
        <Link to={isLoggedIn ? '/dashboard' : '/login'}>
          <Button variant="dark" size="lg">
            Get Started
          </Button>
        </Link>
      </div>

      <div className="relative mx-auto mt-12 aspect-[1333/695] min-h-[340px] w-full overflow-hidden rounded-[24px] bg-[#EEEEEE] shadow-sm">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          poster={heroPoster}
          controls={playing}
          playsInline
          loop
          muted
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        >
          <source src="/media/intro-gsl.mp4" type="video/mp4" />
        </video>

        {!playing && (
          <button
            type="button"
            onClick={togglePlay}
            aria-label="Play Ghana Sign Language intro video"
            className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-black/35 text-white backdrop-blur-sm transition-transform hover:scale-105 cursor-pointer"
          >
            <Play size={26} fill="white" className="ml-0.5" aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  );
}
