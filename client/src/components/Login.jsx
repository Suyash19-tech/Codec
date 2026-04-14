import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, ArrowRight, Loader2, UserPlus, LogIn, KeyRound } from 'lucide-react';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();

  // Modes: 'login', 'signup', 'forgot'
  const [mode, setMode] = useState('login');
  const [step, setStep] = useState(1); // For multi-step flows

  // Shared state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Reset state when switching modes
  const switchMode = (newMode) => {
    setMode(newMode);
    setStep(1);
    setError('');
    setMessage('');
    setOtp('');
    setPassword('');
  };

  // --- Login Handler ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      localStorage.setItem('codec_token', data.token);
      localStorage.setItem('codec_user', JSON.stringify(data.user));
      localStorage.setItem('codec_user_id', data.user._id);
      if (onLogin) onLogin(data.user);
      navigate('/dashboard');
    } catch (err) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  // --- Signup Handlers ---
  const handleRequestSignupOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/signup-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to send OTP');
      }
      setStep(2);
      setMessage('Verification code sent to email');
    } catch (err) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  const handleCompleteSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Signup failed');

      localStorage.setItem('codec_token', data.token);
      localStorage.setItem('codec_user', JSON.stringify(data.user));
      if (onLogin) onLogin(data.user);
      navigate('/dashboard');
    } catch (err) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  // --- Forgot Password Handlers ---
  const handleRequestForgotOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/forgot-password-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to send reset code');
      }
      setStep(2);
      setMessage('Reset code sent to email');
    } catch (err) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword: password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Reset failed');
      }
      setMessage('Password reset successful! Please log in.');
      setTimeout(() => switchMode('login'), 2000);
    } catch (err) { setError(err.message); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-sans bg-[#050505]">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-6xl font-extrabold mb-2 tracking-tight bg-gradient-to-b from-white via-gray-300 to-gray-600 bg-clip-text text-transparent">
            CODEC
          </h1>
          <p className="text-gray-400 font-medium tracking-wide">
            {mode === 'login' ? 'Institutional Repository Login' :
              mode === 'signup' ? 'Professor Registration' : 'Recover Account'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
          <button
            onClick={() => switchMode('login')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${mode === 'login' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <LogIn size={14} /> LOGIN
          </button>
          <button
            onClick={() => switchMode('signup')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${mode === 'signup' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <UserPlus size={14} /> SIGN UP
          </button>
        </div>

        {/* Glass Container */}
        <div className="p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">

          {/* 1. LOGIN MODE */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} noValidate className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 ml-1">Institutional Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-4 h-5 w-5 text-gray-600" />
                  <input
                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                    placeholder="professor@university.edu"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 h-5 w-5 text-gray-600" />
                  <input
                    type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <button
                type="submit" disabled={isLoading}
                className="w-full py-4 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : 'Log In'}
              </button>
              <div className="text-center">
                <button type="button" onClick={() => switchMode('forgot')} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">Forgot your password?</button>
              </div>
            </form>
          )}

          {/* 2. SIGNUP MODE */}
          {mode === 'signup' && (
            <div className="space-y-6">
              {step === 1 ? (
                <form onSubmit={handleRequestSignupOtp} noValidate className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 ml-1">Institutional Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-4 h-5 w-5 text-gray-600" />
                      <input
                        type="email" required value={email} onChange={e => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                        placeholder="professor@university.edu"
                      />
                    </div>
                  </div>
                  <button
                    type="submit" disabled={isLoading}
                    className="w-full py-4 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : <>Send Verification Code <ArrowRight size={16} /></>}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCompleteSignup} noValidate className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 ml-1">Verification Code</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-4 h-5 w-5 text-gray-600" />
                      <input
                        type="text" maxLength="6" required value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        inputMode="numeric"
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-center tracking-[0.5em] text-xl font-bold"
                        placeholder="000000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 ml-1">Create Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-4 h-5 w-5 text-gray-600" />
                      <input
                        type="password" required value={password} onChange={e => setPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                        placeholder="Minimum 6 characters"
                      />
                    </div>
                  </div>
                  <button
                    type="submit" disabled={isLoading}
                    className="w-full py-4 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Verify & Create Account'}
                  </button>
                  <button type="button" onClick={() => setStep(1)} className="w-full text-xs text-gray-500 hover:text-gray-300 text-center">Back to email</button>
                </form>
              )}
            </div>
          )}

          {/* 3. FORGOT MODE */}
          {mode === 'forgot' && (
            <div className="space-y-6">
              {step === 1 ? (
                <form onSubmit={handleRequestForgotOtp} noValidate className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <KeyRound size={16} className="text-gray-500" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Password Recovery</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 ml-1">Registered Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-4 h-5 w-5 text-gray-600" />
                      <input
                        type="email" required value={email} onChange={e => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                        placeholder="professor@university.edu"
                      />
                    </div>
                  </div>
                  <button
                    type="submit" disabled={isLoading}
                    className="w-full py-4 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Send Reset Code'}
                  </button>
                  <button type="button" onClick={() => switchMode('login')} className="w-full text-xs text-gray-500 hover:text-gray-300 text-center">Cancel</button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} noValidate className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 ml-1">Reset Code</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-4 h-5 w-5 text-gray-600" />
                      <input
                        type="text" maxLength="6" required value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        inputMode="numeric"
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all text-center tracking-[0.5em] text-xl font-bold"
                        placeholder="000000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 ml-1">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-4 h-5 w-5 text-gray-600" />
                      <input
                        type="password" required value={password} onChange={e => setPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                        placeholder="Enter new password"
                      />
                    </div>
                  </div>
                  <button
                    type="submit" disabled={isLoading}
                    className="w-full py-4 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Update Password'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Feedback Messages */}
          {error && (
            <div className="mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}
          {message && (
            <div className="mt-6 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
              {message}
            </div>
          )}
        </div>

        <p className="mt-10 text-center text-gray-600 text-xs tracking-widest uppercase">
          Institutional Security Protocol v2.1
        </p>
      </div>
    </div>
  );
};

export default Login;
