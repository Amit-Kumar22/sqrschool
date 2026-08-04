'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Loader2, Mail, Phone as PhoneIcon, ShieldCheck } from 'lucide-react';
import { apiErrorMessage, getProfile, updateProfile, updatePassword, type Profile } from '@/lib/api';
import { ROLE_LABELS } from '@/components/dashboard/navConfig';

const EMPTY_ADDRESS = {
  buildingName: '',
  streetName: '',
  landmark: '',
  district: '',
  city: '',
  pin: '',
  stateName: '',
};

export default function ProfileView() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    getProfile()
      .then((data) => {
        setProfile(data);
        setName(data.fullName ?? '');
        setPhone(data.phone ?? '');
      })
      .catch(() => setProfileMessage({ type: 'error', text: 'Could not load your profile.' }))
      .finally(() => setLoading(false));
  }, []);

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      await updateProfile({ name, phone, address });
      setProfileMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      setProfileMessage({ type: 'error', text: apiErrorMessage(err, 'Failed to update profile.') });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (password !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setSavingPassword(true);
    try {
      await updatePassword({ password, confirmPassword, code });
      setPasswordMessage({ type: 'success', text: 'Password updated successfully.' });
      setPassword('');
      setConfirmPassword('');
      setCode('');
    } catch (err) {
      setPasswordMessage({ type: 'error', text: apiErrorMessage(err, 'Failed to update password.') });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 size={16} className="animate-spin" /> Loading profile…
      </div>
    );
  }

  const initials = (profile?.fullName ?? '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* ── Summary card ── */}
      <div className="card-premium animate-fade-in-up p-6 lg:col-span-1">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-indigo-700 text-lg font-semibold text-white shadow-premium">
            {initials}
          </div>
          <h2 className="mt-3 text-base font-semibold text-slate-900">{profile?.fullName}</h2>
          {profile && (
            <span className="mt-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600">
              {ROLE_LABELS[profile.role]}
            </span>
          )}
        </div>

        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <Mail size={15} className="shrink-0" /> {profile?.email}
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <PhoneIcon size={15} className="shrink-0" /> {profile?.phone || 'Not set'}
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <ShieldCheck size={15} className="shrink-0" /> Status: {profile?.status ?? '—'}
          </div>
        </dl>
      </div>

      {/* ── Forms ── */}
      <div className="space-y-6 lg:col-span-2">
        <form
          onSubmit={handleProfileSubmit}
          style={{ animationDelay: '60ms' }}
          className="card-premium animate-fade-in-up p-6"
        >
          <h3 className="text-sm font-semibold text-slate-900">Edit profile</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" value={name} onChange={setName} required />
            <Field label="Phone" value={phone} onChange={setPhone} />
            <Field
              label="Building name"
              value={address.buildingName}
              onChange={(v) => setAddress((a) => ({ ...a, buildingName: v }))}
            />
            <Field
              label="Street name"
              value={address.streetName}
              onChange={(v) => setAddress((a) => ({ ...a, streetName: v }))}
            />
            <Field
              label="Landmark"
              value={address.landmark}
              onChange={(v) => setAddress((a) => ({ ...a, landmark: v }))}
            />
            <Field
              label="District"
              value={address.district}
              onChange={(v) => setAddress((a) => ({ ...a, district: v }))}
            />
            <Field label="City" value={address.city} onChange={(v) => setAddress((a) => ({ ...a, city: v }))} />
            <Field label="State" value={address.stateName} onChange={(v) => setAddress((a) => ({ ...a, stateName: v }))} />
            <Field label="PIN code" value={address.pin} onChange={(v) => setAddress((a) => ({ ...a, pin: v }))} />
          </div>

          {profileMessage && <Message {...profileMessage} className="mt-4" />}

          <button
            type="submit"
            disabled={savingProfile}
            className="mt-5 flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-premium-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-premium disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
          >
            {savingProfile && <Loader2 size={15} className="animate-spin" />}
            {savingProfile ? 'Saving…' : 'Save changes'}
          </button>
        </form>

        <form
          onSubmit={handlePasswordSubmit}
          style={{ animationDelay: '120ms' }}
          className="card-premium animate-fade-in-up p-6"
        >
          <h3 className="text-sm font-semibold text-slate-900">Change password</h3>
          <p className="mt-1 text-xs text-slate-500">
            Enter a new password along with the verification code sent to your registered email.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="New password" type="password" value={password} onChange={setPassword} required />
            <Field
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              required
            />
            <Field label="Verification code" value={code} onChange={setCode} required />
          </div>

          {passwordMessage && <Message {...passwordMessage} className="mt-4" />}

          <button
            type="submit"
            disabled={savingPassword}
            className="mt-5 flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-premium-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-premium disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
          >
            {savingPassword && <Loader2 size={15} className="animate-spin" />}
            {savingPassword ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-slate-900">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
      />
    </label>
  );
}

function Message({ type, text, className = '' }: { type: 'success' | 'error'; text: string; className?: string }) {
  const styles =
    type === 'success'
      ? 'border-green-200 bg-green-50 text-green-700'
      : 'border-red-200 bg-red-50 text-red-700';
  return <div className={`rounded-md border px-3 py-2 text-sm ${styles} ${className}`}>{text}</div>;
}
