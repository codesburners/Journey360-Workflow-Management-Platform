import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Wifi, Activity, Timer, ChevronRight } from 'lucide-react';
import { transportService } from '../../services/transportService';

const TransportSchedule = ({ route }) => {
    const [now, setNow] = useState(new Date());

    // Update clock every 30s
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(interval);
    }, []);

    if (!route) return null;

    const traffic = transportService.getTrafficLevel();

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const getCountdown = (departure) => {
        const diff = Math.round((new Date(departure) - now) / 60000);
        if (diff <= 0) return 'Departing now';
        if (diff === 1) return 'In 1 min';
        return `In ${diff} min`;
    };

    const transitLegs = route.legs.filter(l => l.mode !== 'walk');

    return (
        <div className="space-y-4">
            {/* Traffic Status */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700/50 rounded-xl p-3.5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: traffic.color + '18' }}>
                        <Activity size={16} style={{ color: traffic.color }} />
                    </div>
                    <div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">Traffic</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{traffic.delay}</p>
                    </div>
                </div>
                <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: traffic.color + '18', color: traffic.color }}
                >
                    {traffic.level}
                </span>
            </div>

            {/* Schedule for each transit leg */}
            {transitLegs.map((leg) => {
                const nextDepartures = leg.departures?.slice(0, 3) || [];

                return (
                    <div key={leg.id} className="bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700/50 rounded-xl overflow-hidden">
                        {/* Leg Header */}
                        <div className="flex items-center justify-between p-3.5 border-b border-gray-100 dark:border-slate-700/50">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: leg.color + '18' }}>
                                    <span className="text-sm">
                                        {leg.mode === 'train' ? '🚂' : leg.mode === 'bus' ? '🚌' : '✈️'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{leg.label}</span>
                                    {leg.routeNumber && (
                                        <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                                            {leg.routeNumber}
                                        </span>
                                    )}
                                    <p className="text-xs text-gray-400 dark:text-gray-500">{leg.from.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                                <Timer size={12} />
                                Every {leg.frequency} min
                            </div>
                        </div>

                        {/* Next Departures */}
                        <div className="divide-y divide-gray-50 dark:divide-slate-700/30">
                            {nextDepartures.map((dep, i) => {
                                const countdown = getCountdown(dep);
                                const isNext = i === 0;

                                return (
                                    <div key={i} className={`flex items-center justify-between px-3.5 py-2.5 ${isNext ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
                                        <div className="flex items-center gap-3">
                                            <Clock size={13} className={isNext ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'} />
                                            <span className={`text-sm font-medium ${isNext ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                                {formatTime(dep)}
                                            </span>
                                        </div>
                                        <span className={`text-xs font-bold ${isNext
                                                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full'
                                                : 'text-gray-400 dark:text-gray-500'
                                            }`}>
                                            {countdown}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Delay Alert */}
                        {leg.delay?.delayed && (
                            <div className="flex items-center gap-2 mx-3.5 mb-3 mt-2 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg">
                                <AlertTriangle size={14} className="text-red-500 shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-red-600 dark:text-red-400">Expected delay: +{leg.delay.minutes} min</p>
                                    <p className="text-[10px] text-red-500/70 dark:text-red-400/60">{leg.delay.reason}</p>
                                </div>
                            </div>
                        )}

                        {/* Platform Info */}
                        {leg.platform && (
                            <div className="px-3.5 pb-3 pt-1">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    Platform <span className="font-bold text-blue-600 dark:text-blue-400">{leg.platform}</span>
                                </span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default TransportSchedule;
