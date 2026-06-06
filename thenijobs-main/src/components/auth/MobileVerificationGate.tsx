'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Loader2, LockKeyhole, Phone, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface MobileVerificationGateProps {
  children: ReactNode;
}

function normalizeIndianMobile(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return input.startsWith('+') ? input : `+${digits}`;
}

export default function MobileVerificationGate({ children }: MobileVerificationGateProps) {
  const {
    user,
    firebaseUser,
    error,
    clearError,
    logout,
    sendMobileVerificationOTP,
    verifyMobileVerificationOTP,
  } = useAuth();

  const [phone, setPhone] = useState(user?.phone || '');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isVerified = Boolean(
    isAdmin ||
    user?.mobileVerified ||
    user?.phoneVerified ||
    firebaseUser?.phoneNumber,
  );

  const formattedPhone = useMemo(() => normalizeIndianMobile(phone), [phone]);

  if (!user || isVerified) {
    return <>{children}</>;
  }

  const handleSendOtp = async () => {
    clearError();
    setLocalError(null);
    const digits = formattedPhone.replace(/\D/g, '');
    if (digits.length < 10) {
      setLocalError('Enter a valid mobile number with country code.');
      return;
    }

    setLoading(true);
    try {
      const id = await sendMobileVerificationOTP(formattedPhone, 'mobile-verification-recaptcha');
      setVerificationId(id);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    clearError();
    setLocalError(null);
    if (!verificationId) {
      setLocalError('Request an OTP first.');
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      setLocalError('Enter the 6-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      await verifyMobileVerificationOTP(verificationId, otp);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to verify OTP.');
    } finally {
      setLoading(false);
    }
  };

  const activeError = localError || error;

  return (
    <div className="min-h-screen bg-[#0a0a1a] grid-pattern flex items-center justify-center px-4 py-10 text-white font-outfit">
      <div id="mobile-verification-recaptcha" />
      <div className="glass-card w-full max-w-md rounded-3xl p-6 sm:p-8 border border-cyan-500/20">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-300 mb-5">
          <LockKeyhole size={22} />
        </div>

        <h1 className="text-xl font-bold">Verify your mobile number</h1>
        <p className="text-sm text-gray-400 mt-2 leading-relaxed">
          Mobile verification is required before using THENIJOBS dashboards, posting jobs,
          applying, saving records, or contacting candidates.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-xs text-gray-400 font-medium block mb-1.5">
              Mobile number
            </label>
            <div className="relative">
              <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+91 98765 43210"
                className="search-input w-full pl-10 pr-4 py-3 text-sm"
              />
            </div>
          </div>

          {verificationId && (
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1.5">
                OTP
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                placeholder="6-digit code"
                className="search-input w-full px-4 py-3 text-sm tracking-[0.35em]"
              />
            </div>
          )}

          {activeError && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs text-rose-300">
              {activeError}
            </div>
          )}

          <button
            onClick={verificationId ? handleVerifyOtp : handleSendOtp}
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-emerald-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            {verificationId ? 'Verify OTP' : 'Send OTP'}
          </button>

          {verificationId && (
            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-gray-300 hover:text-white disabled:opacity-50"
            >
              Resend OTP
            </button>
          )}

          <button
            onClick={() => logout()}
            className="w-full py-2 text-xs text-gray-500 hover:text-gray-300"
          >
            Sign out and use another account
          </button>
        </div>
      </div>
    </div>
  );
}
