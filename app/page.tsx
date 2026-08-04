'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  Trophy,
  Users,
  ShieldCheck,
  Microscope,
  Palette,
  Volleyball,
  ArrowRight,
  Quote,
  CheckCircle2,
} from 'lucide-react';
import Navbar from '@/components/site/Navbar';
import Footer from '@/components/site/Footer';
import { useTheme } from '@/contexts/ThemeContext';

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
  },
  {
    icon: Microscope,
    title: 'Middle School',
    grades: 'Grades 6 – 8',
    description: 'Concept-driven science, math and language learning with hands-on labs.',
    image: '/images/middle.jpg',
    imagePosition: 'object-center',
  },
  {
    icon: Trophy,
    title: 'Secondary School',
    grades: 'Grades 9 – 12',
    description: 'Board-focused academics paired with career counselling and mentorship.',
    image: '/images/building.jpg',
    imagePosition: 'object-center',
  },
];

const FEATURES = [
  {
    icon: Users,
    title: 'Experienced Faculty',
    description: 'Qualified, caring teachers dedicated to every student’s growth.',
    image: '/images/faculty.jpg',
  },
  {
    icon: ShieldCheck,
    title: 'Safe Campus',
    description: 'CCTV-monitored premises with verified staff and secure transport.',
    image: '/images/campus-gate.jpg',
  },
  {
    icon: Palette,
    title: 'Arts & Creativity',
    description: 'Dedicated studios for music, art and drama for well-rounded learning.',
    image: '/images/creativity.jpg',
  },
  {
    icon: Volleyball,
    title: 'Sports & Fitness',
    description: 'Full-size courts and grounds for football, basketball and athletics.',
    image: '/images/sports.jpg',
  },
];

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
                  className="inline-flex items-center gap-1.5 rounded-md bg-button-bg px-5 py-2.5 text-sm font-semibold text-button-text shadow-premium transition-all hover:-translate-y-0.5 hover:shadow-premium-lg"
                >
                  Apply for Admission <ArrowRight size={16} />
                </a>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/30 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-white/10"
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

        {/* ── About ── */}
        <section id="about" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">About Us</p>
              <h2 className="mt-2 text-2xl font-bold text-heading sm:text-3xl">
                A community built on learning, character and care
              </h2>
              <p className="mt-3 text-sm text-ink/70 sm:text-base">
                For over two decades, {schoolName} has combined a rigorous academic curriculum
                with a nurturing environment where students are known by name, not just number.
                Our approach balances classroom learning with sports, arts and real-world skills.
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
              {FEATURES.map((feature, idx) => (
                <div
                  key={feature.title}
                  style={{ animationDelay: `${idx * 70}ms` }}
                  className="animate-fade-in-up group overflow-hidden rounded-xl border border-black/5 bg-white shadow-premium-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-premium-lg"
                >
                  <div className="relative h-24 w-full overflow-hidden">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-primary/20" />
                    <span className="absolute bottom-2 left-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-primary shadow-premium-sm">
                      <feature.icon size={16} />
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-semibold text-heading">{feature.title}</p>
                    <p className="mt-1 text-xs text-ink/60">{feature.description}</p>
                  </div>
                </div>
              ))}
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
              {PROGRAMS.map((program, idx) => (
                <div
                  key={program.title}
                  style={{ animationDelay: `${idx * 80}ms` }}
                  className="animate-fade-in-up group overflow-hidden rounded-xl border border-black/5 bg-white shadow-premium-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-premium-lg"
                >
                  <div className="relative h-40 w-full overflow-hidden">
                    <Image
                      src={program.image}
                      alt={program.title}
                      fill
                      className={`object-cover transition-transform duration-500 group-hover:scale-105 ${program.imagePosition}`}
                    />
                  </div>
                  <div className="p-6">
                    <div className="-mt-12 mb-3 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-white shadow-premium">
                      <program.icon size={22} />
                    </div>
                    <h3 className="text-base font-semibold text-heading">{program.title}</h3>
                    <p className="text-xs font-medium text-primary">{program.grades}</p>
                    <p className="mt-2 text-sm text-ink/65">{program.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

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
                className="animate-fade-in-up rounded-xl border border-black/5 bg-white p-6 shadow-premium-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-premium-lg"
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
          <div className="relative flex flex-col items-center justify-between gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-secondary px-6 py-10 text-center text-white shadow-premium-lg sm:flex-row sm:text-left">
            <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
            <div className="relative">
              <h2 className="text-xl font-bold sm:text-2xl">Admissions for 2026-27 are now open</h2>
              <p className="mt-1 text-sm text-white/75">Limited seats available across all grades. Apply today.</p>
            </div>
            <a
              href="mailto:info@sqrschool.edu"
              className="relative inline-flex shrink-0 items-center gap-1.5 rounded-md bg-button-bg px-5 py-2.5 text-sm font-semibold text-button-text shadow-premium transition-all hover:-translate-y-0.5 hover:shadow-premium-lg"
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
