import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) {
            toast.error('Please enter your email address');
            return;
        }

        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email.trim());
            setSent(true);
            toast.success('Password reset email sent!');
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                toast.error('No account found with this email.');
            } else if (error.code === 'auth/invalid-email') {
                toast.error('Please enter a valid email address.');
            } else if (error.code === 'auth/too-many-requests') {
                toast.warning('Too many requests. Please wait and try again.');
            } else {
                toast.error('Failed to send reset email. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 flex items-center justify-center p-6">
            <div className="max-w-md w-full">
                {/* Back link */}
                <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Log In
                </Link>

                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
                    {!sent ? (
                        <>
                            {/* Icon */}
                            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Mail className="w-8 h-8 text-indigo-600" />
                            </div>

                            <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">
                                Reset your password
                            </h1>
                            <p className="text-slate-500 text-center mb-8">
                                Enter your email and we'll send you a link to reset your password.
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Email address
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                                        autoFocus
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Sending...
                                        </>
                                    ) : (
                                        'Send Reset Link'
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        /* Success state */
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-3">
                                Check your email
                            </h2>
                            <p className="text-slate-500 mb-6">
                                We've sent a password reset link to <strong className="text-slate-700">{email}</strong>. Check your inbox and click the link to reset your password.
                            </p>
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 flex items-start gap-3 mb-6 text-left">
                                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                                <span>Didn't receive the email? Check your spam folder or try again in a few minutes.</span>
                            </div>
                            <button
                                onClick={() => { setSent(false); setEmail(''); }}
                                className="text-indigo-600 font-semibold hover:text-indigo-700 text-sm transition-colors"
                            >
                                Try a different email
                            </button>
                        </div>
                    )}
                </div>

                <p className="text-center text-sm text-slate-400 mt-6">
                    Remember your password?{' '}
                    <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-700">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
