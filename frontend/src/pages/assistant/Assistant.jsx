import React from 'react';
import AppLayout from '../../components/layout/AppLayout';
import ChatInterface from '../../components/assistant/ChatInterface';
import { Sparkles, MapPin, Shield, Plane, Clock } from 'lucide-react';

const Assistant = () => {
    return (
        <AppLayout>
            <div className="flex flex-col h-full overflow-hidden bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                {/* Enhanced Page Header with Gradient */}
                <div className="relative px-8 py-8 border-b border-gray-100/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-10">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5 dark:from-emerald-500/10 dark:via-teal-500/10 dark:to-cyan-500/10"></div>

                    <div className="relative max-w-7xl mx-auto">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/30">
                                <Sparkles className="text-white" size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                                    AI Travel Assistant
                                    <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">BETA</span>
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                    Your intelligent companion for personalized travel planning
                                </p>
                            </div>
                        </div>

                        {/* Feature Pills */}
                        <div className="flex flex-wrap gap-2 mt-4">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-full border border-gray-100 dark:border-slate-700 text-xs font-medium text-gray-600 dark:text-gray-300">
                                <MapPin size={12} className="text-emerald-500" />
                                <span>Route Planning</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-full border border-gray-100 dark:border-slate-700 text-xs font-medium text-gray-600 dark:text-gray-300">
                                <Shield size={12} className="text-teal-500" />
                                <span>Safety Tips</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-full border border-gray-100 dark:border-slate-700 text-xs font-medium text-gray-600 dark:text-gray-300">
                                <Plane size={12} className="text-cyan-500" />
                                <span>Itinerary Generation</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-full border border-gray-100 dark:border-slate-700 text-xs font-medium text-gray-600 dark:text-gray-300">
                                <Clock size={12} className="text-purple-500" />
                                <span>Real-time Updates</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-hidden">
                    <div className="h-full max-w-7xl mx-auto p-6 md:p-8 flex flex-col">
                        {/* Chat Interface with Enhanced Container */}
                        <div className="flex-1 h-full min-h-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-3xl border border-gray-100/50 dark:border-slate-800/50 shadow-2xl shadow-emerald-500/5 p-6 md:p-8">
                            <ChatInterface />
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default Assistant;
