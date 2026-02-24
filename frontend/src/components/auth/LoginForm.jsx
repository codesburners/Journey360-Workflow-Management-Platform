import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { auth, googleProvider } from "../../services/firebase";
import { apiService } from "../../services/apiService";
import { Mail, Lock, Check, Loader2, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function LoginForm() {
  const navigate = useNavigate();

  // Handle redirect result on component mount
  const [checkingRedirect, setCheckingRedirect] = useState(true);

  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result) {
          await check2FAStatus();
        }
        setCheckingRedirect(false);
      })
      .catch((error) => {
        console.error("Redirect Sign-In Error:", error);
        setError(error.message || "Failed to sign in with Google (Redirect)");
        setCheckingRedirect(false);
      });
  }, []);

  const [step, setStep] = useState('login'); // 'login' | '2fa'

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [verificationCode, setVerificationCode] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      await check2FAStatus();
    } catch (err) {
      setError("Invalid email or password");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
      await check2FAStatus();
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        setError("Sign-in cancelled.");
      } else {
        setError(error.message || "Failed to sign in with Google");
      }
      setLoading(false);
    }
  };

  const handleGoogleRedirect = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithRedirect(auth, googleProvider);
      // Logic continues in useEffect after redirect
    } catch (error) {
      console.error("Google Redirect Error:", error);
      setError(error.message || "Failed to initiate redirect sign-in");
      setLoading(false);
    }
  };

  const check2FAStatus = async () => {
    try {
      // Fetch user profile to check if 2FA is enabled
      const profile = await apiService.getProfile(auth);

      if (profile.two_factor_enabled) {
        setStep('2fa');
        setLoading(false);
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Failed to check 2FA status:", err);
      // Fallback: If we can't check profile, we assume no 2FA or let backend block subsequent requests?
      // Ideally we'd block here, but for now let's let them in and if backend fails later, so be it.
      // Or better: Show error.
      setError("Failed to verify account settings. Please try again.");
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await apiService.verify2FA(auth, verificationCode);
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------------------
  // RENDER: 2FA Input
  // ----------------------------------------------------------------------
  if (step === '2fa') {
    return (
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 border border-gray-100/50">
        <div className="mb-6 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Two-Factor Auth</h2>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            Extra security is enabled. Please enter the 6-digit code from your authenticator app.
          </p>
        </div>

        <form onSubmit={handleVerify2FA} className="space-y-6">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1.5 text-center uppercase tracking-wider">Verification Code</label>
            <input
              type="text"
              maxLength="6"
              autoFocus
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center text-3xl tracking-[1em] font-mono py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all placeholder:tracking-normal"
              placeholder="000000"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs font-medium flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-1">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || verificationCode.length !== 6}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Verify & Sign In"}
          </button>
        </form>

        <button
          onClick={() => setStep('login')}
          className="w-full mt-6 flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Login
        </button>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // RENDER: Login Form (Default)
  // ----------------------------------------------------------------------
  return (
    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 border border-gray-100/50">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome Back</h2>
        <p className="text-gray-500 mt-1 text-sm leading-relaxed">
          Enter your details below to access your personalized travel dashboard.
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        {/* Email */}
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1.5 ml-1">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors" size={16} />
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex justify-between items-center mb-1.5 ml-1">
            <label className="text-xs font-semibold text-gray-700">Password</label>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors" size={16} />
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* Remember */}
        <div className="flex items-center gap-2.5 ml-1">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              id="remember"
              className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 transition-all checked:border-emerald-600 checked:bg-emerald-600 hover:border-emerald-400"
            />
            <Check size={12} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" strokeWidth={3} />
          </div>
          <label htmlFor="remember" className="text-xs text-gray-600 cursor-pointer select-none">Keep me signed in for 30 days</label>
        </div>

        {/* Error */}
        {error && (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
            ⚠️ {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Or continue with</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Social (UI only for now) */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className={`flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-2.5 text-xs font-semibold text-gray-700 transition-all ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100'}`}
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" alt="Google" />
          Google
        </button>
        <button className="flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all active:bg-gray-100">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.36-1.09-.54-2.09-.56-3.19.01-1.39.73-2.12.33-3.11-.64-1.99-1.95-3.41-5.6-.66-9.67 1.37-2.02 3.82-2.31 5.09-1.07.72.7 1.45.65 2.15-.05 1.51-1.5 3.75-1.25 4.88.24-.03.02-2.73 1.62-2.73 1.62.06.07 2.07 3.51.5 8.2-.18.52-.46 1.09-.85 1.66zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
          Apple
        </button>
      </div>

      {/* Fallback for Popup Issues caused by network/browser settings */}
      {error && (error.includes("cancelled") || error.includes("closed") || error.includes("network")) && (
        <div className="mt-4 text-center animate-in fade-in slide-in-from-top-1">
          <p className="text-xs text-gray-500 mb-2">Popup blocked or network error?</p>
          <button
            type="button"
            onClick={handleGoogleRedirect}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
          >
            Try Redirect Login Method
          </button>
        </div>
      )}

      {/* Signup */}
      <p className="text-sm text-center text-gray-500 mt-8 font-medium">
        Don&apos;t have an account?{" "}
        <Link
          to="/signup"
          className="text-emerald-600 hover:text-emerald-700 hover:underline font-semibold"
        >
          Create free account
        </Link>
      </p>
    </div>
  );
}
