'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Bus,
  Building2,
  CalendarRange,
  FlaskConical,
  HeartPulse,
  Laptop,
  Trophy,
  Users,
  ShieldCheck,
  Microscope,
  Palette,
  Utensils,
  Volleyball,
  ArrowRight,
  Quote,
  CheckCircle2,
} from 'lucide-react';
import Navbar from '@/components/site/Navbar';
import Footer from '@/components/site/Footer';
import Gallery from '@/components/site/Gallery';
import FlipCard from '@/components/ui/FlipCard';
import { useTheme } from '@/contexts/ThemeContext';
import {
  getActiveAnnouncements,
  getPublicAboutUs,
  getPublicInfrastructure,
  type PublicAnnouncement,
  type PublicInfrastructure,
} from '@/lib/freeService';

const STATS = [
  { label: 'Students', value: '2,400+' },
  { label: 'Expert Faculty', value: '150+' },
  { label: 'Years of Excellence', value: '25+' },
  { label: 'Board Result', value: '98%' },
];

const PROGRAMS = [
  {
    icon: BookOpen,
    title: 'Primary School',
    grades: 'Grades 1 – 5',
    description: 'A joyful foundation years program built around curiosity, phonics and numeracy.',
    image: '/images/primary.jpg',
    imagePosition: 'object-top',
    accent: 'primary' as const,
  },
  {
    icon: Microscope,
    title: 'Middle School',
    grades: 'Grades 6 – 8',
    description: 'Concept-driven science, math and language learning with hands-on labs.',
    image: '/images/middle.jpg',
    imagePosition: 'object-center',
    accent: 'button' as const,
  },
  {
    icon: Trophy,
    title: 'Secondary School',
    grades: 'Grades 9 – 12',
    description: 'Board-focused academics paired with career counselling and mentorship.',
    image: '/images/building.jpg',
    imagePosition: 'object-center',
    accent: 'primary' as const,
  },
];

const FEATURES = [
  {
    icon: Users,
    title: 'Experienced Faculty',
    description: 'Qualified, caring teachers dedicated to every student’s growth.',
    image: '/images/faculty.jpg',
    accent: 'primary' as const,
  },
  {
    icon: ShieldCheck,
    title: 'Safe Campus',
    description: 'CCTV-monitored premises with verified staff and secure transport.',
    image: '/images/campus-gate.jpg',
    accent: 'button' as const,
  },
  {
    icon: Palette,
    title: 'Arts & Creativity',
    description: 'Dedicated studios for music, art and drama for well-rounded learning.',
    image: '/images/creativity.jpg',
    accent: 'primary' as const,
  },
  {
    icon: Volleyball,
    title: 'Sports & Fitness',
    description: 'Full-size courts and grounds for football, basketball and athletics.',
    image: '/images/sports.jpg',
    accent: 'button' as const,
  },
];

const ACCENT_SHADOW = {
  primary: { shadow: 'shadow-glow-primary', shadowLg: 'shadow-glow-primary-lg', text: 'text-primary' },
  button: { shadow: 'shadow-glow-button', shadowLg: 'shadow-glow-button-lg', text: 'text-button-bg' },
};

// Original hardcoded copy — kept as a fallback so the About section still
// reads fine if the /v1/free/about-us API is unreachable or empty.
const FALLBACK_ABOUT_TEXT =
  'has combined a rigorous academic curriculum with a nurturing environment where students are known by name, not just number. Our approach balances classroom learning with sports, arts and real-world skills.';

// Infrastructure items come back with a free-text `icon` keyword (e.g.
// "library", "playground") rather than an icon reference, so map common
// keywords to a matching Lucide icon — anything unrecognized falls back to
// a generic building icon rather than rendering nothing.
const INFRASTRUCTURE_ICON_MAP: [string, LucideIcon][] = [
  ['library', BookOpen],
  ['book', BookOpen],
  ['lab', FlaskConical],
  ['science', FlaskConical],
  ['sport', Volleyball],
  ['play', Volleyball],
  ['ground', Volleyball],
  ['gym', Volleyball],
  ['art', Palette],
  ['music', Palette],
  ['secur', ShieldCheck],
  ['safe', ShieldCheck],
  ['health', HeartPulse],
  ['medical', HeartPulse],
  ['transport', Bus],
  ['bus', Bus],
  ['computer', Laptop],
  ['smart', Laptop],
  ['tech', Laptop],
  ['cafeteria', Utensils],
  ['canteen', Utensils],
  ['food', Utensils],
];

// Longest keyword first — otherwise a short entry that happens to be a
// substring of a more specific one (e.g. "art" inside "smart-computer")
// would win the match before the intended keyword is ever checked.
const SORTED_INFRASTRUCTURE_ICON_MAP = [...INFRASTRUCTURE_ICON_MAP].sort((a, b) => b[0].length - a[0].length);

function resolveInfrastructureIcon(keyword: string): LucideIcon {
  const key = keyword?.toLowerCase() ?? '';
  return SORTED_INFRASTRUCTURE_ICON_MAP.find(([k]) => key.includes(k))?.[1] ?? Building2;
}

const formatDate = (value: string) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

const TESTIMONIALS = [
  {
    quote: 'The teachers here genuinely care about every child. My daughter looks forward to school every single day.',
    name: 'Anita Sharma',
    role: 'Parent, Grade 4',
  },
  {
    quote: 'Small class sizes and a real focus on fundamentals. The transformation in my son’s confidence has been remarkable.',
    name: 'Rajesh Verma',
    role: 'Parent, Grade 7',
  },
  {
    quote: 'From labs to sports, this school gave me space to discover what I’m good at. Forever grateful.',
    name: 'Priya Nair',
    role: 'Alumna, Class of 2023',
  },
];

export default function Home() {
  const { theme } = useTheme();
  const schoolName = theme.companyName || 'SQR School';

  const [infrastructure, setInfrastructure] = useState<PublicInfrastructure[]>([]);
  const [announcements, setAnnouncements] = useState<PublicAnnouncement[]>([]);
  const [aboutDescription, setAboutDescription] = useState('');

  useEffect(() => {
    // Each fetch fails independently — one API being down shouldn't blank
    // out the other sections, so every section keeps its own fallback.
    getPublicInfrastructure()
      .then(setInfrastructure)
      .catch(() => {});
    getActiveAnnouncements()
      .then(setAnnouncements)
      .catch(() => {});
    getPublicAboutUs()
      .then((list) => setAboutDescription(list[0]?.description ?? ''))
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* ── Hero ── */}
        <section id="home" className="relative overflow-hidden bg-primary text-white">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src="/videos/hero-school.mp4"
            poster="/images/building.jpg"
            autoPlay
            muted
            loop
            playsInline
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-20">
            <div className="animate-fade-in-up [text-shadow:0_2px_12px_rgb(0_0_0_/_70%)]">
              <span className="inline-block rounded-full bg-black/40 px-3 py-1 text-xs font-medium tracking-wide">
                Admissions Open · 2026-27
              </span>
              <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">
                Where every student is inspired to learn, grow and lead.
              </h1>
              <p className="mt-4 max-w-lg text-sm text-white/90 sm:text-base">
                {schoolName} blends strong academics, dedicated mentorship and a safe, joyful
                campus to help every child reach their full potential.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="#admissions"
                  className="inline-flex items-center gap-1.5 rounded-md bg-button-bg px-5 py-2.5 text-sm font-semibold text-button-text shadow-glow-button transition-all hover:-translate-y-0.5 hover:shadow-glow-button-lg"
                >
                  Apply for Admission <ArrowRight size={16} />
                </a>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/30 bg-white/5 px-5 py-2.5 text-sm font-semibold shadow-premium-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/10 hover:shadow-premium"
                >
                  Portal Login
                </Link>
              </div>
            </div>

            <div
              style={{ animationDelay: '150ms' }}
              className="animate-fade-in-up relative hidden justify-self-end md:block"
            >
              <div className="grid w-72 grid-cols-2 gap-3">
                <div className="col-span-2 rounded-xl bg-white/10 p-4 shadow-premium backdrop-blur-sm transition-transform hover:-translate-y-1">
                  <p className="text-2xl font-bold">98%</p>
                  <p className="text-xs text-white/70">Board exam pass rate</p>
                </div>
                <div className="rounded-xl bg-white/10 p-4 shadow-premium backdrop-blur-sm transition-transform hover:-translate-y-1">
                  <p className="text-2xl font-bold">150+</p>
                  <p className="text-xs text-white/70">Faculty members</p>
                </div>
                <div className="rounded-xl bg-white/10 p-4 shadow-premium backdrop-blur-sm transition-transform hover:-translate-y-1">
                  <p className="text-2xl font-bold">25+</p>
                  <p className="text-xs text-white/70">Years of legacy</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats bar ── */}
        <section className="border-b border-black/5 bg-surface">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 md:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold text-heading">{stat.value}</p>
                <p className="text-xs text-ink/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Announcements ── */}
        {announcements.length > 0 && (
          <section id="announcements" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="mx-auto max-w-xl text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Announcements</p>
              <h2 className="mt-2 text-2xl font-bold text-heading sm:text-3xl">Latest updates &amp; notices</h2>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {announcements.slice(0, 3).map((item, idx) => (
                <div
                  key={item.id}
                  style={{ animationDelay: `${idx * 80}ms` }}
                  className="animate-fade-in-up rounded-xl border border-black/5 bg-white p-6 shadow-glow-button transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-button-lg"
                >
                  {(item.startDate || item.endDate) && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-button-bg/10 px-2.5 py-1 text-[11px] font-semibold text-button-bg">
                      <CalendarRange size={12} />
                      {formatDate(item.startDate)}
                      {item.endDate && item.endDate !== item.startDate ? ` – ${formatDate(item.endDate)}` : ''}
                    </span>
                  )}
                  <h3 className="mt-3 text-base font-semibold text-heading">{item.announcementName}</h3>
                  <p className="mt-1.5 line-clamp-3 text-sm text-ink/70">{item.description}</p>
                  {item.noticeBoards?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {item.noticeBoards.map((board, boardIdx) => (
                        <span
                          key={`${board.boardName}-${boardIdx}`}
                          className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                        >
                          {board.boardName}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── About ── */}
        <section id="about" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">About Us</p>
              <h2 className="mt-2 text-2xl font-bold text-heading sm:text-3xl">
                A community built on learning, character and care
              </h2>
              <p className="mt-3 text-sm text-ink/70 sm:text-base">
                {schoolName} {aboutDescription || FALLBACK_ABOUT_TEXT}
              </p>
              <ul className="mt-5 space-y-2 text-sm">
                {['CBSE-aligned curriculum', 'Smart, tech-enabled classrooms', 'Dedicated counselling & mentorship'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-ink/80">
                    <CheckCircle2 size={16} className="shrink-0 text-primary" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {infrastructure.length > 0
                ? infrastructure.slice(0, 4).map((item, idx) => {
                    const Icon = resolveInfrastructureIcon(item.icon);
                    return (
                      <div
                        key={item.id}
                        style={{ animationDelay: `${idx * 70}ms` }}
                        className="animate-fade-in-up flex h-40 flex-col rounded-xl border border-black/5 bg-white p-4 shadow-glow-primary transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-primary-lg"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-white shadow-glow-primary">
                          <Icon size={18} />
                        </span>
                        <p className="mt-3 text-sm font-semibold text-heading">{item.name}</p>
                        <p className="mt-1 line-clamp-3 text-xs text-ink/60">{item.description}</p>
                      </div>
                    );
                  })
                : FEATURES.map((feature, idx) => {
                    const accent = ACCENT_SHADOW[feature.accent];
                    return (
                      <FlipCard
                        key={feature.title}
                        className="h-40 animate-fade-in-up"
                        style={{ animationDelay: `${idx * 70}ms` }}
                        front={
                          <div className={`h-full w-full overflow-hidden rounded-xl border border-black/5 bg-white ${accent.shadow}`}>
                            <div className="relative h-24 w-full overflow-hidden">
                              <Image src={feature.image} alt={feature.title} fill className="object-cover" />
                              <div className="absolute inset-0 bg-primary/20" />
                              <span
                                className={`absolute bottom-2 left-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white ${accent.text} ${accent.shadow}`}
                              >
                                <feature.icon size={16} />
                              </span>
                            </div>
                            <div className="p-3">
                              <p className="text-sm font-semibold text-heading">{feature.title}</p>
                              <p className="mt-0.5 text-[11px] text-ink/40">Tap to know more</p>
                            </div>
                          </div>
                        }
                        back={
                          <div className={`flex h-full w-full flex-col justify-center rounded-xl bg-gradient-to-br from-primary to-secondary p-4 text-white ${accent.shadowLg}`}>
                            <feature.icon size={20} className="mb-2 text-button-bg" />
                            <p className="text-sm font-semibold">{feature.title}</p>
                            <p className="mt-1.5 text-xs text-white/80">{feature.description}</p>
                          </div>
                        }
                      />
                    );
                  })}
            </div>
          </div>
        </section>

        {/* ── Academics / Programs ── */}
        <section id="academics" className="bg-secondary/5 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-xl text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Academics</p>
              <h2 className="mt-2 text-2xl font-bold text-heading sm:text-3xl">Programs for every stage</h2>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {PROGRAMS.map((program, idx) => {
                const accent = ACCENT_SHADOW[program.accent];
                const badgeGradient =
                  program.accent === 'button'
                    ? 'bg-gradient-to-br from-button-bg to-button-bg/70 text-button-text'
                    : 'bg-gradient-to-br from-primary to-primary/70 text-white';
                return (
                  <FlipCard
                    key={program.title}
                    className="h-72 animate-fade-in-up"
                    style={{ animationDelay: `${idx * 80}ms` }}
                    front={
                      <div className={`flex h-full w-full flex-col overflow-hidden rounded-xl border border-black/5 bg-white ${accent.shadow}`}>
                        <div className="relative h-36 w-full overflow-hidden">
                          <Image
                            src={program.image}
                            alt={program.title}
                            fill
                            className={`object-cover ${program.imagePosition}`}
                          />
                        </div>
                        <div className="flex flex-1 flex-col p-5">
                          <div
                            className={`relative z-10 -mt-11 mb-2 inline-flex h-11 w-11 shrink-0 items-center justify-center self-start rounded-lg ${badgeGradient} ${accent.shadow}`}
                          >
                            <program.icon size={20} />
                          </div>
                          <h3 className="text-base font-semibold text-heading">{program.title}</h3>
                          <p className="text-xs font-medium text-primary">{program.grades}</p>
                          <p className="mt-auto pt-2 text-[11px] text-ink/40">Tap to explore →</p>
                        </div>
                      </div>
                    }
                    back={
                      <div className={`flex h-full w-full flex-col justify-between rounded-xl bg-gradient-to-br from-primary to-secondary p-5 text-white ${accent.shadowLg}`}>
                        <div>
                          <program.icon size={22} className="mb-2 text-button-bg" />
                          <h3 className="text-base font-semibold">{program.title}</h3>
                          <p className="text-xs font-medium text-white/70">{program.grades}</p>
                          <p className="mt-2 text-sm text-white/85">{program.description}</p>
                        </div>
                        <a
                          href="#admissions"
                          className="mt-3 inline-flex items-center gap-1 self-start text-xs font-semibold text-button-bg hover:underline"
                        >
                          Enquire now <ArrowRight size={12} />
                        </a>
                      </div>
                    }
                  />
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Gallery ── */}
        <Gallery />

        {/* ── Testimonials ── */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Testimonials</p>
            <h2 className="mt-2 text-2xl font-bold text-heading sm:text-3xl">What our community says</h2>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t, idx) => (
              <figure
                key={t.name}
                style={{ animationDelay: `${idx * 80}ms` }}
                className="animate-fade-in-up rounded-xl border border-black/5 bg-white p-6 shadow-glow-primary transition-all duration-300 hover:-translate-y-1 hover:shadow-glow-primary-lg"
              >
                <Quote size={20} className="text-primary/40" />
                <blockquote className="mt-3 text-sm text-ink/75">&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption className="mt-4 text-sm font-semibold text-heading">
                  {t.name}
                  <span className="block text-xs font-normal text-ink/50">{t.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* ── Admissions CTA ── */}
        <section id="admissions" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="relative flex flex-col items-center justify-between gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-secondary px-6 py-10 text-center text-white shadow-glow-primary-lg sm:flex-row sm:text-left">
            <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
            <div className="relative">
              <h2 className="text-xl font-bold sm:text-2xl">Admissions for 2026-27 are now open</h2>
              <p className="mt-1 text-sm text-white/75">Limited seats available across all grades. Apply today.</p>
            </div>
            <a
              href="mailto:info@sqrschool.edu"
              className="relative inline-flex shrink-0 items-center gap-1.5 rounded-md bg-button-bg px-5 py-2.5 text-sm font-semibold text-button-text shadow-glow-button transition-all hover:-translate-y-0.5 hover:shadow-glow-button-lg"
            >
              Enquire Now <ArrowRight size={16} />
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
