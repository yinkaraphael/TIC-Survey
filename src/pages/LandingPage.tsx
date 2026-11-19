import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, ArrowRight, CheckCircle2, X, Mail, Globe } from 'lucide-react';
import { Navbar } from '@/src/components/landing/Navbar';
import { Hero } from '@/src/components/landing/Hero';
import { Button } from '@/src/components/ui/Button';

type GuideType = 'creator' | 'facilitator' | null;

export function LandingPage() {
  const [activeGuide, setActiveGuide] = useState<GuideType>(null);
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactError, setContactError] = useState('');
  const [contactSent, setContactSent] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactError('');
    if (!contactEmail.trim() || !contactEmail.includes('@')) {
      setContactError('Please enter a valid email address.');
      return;
    }
    if (contactMessage.trim().length < 5) {
      setContactError('Please include a brief message.');
      return;
    }
    setContactSent(true);
    setContactEmail('');
    setContactMessage('');
  };

  return (
    <div className="min-h-screen bg-white text-[#151515]">
      <Navbar />

      <main>
        <Hero />

        {/* About: Problem & Ghana Pilot Result */}
        <section
          id="about"
          className="border-t border-[#E0E0E0] bg-[#FAFAFA] py-20"
        >
          <div className="mx-auto grid max-w-[1320px] gap-12 px-6 lg:grid-cols-12 lg:items-center lg:px-10">
            <div className="lg:col-span-7">
              <p className="text-sm font-semibold text-[#034C58]">
                About TIC Survey
              </p>
              <h2 className="mt-2 font-heading text-3xl font-semibold leading-tight text-[#151515] md:text-4xl">
                Built for deaf youth to respond privately in their primary language
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[#373737]">
                Written questionnaires force deaf and hard-of-hearing students to
                rely on interpreters or second-language reading, reducing privacy
                and slowing research. TIC Survey puts Ghana Sign Language (GSL)
                first on every screen—with a guided practice area, clear video
                answer cards, and direct webcam sign recording.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <Link to="/s/upshift-2026">
                  <Button variant="teal" size="md">
                    Try Live Student Survey
                    <ArrowRight size={18} aria-hidden="true" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="md">
                    Open Creator Studio
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 lg:col-span-5">
              <div className="rounded-[20px] border border-[#E0E0E0] bg-white p-6">
                <div className="font-heading text-3xl font-bold text-[#034C58] tabular-nums">
                  100%
                </div>
                <p className="mt-2 text-sm leading-snug text-[#373737]">
                  Independent student completion without an interpreter reading answers
                </p>
              </div>
              <div className="rounded-[20px] border border-[#E0E0E0] bg-white p-6">
                <div className="font-heading text-3xl font-bold text-[#151515] tabular-nums">
                  720p
                </div>
                <p className="mt-2 text-sm leading-snug text-[#373737]">
                  Smooth 30fps browser recording preserving hand shapes and facial grammar
                </p>
              </div>
              <div className="rounded-[20px] border border-[#E0E0E0] bg-white p-6">
                <div className="font-heading text-3xl font-bold text-[#151515] tabular-nums">
                  Offline
                </div>
                <p className="mt-2 text-sm leading-snug text-[#373737]">
                  Local IndexedDB video buffering with automatic retry on weak school Wi-Fi
                </p>
              </div>
              <div className="rounded-[20px] border border-[#E0E0E0] bg-white p-6">
                <div className="font-heading text-3xl font-bold text-[#034C58] tabular-nums">
                  Act 843
                </div>
                <p className="mt-2 text-sm leading-snug text-[#373737]">
                  Anonymous sessions aligned with Ghana Data Protection Act safeguards
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Resources: Guides for Creators & Facilitators */}
        <section id="resources" className="py-20">
          <div className="mx-auto max-w-[1320px] px-6 lg:px-10">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-[#034C58]">Resources</p>
              <h2 className="mt-2 font-heading text-3xl font-semibold text-[#151515]">
                Practical field guides for teams and schools
              </h2>
            </div>

            <div className="mt-10 grid gap-8 md:grid-cols-2">
              <article className="flex flex-col justify-between rounded-[24px] border border-[#E0E0E0] bg-white p-8">
                <div>
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#E6F1F6] text-[#034C58]">
                    <BookOpen size={22} aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 font-heading text-2xl font-semibold text-[#151515]">
                    01. Guide for Survey Creators
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-[#373737]">
                    Learn how to frame signers cleanly against neutral studio
                    backdrops, build single-choice and signed-response questions,
                    and transcribe GSL recordings for export.
                  </p>
                </div>
                <div className="mt-6">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setActiveGuide('creator')}
                  >
                    Read Creator Guide
                  </Button>
                </div>
              </article>

              <article className="flex flex-col justify-between rounded-[24px] border border-[#E0E0E0] bg-white p-8">
                <div>
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#FBF4E4] text-[#151515]">
                    <Users size={22} aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 font-heading text-2xl font-semibold text-[#151515]">
                    02. Guide for School Facilitators
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-[#373737]">
                    Step-by-step classroom checklist: preparing tablet lighting,
                    letting students use the practice zone privately, and verifying
                    offline uploads before closing the browser.
                  </p>
                </div>
                <div className="mt-6">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setActiveGuide('facilitator')}
                  >
                    Read Facilitator Guide
                  </Button>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section
          id="contact"
          className="border-t border-[#E0E0E0] bg-[#FAFAFA] py-20"
        >
          <div className="mx-auto grid max-w-[1320px] gap-12 px-6 lg:grid-cols-12 lg:px-10">
            <div className="lg:col-span-5">
              <p className="text-sm font-semibold text-[#034C58]">Contact</p>
              <h2 className="mt-2 font-heading text-3xl font-semibold text-[#151515]">
                Partner with the TIC Survey team
              </h2>
              <p className="mt-3 text-base leading-relaxed text-[#373737]">
                Deploying a school inclusion study or UPSHIFT cohort survey?
                Reach out to request GSL studio templates or facilitator training.
              </p>

              <div className="mt-6 space-y-3 text-base text-[#373737]">
                <a
                  href="mailto:hello@ticsurvey.org"
                  className="flex items-center gap-3 hover:text-[#034C58]"
                >
                  <Mail size={18} aria-hidden="true" />
                  <span>hello@ticsurvey.org</span>
                </a>
                <div className="flex items-center gap-3">
                  <Globe size={18} aria-hidden="true" />
                  <span>Accra, Ghana · Supported by Microsoft & UNICEF Ghana</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <form
                onSubmit={handleContactSubmit}
                className="rounded-[24px] border border-[#E0E0E0] bg-white p-8"
              >
                {contactSent ? (
                  <div className="flex items-start gap-3 py-4 text-[#034C58]">
                    <CheckCircle2 size={24} className="shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <h3 className="font-heading text-xl font-semibold text-[#151515]">
                        Inquiry received
                      </h3>
                      <p className="mt-1 text-base text-[#373737]">
                        Thank you for reaching out. Our team will respond within
                        two business days.
                      </p>
                      <button
                        type="button"
                        onClick={() => setContactSent(false)}
                        className="mt-4 text-sm font-semibold text-[#034C58] hover:underline cursor-pointer"
                      >
                        Send another message
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="contact-email"
                        className="block text-sm font-semibold text-[#151515]"
                      >
                        Work or school email
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="name@school.edu.gh"
                        className="mt-1.5 h-12 w-full rounded-[10px] border border-[#E0E0E0] px-4 text-base text-[#151515] focus:border-[#034C58]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="contact-message"
                        className="block text-sm font-semibold text-[#151515]"
                      >
                        How can we help?
                      </label>
                      <textarea
                        id="contact-message"
                        rows={3}
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Tell us about your student cohort, timeline, or GSL video needs..."
                        className="mt-1.5 w-full rounded-[10px] border border-[#E0E0E0] p-4 text-base text-[#151515] focus:border-[#034C58]"
                      />
                    </div>
                    {contactError && (
                      <p className="text-sm font-medium text-[#DC2626]" role="alert">
                        {contactError}
                      </p>
                    )}
                    <Button type="submit" variant="dark" size="md">
                      Send Message
                    </Button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E0E0E0] bg-white py-8">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-4 px-6 text-sm text-[#373737] lg:px-10">
          <span>Tech For Independent Communication (TIC Survey)</span>
          <span>Powered by Microsoft &amp; UNICEF Ghana</span>
        </div>
      </footer>

      {/* Resource Guide Modal */}
      {activeGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guide-title"
        >
          <div className="w-full max-w-xl rounded-[24px] bg-white p-8 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <h3 id="guide-title" className="font-heading text-2xl font-semibold text-[#151515]">
                {activeGuide === 'creator'
                  ? 'Guide for Survey Creators'
                  : 'Guide for School Facilitators'}
              </h3>
              <button
                type="button"
                aria-label="Close guide"
                onClick={() => setActiveGuide(null)}
                className="grid h-10 w-10 place-items-center rounded-full hover:bg-[#F4F4F4] cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            {activeGuide === 'creator' ? (
              <ol className="mt-5 list-decimal space-y-3 pl-5 text-base leading-relaxed text-[#373737]">
                <li>
                  Record signers against a plain, well-lit neutral backdrop from
                  the waist up so both hands and facial expressions remain visible.
                </li>
                <li>
                  Keep each question video between 6 and 15 seconds. Use short,
                  distinct answer-option clips for Single and Multiple Choice questions.
                </li>
                <li>
                  Add an internal creator note to every question so reviewers can
                  tag transcripts and export clean CSV datasets.
                </li>
                <li>
                  Use the live student preview inside the builder before publishing
                  your survey link.
                </li>
              </ol>
            ) : (
              <ol className="mt-5 list-decimal space-y-3 pl-5 text-base leading-relaxed text-[#373737]">
                <li>
                  Position the tablet at eye level facing a window or diffuse light
                  so the student’s hands are clearly illuminated.
                </li>
                <li>
                  Encourage students to complete the built-in Practice Area before
                  starting the real survey.
                </li>
                <li>
                  Step back during answers and the final Review screen—responses
                  belong privately to the student until they tap Submit.
                </li>
                <li>
                  If school Wi-Fi drops, keep going: recordings stay safely in
                  browser storage until connection resumes.
                </li>
              </ol>
            )}
            <div className="mt-7 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setActiveGuide(null)}>
                Close
              </Button>
              <Link to={activeGuide === 'creator' ? '/login' : '/s/upshift-2026'}>
                <Button variant="teal" size="sm">
                  {activeGuide === 'creator' ? 'Open Creator Studio' : 'Launch Student Survey'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
