'use client';

import { FormEvent, useEffect, useState } from 'react';
import { KeyRound, Loader2, Mail, Phone as PhoneIcon, Save, ShieldCheck, UserCircle } from 'lucide-react';
import { apiErrorMessage, getProfile, updateProfile, updatePassword, type Profile } from '@/lib/api';
import { ROLE_LABELS } from '@/components/dashboard/navConfig';
import { TextField } from '@/components/ui/FormField';
import Button from '@/components/ui/Button';

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
    <div className="grid gap-4 lg:grid-cols-3">
      {/* ── Summary card ── */}
      <div className="card-premium animate-fade-in-up relative overflow-hidden lg:col-span-1">
        <div className="h-12 bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600" />
        <div className="flex flex-col items-center px-4 pb-4 text-center">
          <div className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-semibold text-indigo-950 shadow-glow-amber ring-4 ring-white">
            {initials}
          </div>
          <h2 className="mt-2 text-sm font-semibold text-slate-900">{profile?.fullName}</h2>
          {profile && (
            <span className="mt-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600">
              {ROLE_LABELS[profile.role]}
            </span>
          )}

          <dl className="mt-4 w-full space-y-2 text-left text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Mail size={14} className="shrink-0 text-slate-400" /> <span className="truncate">{profile?.email}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <PhoneIcon size={14} className="shrink-0 text-slate-400" /> {profile?.phone || 'Not set'}
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <ShieldCheck size={14} className="shrink-0 text-slate-400" /> Status: {profile?.status ?? '—'}
            </div>
          </dl>
        </div>
      </div>

      {/* ── Forms ── */}
      <div className="space-y-4 lg:col-span-2">
        <form
          onSubmit={handleProfileSubmit}
          style={{ animationDelay: '60ms' }}
          className="card-premium animate-fade-in-up relative overflow-hidden p-4"
        >
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-400 to-indigo-500" />
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <UserCircle size={14} />
            </span>
            <h3 className="text-sm font-semibold text-slate-900">Edit profile</h3>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
            <TextField label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <TextField
              label="Building name"
              value={address.buildingName}
              onChange={(e) => setAddress((a) => ({ ...a, buildingName: e.target.value }))}
            />
            <TextField
              label="Street name"
              value={address.streetName}
              onChange={(e) => setAddress((a) => ({ ...a, streetName: e.target.value }))}
            />
            <TextField
              label="Landmark"
              value={address.landmark}
              onChange={(e) => setAddress((a) => ({ ...a, landmark: e.target.value }))}
            />
            <TextField
              label="District"
              value={address.district}
              onChange={(e) => setAddress((a) => ({ ...a, district: e.target.value }))}
            />
            <TextField label="City" value={address.city} onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))} />
            <TextField
              label="State"
              value={address.stateName}
              onChange={(e) => setAddress((a) => ({ ...a, stateName: e.target.value }))}
            />
            <TextField label="PIN code" value={address.pin} onChange={(e) => setAddress((a) => ({ ...a, pin: e.target.value }))} />
          </div>

          {profileMessage && <Message {...profileMessage} className="mt-3" />}

          <Button type="submit" icon={Save} loading={savingProfile} className="mt-4">
            {savingProfile ? 'Saving…' : 'Save changes'}
          </Button>
        </form>

        <form
          onSubmit={handlePasswordSubmit}
          style={{ animationDelay: '120ms' }}
          className="card-premium animate-fade-in-up relative overflow-hidden p-4"
        >
          <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400" />
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <KeyRound size={14} />
            </span>
            <h3 className="text-sm font-semibold text-slate-900">Change password</h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Enter a new password along with the verification code sent to your registered email.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <TextField
              label="New password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <TextField
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <TextField label="Verification code" value={code} onChange={(e) => setCode(e.target.value)} required />
          </div>

          {passwordMessage && <Message {...passwordMessage} className="mt-3" />}

          <Button type="submit" icon={Save} loading={savingPassword} className="mt-4">
            {savingPassword ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </div>
    </div>
  );
}

function Message({ type, text, className = '' }: { type: 'success' | 'error'; text: string; className?: string }) {
  const styles =
    type === 'success'
      ? 'border-green-200 bg-green-50 text-green-700'
      : 'border-red-200 bg-red-50 text-red-700';
  return <div className={`rounded-md border px-3 py-2 text-sm ${styles} ${className}`}>{text}</div>;
}
