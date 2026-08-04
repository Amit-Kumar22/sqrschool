'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, GraduationCap, Loader2, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { apiErrorMessage, loginUser, getProfile } from '@/lib/api';
import { setAuthToken, setUser, getDashboardByRole, getUserRole, isAuthenticated } from '@/lib/auth';
import { useTheme } from '@/contexts/ThemeContext';

const HIGHLIGHTS = [
  'One login for every role — admin, principal, teacher, staff and student',
  'Real-time dashboards built for each panel',
  'Bank-grade session security, always encrypted',
];

export default function LoginPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Already signed in? Skip the form and go straight to the dashboard.
  useEffect(() => {
    if (isAuthenticated()) {
      const role = getUserRole();
      if (role) router.replace(getDashboardByRole(role));
    }
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { accessToken } = await loginUser(email, password);

      if (!accessToken) {
        setError('Login succeeded but no access token was returned.');
        return;
      }

      setAuthToken(accessToken);

      // The profile endpoint is the authoritative source for role/name, so
      // fetch it right after login rather than trusting login's own payload.
      const profile = await getProfile();
      setUser({
        id: profile.id,
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        status: profile.status,
      });

      router.replace(getDashboardByRole(profile.role));
    } catch (err) {
      setError(apiErrorMessage(err, 'Invalid email or password. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* ── Branding panel ── */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary p-10 text-white lg:flex xl:p-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="animate-float pointer-events-none absolute bottom-10 left-10 h-48 w-48 rounded-full bg-button-bg/20 blur-3xl" />

        <Link href="/" className="relative flex items-center gap-2 font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-button-bg to-button-bg/70 text-button-text shadow-premium">
            <GraduationCap size={20} />
          </span>
          <span>{theme.companyName || 'SQR School'}</span>
        </Link>

        <div className="animate-fade-in-up relative max-w-md">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/20">
            <Sparkles size={12} /> One portal, every role
          </span>
          <h1 className="mt-5 text-3xl font-bold leading-tight xl:text-4xl">
            Everything your school runs on, in one premium portal.
          </h1>
          <p className="mt-3 text-sm text-white/75">
            Superadmins, principals, teachers, staff and students all sign in here — each with a
            dashboard built for their role.
          </p>

          <ul className="mt-7 space-y-3">
            {HIGHLIGHTS.map((item, idx) => (
              <li
                key={item}
                style={{ animationDelay: `${150 + idx * 90}ms` }}
                className="animate-fade-in-up flex items-start gap-2.5 text-sm text-white/90"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-button-bg/90 text-button-text">
                  <ShieldCheck size={12} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/50">
          © {new Date().getFullYear()} {theme.companyName || 'SQR School'}
        </p>
      </div>

      {/* ── Login form ── */}
      <div className="flex w-full flex-1 items-center justify-center px-4 py-12 lg:w-1/2">
        <div className="animate-scale-in relative w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-8 shadow-premium-lg">
          <span className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-button-bg to-primary" />

          <div className="mb-8 flex flex-col items-center lg:items-start">
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-premium lg:hidden">
              <GraduationCap size={22} />
            </span>
            <h2 className="text-2xl font-bold text-heading">Welcome back</h2>
            <p className="mt-1.5 text-sm text-ink/60">Sign in to your portal to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-heading">
                Email address
              </label>
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink/35" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@sqrschool.edu"
                  className="h-11 w-full rounded-lg border border-black/10 bg-white pr-3 pl-10 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-heading">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink/35" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-11 w-full rounded-lg border border-black/10 bg-white pr-10 pl-10 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-ink/35 transition-colors hover:text-ink/70"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="animate-fade-in-up rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-sm font-semibold text-white shadow-premium transition-all hover:-translate-y-0.5 hover:shadow-premium-lg disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-ink/50 lg:text-left">
            Having trouble signing in? Contact your school administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
