import { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { auth, googleProvider } from "../../services/firebase";
import { Mail, Lock, Check, Loader2 } from 'lucide-react';

export default function LoginForm() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/dashboard");
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      // Show more detailed error for debugging
      if (error.code === 'auth/popup-closed-by-user') {
        setError("Sign-in cancelled.");
      } else if (error.code === 'auth/operation-not-allowed') {
        setError("Google Sign-In is not enabled in Firebase Console.");
      } else {
        setError(error.message || "Failed to sign in with Google");
      }
    }
  };

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
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={16} />
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex justify-between items-center mb-1.5 ml-1">
            <label className="text-xs font-semibold text-gray-700">Password</label>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={16} />
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* Remember */}
        <div className="flex items-center gap-2.5 ml-1">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              id="remember"
              className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 transition-all checked:border-blue-600 checked:bg-blue-600 hover:border-blue-400"
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
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
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
          className="flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all active:bg-gray-100"
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

      {/* Signup */}
      <p className="text-sm text-center text-gray-500 mt-8 font-medium">
        Don&apos;t have an account?{" "}
        <Link
          to="/signup"
          className="text-blue-600 hover:text-blue-700 hover:underline font-semibold"
        >
          Create free account
        </Link>
      </p>
    </div>
  );
}
