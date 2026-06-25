'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useStore } from '@/store';

type Step = 'phone' | 'otp' | 'profile';

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useStore();
  const router = useRouter();

  const handlePhoneNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.match(/^\+[1-9]\d{6,14}$/)) {
      setError('Enter a valid phone number (e.g. +919876543210)');
      return;
    }
    setError('');
    setStep('otp');
  };

  const handleOtpInput = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus();
    }
  };

  const handleOtpNext = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code !== '123456') {
      setError('Invalid OTP. Use 123456 for testing.');
      return;
    }
    setError('');
    setStep('profile');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || displayName.length > 50) {
      setError('Name must be 1–50 characters.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/register', {
        phone,
        display_name: displayName,
        password,
        otp: otp.join(''),
      });
      setAuth(res.data.user, res.data.access_token);
      router.replace('/chat');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: 'var(--signal-bg)' }}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-8 flex flex-col gap-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--signal-teal)' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 3C8.82 3 3 8.82 3 16c0 2.36.63 4.57 1.73 6.48L3 29l6.52-1.73C11.43 28.37 13.64 29 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3z" fill="white" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--signal-text)' }}>Signal</h1>
        </div>

        {/* Step: Phone */}
        {step === 'phone' && (
          <form onSubmit={handlePhoneNext} className="flex flex-col gap-4">
            <div className="text-center">
              <p className="font-semibold text-lg" style={{ color: 'var(--signal-text)' }}>Enter your phone number</p>
              <p className="text-sm mt-1" style={{ color: 'var(--signal-text-muted)' }}>We'll send you a verification code.</p>
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+919876543210"
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all text-center text-lg tracking-widest"
              style={{ borderColor: 'var(--signal-border)', background: 'var(--signal-bg)', color: 'var(--signal-text)' }}
              onFocus={(e) => e.target.style.borderColor = 'var(--signal-teal)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--signal-border)'}
            />
            {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" className="w-full py-3 rounded-xl text-white font-semibold text-sm" style={{ background: 'var(--signal-teal)' }}>
              Next →
            </button>
          </form>
        )}

        {/* Step: OTP */}
        {step === 'otp' && (
          <form onSubmit={handleOtpNext} className="flex flex-col gap-4">
            <div className="text-center">
              <p className="font-semibold text-lg" style={{ color: 'var(--signal-text)' }}>Enter the 6-digit code</p>
              <p className="text-sm mt-1" style={{ color: 'var(--signal-text-muted)' }}>Sent to {phone}</p>
              <p className="text-xs mt-2 px-3 py-1 rounded-full inline-block" style={{ background: 'var(--signal-selected)', color: 'var(--signal-teal)' }}>
                Use code: <strong>123456</strong>
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpInput(idx, e.target.value)}
                  className="w-10 h-12 text-center text-lg font-bold border rounded-xl outline-none transition-all"
                  style={{
                    borderColor: digit ? 'var(--signal-teal)' : 'var(--signal-border)',
                    background: 'var(--signal-bg)',
                    color: 'var(--signal-text)',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--signal-teal)'}
                />
              ))}
            </div>
            {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2 text-center">{error}</p>}
            <button type="submit" className="w-full py-3 rounded-xl text-white font-semibold text-sm" style={{ background: 'var(--signal-teal)' }}>
              Verify
            </button>
            <button type="button" onClick={() => setStep('phone')} className="text-sm text-center" style={{ color: 'var(--signal-text-muted)' }}>
              ← Change number
            </button>
          </form>
        )}

        {/* Step: Profile */}
        {step === 'profile' && (
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div className="text-center">
              <p className="font-semibold text-lg" style={{ color: 'var(--signal-text)' }}>Set up your profile</p>
              <p className="text-sm mt-1" style={{ color: 'var(--signal-text-muted)' }}>This info is visible to your contacts.</p>
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide mb-1 block" style={{ color: 'var(--signal-text-muted)' }}>Your Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="John Doe"
                maxLength={50}
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
                style={{ borderColor: 'var(--signal-border)', background: 'var(--signal-bg)', color: 'var(--signal-text)' }}
                onFocus={(e) => e.target.style.borderColor = 'var(--signal-teal)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--signal-border)'}
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide mb-1 block" style={{ color: 'var(--signal-text-muted)' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
                style={{ borderColor: 'var(--signal-border)', background: 'var(--signal-bg)', color: 'var(--signal-text)' }}
                onFocus={(e) => e.target.style.borderColor = 'var(--signal-teal)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--signal-border)'}
              />
            </div>
            {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60"
              style={{ background: 'var(--signal-teal)' }}
            >
              {loading ? 'Creating account...' : 'Done ✓'}
            </button>
          </form>
        )}

        <p className="text-center text-sm" style={{ color: 'var(--signal-text-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold" style={{ color: 'var(--signal-teal)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
