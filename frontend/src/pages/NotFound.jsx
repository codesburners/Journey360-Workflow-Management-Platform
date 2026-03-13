import React from 'react';
import { Link } from 'react-router-dom';
import { MapPinOff, Home, ArrowLeft, Compass } from 'lucide-react';

const NotFound = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-emerald-50/20 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 -left-20 w-72 h-72 bg-indigo-200/30 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl" />
            </div>

            <div className="relative max-w-lg w-full text-center">
                {/* Large 404 with compass */}
                <div className="relative mb-8">
                    <div className="text-[140px] font-black text-slate-100 leading-none select-none tracking-tighter">
                        404
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 bg-white rounded-2xl shadow-xl border border-slate-200 flex items-center justify-center rotate-12 hover:rotate-0 transition-transform duration-500">
                            <Compass className="w-12 h-12 text-indigo-500" strokeWidth={1.5} />
                        </div>
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-slate-900 mb-3">
                    Lost your way?
                </h1>

                {/* Subtitle */}
                <p className="text-slate-500 text-lg mb-3 leading-relaxed max-w-md mx-auto">
                    This destination doesn't exist on our map. Let's get you back on track.
                </p>

                {/* Map pin icon */}
                <div className="flex items-center justify-center gap-2 text-slate-400 mb-10">
                    <MapPinOff className="w-4 h-4" />
                    <span className="text-sm font-medium">Page not found</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center gap-4">
                    <Link
                        to="/"
                        className="flex items-center gap-2 px-7 py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 transition-all active:scale-95 text-sm"
                    >
                        <Home className="w-4 h-4" />
                        Back to Home
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 px-7 py-3.5 bg-white text-slate-700 rounded-xl font-semibold hover:bg-slate-50 border border-slate-200 shadow-sm transition-all active:scale-95 text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                </div>

                {/* Quick links */}
                <div className="mt-12 pt-8 border-t border-slate-200/60">
                    <p className="text-sm text-slate-400 mb-4">Popular destinations</p>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                        {[
                            { label: 'Dashboard', path: '/dashboard' },
                            { label: 'My Trips', path: '/my-trips' },
                            { label: 'Safety Center', path: '/safety' },
                            { label: 'Assistant', path: '/assistant' },
                        ].map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
