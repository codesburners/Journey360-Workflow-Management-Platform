import React from 'react';
import { Train, Bus, Plane, Footprints, Car, Bike, Clock, AlertTriangle, Users, ChevronDown, ChevronUp } from 'lucide-react';

const modeIcons = {
    walk: Footprints,
    train: Train,
    bus: Bus,
    airport: Plane,
    drive: Car,
    cycle: Bike,
};

const modeEmoji = {
    walk: '🚶',
    train: '🚂',
    bus: '🚌',
    airport: '✈️',
    drive: '🚗',
    cycle: '🚴',
};

const crowdColors = {
    Low: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500' },
    Medium: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-500' },
    High: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
};

const TransportItinerary = ({ route, onLegHover, onLegClick }) => {
    const [expandedLeg, setExpandedLeg] = React.useState(null);

    if (!route) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                    <Train size={28} className="text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">Search for a route to see<br />step-by-step directions</p>
            </div>
        );
    }

    const toggleLeg = (legId) => {
        setExpandedLeg(expandedLeg === legId ? null : legId);
    };

    return (
        <div className="space-y-1">
            {/* Route Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">{route.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            <Clock size={12} className="inline mr-1" />
                            {route.totalDuration} min
                        </span>
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">₹{route.totalFare}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{route.totalWalkM}m walk</span>
                    </div>
                </div>
                {route.tags?.length > 0 && (
                    <div className="flex flex-col gap-1">
                        {route.tags.map((tag, i) => (
                            <span key={i} className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full whitespace-nowrap">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Timeline */}
            <div className="relative pl-6">
                {route.legs.map((leg, index) => {
                    const Icon = modeIcons[leg.mode] || Footprints;
                    const isLast = index === route.legs.length - 1;
                    const isExpanded = expandedLeg === leg.id;
                    const crowd = leg.crowdDensity ? crowdColors[leg.crowdDensity] : null;

                    return (
                        <div
                            key={leg.id}
                            className="relative"
                            onMouseEnter={() => onLegHover?.(leg)}
                            onMouseLeave={() => onLegHover?.(null)}
                            onClick={() => onLegClick?.(leg)}
                        >
                            {/* Vertical Line */}
                            {!isLast && (
                                <div
                                    className="absolute left-[7px] top-8 w-[3px] rounded-full"
                                    style={{
                                        backgroundColor: leg.color,
                                        height: isExpanded ? 'calc(100% - 8px)' : 'calc(100% - 8px)',
                                        opacity: 0.4
                                    }}
                                ></div>
                            )}

                            {/* Node */}
                            <div className="absolute left-0 top-2 w-[17px] h-[17px] rounded-full border-[3px] flex items-center justify-center z-10"
                                style={{ borderColor: leg.color, backgroundColor: 'white' }}
                            >
                                <div className="w-[7px] h-[7px] rounded-full" style={{ backgroundColor: leg.color }}></div>
                            </div>

                            {/* Leg Content */}
                            <div className="ml-6 pb-5">
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleLeg(leg.id); }}
                                    className="w-full text-left bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700/50 rounded-xl p-3.5 hover:shadow-md transition-all duration-200 group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: leg.color + '18' }}>
                                                <Icon size={16} style={{ color: leg.color }} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{leg.label}</span>
                                                    {leg.routeNumber && leg.mode !== 'walk' && (
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
                                                            {leg.routeNumber}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    {leg.distanceKm > 1 ? `${leg.distanceKm} km` : `${leg.distanceM}m`} · {leg.durationMin} min
                                                    {leg.fare > 0 && <span className="ml-1 text-emerald-600 dark:text-emerald-400 font-semibold"> · ₹{leg.fare}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {leg.crowdDensity && crowd && (
                                                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${crowd.bg}`}>
                                                    <Users size={10} className={crowd.text} />
                                                    <span className={`text-[10px] font-bold ${crowd.text}`}>{leg.crowdDensity}</span>
                                                </div>
                                            )}
                                            {leg.delay?.delayed && (
                                                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 dark:bg-red-900/20">
                                                    <AlertTriangle size={10} className="text-red-500" />
                                                    <span className="text-[10px] font-bold text-red-600 dark:text-red-400">+{leg.delay.minutes}m</span>
                                                </div>
                                            )}
                                            {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700/50 space-y-2 animate-fadeIn">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-500 dark:text-gray-400">From</span>
                                                <span className="font-medium text-gray-800 dark:text-gray-200">{leg.from.name}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-500 dark:text-gray-400">To</span>
                                                <span className="font-medium text-gray-800 dark:text-gray-200">{leg.to.name}</span>
                                            </div>
                                            {leg.platform && (
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-500 dark:text-gray-400">Platform</span>
                                                    <span className="font-bold text-blue-600 dark:text-blue-400">{leg.platform}</span>
                                                </div>
                                            )}
                                            {leg.frequency && leg.mode !== 'walk' && (
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-500 dark:text-gray-400">Frequency</span>
                                                    <span className="font-medium text-gray-800 dark:text-gray-200">Every {leg.frequency} min</span>
                                                </div>
                                            )}
                                            {leg.delay?.delayed && (
                                                <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                                    <AlertTriangle size={14} className="text-red-500 shrink-0" />
                                                    <div>
                                                        <p className="text-xs font-bold text-red-600 dark:text-red-400">Delay: +{leg.delay.minutes} min</p>
                                                        <p className="text-[10px] text-red-500 dark:text-red-400/70">{leg.delay.reason}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {leg.crowdDensity && crowd && (
                                                <div className={`flex items-center gap-2 mt-1 p-2 rounded-lg ${crowd.bg}`}>
                                                    <Users size={14} className={crowd.text} />
                                                    <span className={`text-xs font-semibold ${crowd.text}`}>Crowd Density: {leg.crowdDensity}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                })}

                {/* Final destination marker */}
                <div className="relative">
                    <div className="absolute left-0 top-2 w-[17px] h-[17px] rounded-full bg-red-500 flex items-center justify-center z-10 ring-4 ring-red-500/20">
                        <div className="w-[7px] h-[7px] rounded-full bg-white"></div>
                    </div>
                    <div className="ml-6 pb-2">
                        <p className="text-sm font-bold text-gray-900 dark:text-white pt-1">{route.legs[route.legs.length - 1]?.to.name || 'Destination'}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Arrive in ~{route.totalDuration} min</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransportItinerary;
