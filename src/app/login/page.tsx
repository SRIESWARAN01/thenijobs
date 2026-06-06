'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, Phone, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { GoogleIcon } from '@/components/ui/BrandIcons';
import { useAuth } from '@/contexts/AuthContext';
import type { ConfirmationResult } from 'firebase/auth';

type AuthMode = 'email' | 'phone';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a1a]" />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const [redirectUrl, setRedirectUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      if (redirect) {
        setRedirectUrl(redirect);
      }
    }
  }, []);

  const {
    user,
    loading: authLoading,
    error: authError,
    signInWithEmail,
    signInWithGoogle,
    sendPhoneOTP,
    verifyPhoneOTP,
    clearError
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('email');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [localError, setLocalError] = useState<string | null>(null);
  
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);

  // Clear errors on mode switch
  useEffect(() => {
    clearError();
    setLocalError(null);
  }, [mode, clearError]);

  // Role-based automatic redirect after successful login
  useEffect(() => {
    if (user) {
      if (redirectUrl) {
        router.push(redirectUrl);
      } else if (user.role === 'admin' || user.role === 'super_admin') {
        router.push('/admin/dashboard');
      } else if (user.role === 'employer' || user.role === 'business_owner') {
        router.push('/employer/dashboard');
      } else {
        router.push('/seeker/dashboard');
      }
    }
  }, [user, router, redirectUrl]);

  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) {
      document.getElementById(`otp-${i + 1}`)?.focus();
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLocalError(null);
    try {
      await signInWithEmail(email, password);
    } catch (err: any) {
      console.error(err);
      setLocalError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setLocalError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    setLocalError(null);
    try {
      const formattedPhone = `+91${phone}`;
      const confirmation = await sendPhoneOTP(formattedPhone, 'recaptcha-container');
      confirmationResultRef.current = confirmation;
      setStep('otp');
    } catch (err: any) {
      console.error(err);
      setLocalError(err.message || 'Failed to send OTP. Please check your number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setLocalError('Please enter the 6-digit OTP.');
      return;
    }
    if (!confirmationResultRef.current) {
      setLocalError('Session expired. Please request OTP again.');
      setStep('input');
      return;
    }
    setLoading(true);
    setLocalError(null);
    try {
      await verifyPhoneOTP(confirmationResultRef.current, fullOtp);
    } catch (err: any) {
      console.error(err);
      setLocalError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setLocalError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error(err);
      setLocalError(err.message || 'Google Sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  // Pre-loaded demo logins using standard accounts
  const handleDemoLogin = async (role: 'seeker' | 'employer' | 'admin') => {
    setLoading(true);
    setLocalError(null);
    const emailMap = {
      seeker: 'seeker@demo.com',
      employer: 'employer@demo.com',
      admin: 'admin@demo.com',
    };
    try {
      await signInWithEmail(emailMap[role], 'demopassword');
    } catch (err: any) {
      console.error(err);
      setLocalError(`Demo login failed. Make sure the '${emailMap[role]}' account exists in Firebase with password 'demopassword'.`);
    } finally {
      setLoading(false);
    }
  };

  const activeError = localError || authError;

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center px-4 blob-bg grid-pattern">
      {/* Invisible Recaptcha Container */}
      <div id="recaptcha-container"></div>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <img src="/logo.png" alt="THENIJOBS Logo" className="h-10 w-auto object-contain" />
        </Link>

        <div className="glass-card rounded-3xl p-7 shadow-2xl">
          <h1 className="text-2xl font-outfit font-bold text-white text-center mb-1">Welcome back</h1>
          <p className="text-gray-400 text-sm text-center mb-7">Sign in to your account</p>

          {activeError && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/15 mb-4">
              <AlertCircle size={14} className="text-rose-400 flex-shrink-0" />
              <p className="text-[11px] text-rose-300">{activeError}</p>
            </div>
          )}

          {/* Mode Toggle */}
          <div className="flex rounded-2xl bg-white/5 p-1 gap-1 mb-6">
            {(['email', 'phone'] as AuthMode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setStep('input'); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all
                  ${mode === m ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                {m === 'email' ? '📧 Email' : '📱 Mobile OTP'}
              </button>
            ))}
          </div>

          {step === 'input' ? (
            <form onSubmit={mode === 'email' ? handleEmailLogin : handlePhoneSubmit} className="space-y-4">
              {mode === 'email' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-medium">Email Address</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input type="email" required placeholder="your@email.com"
                        value={email} onChange={e => setEmail(e.target.value)}
                        className="search-input w-full pl-10 pr-4 py-3 text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-medium">Password</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input type={showPass ? 'text' : 'password'} required placeholder="••••••••"
                        value={password} onChange={e => setPassword(e.target.value)}
                        className="search-input w-full pl-10 pr-10 py-3 text-sm" />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Link href="/forgot-password" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-medium">Mobile Number</label>
                  <div className="flex gap-2">
                    <div className="search-input px-3 py-3 text-sm text-gray-400 w-16 text-center rounded-xl">+91</div>
                    <div className="relative flex-1">
                      <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input type="tel" required maxLength={10} placeholder="98765 43210"
                        value={phone} onChange={e => setPhone(e.target.value)}
                        className="search-input w-full pl-10 pr-4 py-3 text-sm" />
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full btn-gradient py-3.5 rounded-2xl font-semibold text-sm relative z-10 flex items-center justify-center gap-2 mt-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {mode === 'phone' ? 'Send OTP' : 'Sign In'}
                {!loading && <ArrowRight size={15} />}
              </button>

              <div className="relative flex items-center gap-3 py-1">
                <div className="flex-1 gradient-divider" />
                <span className="text-xs text-gray-600">or</span>
                <div className="flex-1 gradient-divider" />
              </div>

              <button type="button" onClick={handleGoogleLogin} disabled={loading}
                className="w-full btn-outline-glass py-3 rounded-2xl text-sm font-medium flex items-center justify-center gap-2">
                <GoogleIcon size={16} />
                Continue with Google
              </button>
            </form>
          ) : (
            /* OTP Screen */
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-3xl mb-2">📱</div>
                <p className="text-sm text-gray-300">OTP sent to your mobile</p>
                <p className="text-xs text-gray-500 mt-1">Enter the 6-digit code below</p>
              </div>
              <div className="flex justify-center gap-2">
                {otp.map((digit, i) => (
                  <input key={i} id={`otp-${i}`} type="text" maxLength={1} value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    className="w-11 h-12 text-center text-white text-lg font-bold rounded-xl bg-white/5 border border-white/15 focus:border-violet-500 focus:bg-white/8 outline-none transition-all" />
                ))}
              </div>
              <button onClick={handleVerifyOtp} disabled={loading}
                className="w-full btn-gradient py-3.5 rounded-2xl font-semibold text-sm relative z-10 flex items-center justify-center gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Verify OTP'}
              </button>
              <p className="text-center text-xs text-gray-500">
                Didn&apos;t receive? <button className="text-violet-400 hover:text-violet-300">Resend OTP</button>
              </p>
            </div>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Join Free
            </Link>
          </p>

          {/* Quick Demo Access Buttons */}
          <div className="mt-6 pt-5 border-t border-white/5 space-y-2.5">
            <p className="text-center text-[10px] uppercase font-bold text-gray-500 tracking-wider">Quick Demo Access</p>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => handleDemoLogin('seeker')} disabled={loading} className="px-2 py-2 rounded-xl bg-violet-500/10 hover:bg-violet-500/25 border border-violet-500/20 text-[10px] font-semibold text-violet-300 text-center transition-all cursor-pointer">
                👤 Seeker
              </button>
              <button onClick={() => handleDemoLogin('employer')} disabled={loading} className="px-2 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/25 border border-cyan-500/20 text-[10px] font-semibold text-cyan-300 text-center transition-all cursor-pointer">
                🏢 Employer
              </button>
              <button onClick={() => handleDemoLogin('admin')} disabled={loading} className="px-2 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/20 text-[10px] font-semibold text-amber-300 text-center transition-all cursor-pointer">
                ⚙️ Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
