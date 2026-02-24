import React, { useState, useEffect } from 'react';
import { Train, Plane, Bus, Clock, AlertTriangle, Wifi, Star, MapPin, ChevronDown, ChevronUp, Loader2, Info, ArrowRight, Armchair, Sparkles } from 'lucide-react';
import { transportService } from '../../services/transportService';

const LiveSchedulePanel = ({ sourceName, destName, onClose, initialTab = 'trains' }) => {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [scheduleData, setScheduleData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (initialTab) setActiveTab(initialTab);
    }, [initialTab]);

    useEffect(() => {
        if (sourceName && destName) {
            loadSchedules();
        }
    }, [sourceName, destName]);


    const loadSchedules = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await transportService.fetchAllSchedules(sourceName, destName);
            setScheduleData(data);
        } catch (err) {
            setError('Failed to load schedules. Please try again.');
            console.error('Schedule fetch error:', err);
        }
        setLoading(false);
    };

    const tabs = [
        { id: 'trains', label: 'Trains', icon: Train, emoji: '🚆', color: '#3B82F6' },
        { id: 'flights', label: 'Flights', icon: Plane, emoji: '✈️', color: '#8B5CF6' },
        { id: 'buses', label: 'Buses', icon: Bus, emoji: '🚌', color: '#F97316' },
    ];

    const getTabData = () => {
        if (!scheduleData) return { schedules: [], count: 0, source: '' };
        return scheduleData[activeTab] || { schedules: [], count: 0, source: '' };
    };

    const tabData = getTabData();

    const getStatusColor = (status) => {
        if (!status) return '#6B7280';
        const s = status.toLowerCase();
        if (s.includes('on time') || s === 'scheduled') return '#10B981';
        if (s.includes('delay')) return '#F59E0B';
        if (s.includes('cancel')) return '#EF4444';
        if (s === 'in flight' || s === 'landed') return '#3B82F6';
        return '#6B7280';
    };

    return (
        <div className="bg-white dark:bg-slate-900/95 border border-gray-200/50 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-emerald-600 to-teal-600">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Wifi size={14} className="animate-pulse" />
                            Live Transport Schedules
                        </h3>
                        <p className="text-[11px] text-emerald-100 mt-0.5 flex items-center gap-1.5">
                            <MapPin size={10} />
                            {sourceName} <ArrowRight size={10} /> {destName}
                        </p>
                    </div>
                    <button
                        onClick={loadSchedules}
                        disabled={loading}
                        className="text-[10px] font-bold text-white/80 hover:text-white bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-lg transition-all"
                    >
                        {loading ? <Loader2 size={12} className="animate-spin" /> : '↻ Refresh'}
                    </button>
                </div>
            </div>

            {/* Source Badge */}
            {tabData.source && (
                <div className="px-5 py-2 bg-gray-50/80 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-2">
                        <Info size={11} className="text-gray-400" />
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                            Source: <span className="font-semibold">{tabData.api || tabData.source}</span>
                            {tabData.source === 'live' && <span className="ml-1 text-emerald-500">● Live</span>}
                            {tabData.source === 'curated+live' && <span className="ml-1 text-emerald-500">● Live Status</span>}
                            {tabData.source === 'live+status' && <span className="ml-1 text-emerald-500">● Live + Status</span>}
                            {tabData.source === 'curated' && <span className="ml-1 text-blue-500">● Curated</span>}
                            {tabData.source === 'demo' && <span className="ml-1 text-amber-500">● Demo</span>}
                            {tabData.source === 'error' && <span className="ml-1 text-red-500">● API Error</span>}
                        </span>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-gray-100 dark:border-slate-700/50">
                {tabs.map(tab => {
                    const count = scheduleData?.[tab.id]?.count || 0;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-all relative ${isActive
                                ? 'text-gray-900 dark:text-white'
                                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                                }`}
                        >
                            <span className="text-sm">{tab.emoji}</span>
                            {tab.label}
                            {count > 0 && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isActive
                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
                                    }`}>
                                    {count}
                                </span>
                            )}
                            {isActive && (
                                <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full" style={{ backgroundColor: tab.color }} />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="flex items-center gap-3">
                            <Loader2 size={18} className="animate-spin text-emerald-500" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">Loading schedules...</span>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center py-12 px-5">
                        <div className="text-center">
                            <AlertTriangle size={24} className="text-amber-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
                            <button onClick={loadSchedules} className="text-xs text-emerald-600 font-bold mt-2 hover:text-emerald-700">
                                Try Again
                            </button>
                        </div>
                    </div>
                ) : tabData.source === 'error' ? (
                    <div className="flex items-center justify-center py-10 px-5">
                        <div className="text-center max-w-sm">
                            <AlertTriangle size={28} className="text-red-400 mx-auto mb-3" />
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">API Unavailable</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{tabData.error || 'No live data available for this transport mode.'}</p>
                            <button onClick={loadSchedules} className="text-xs text-emerald-600 font-bold mt-3 hover:text-emerald-700">
                                Retry
                            </button>
                        </div>
                    </div>
                ) : tabData.schedules?.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <span className="text-3xl">{tabs.find(t => t.id === activeTab)?.emoji}</span>
                            <p className="text-sm text-gray-500 mt-2">No schedules found</p>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50 dark:divide-slate-800/50">
                        {activeTab === 'trains' && tabData.schedules?.map(train => (
                            <TrainCard
                                key={train.id}
                                train={train}
                                expanded={expandedId === train.id}
                                onToggle={() => setExpandedId(expandedId === train.id ? null : train.id)}
                                getStatusColor={getStatusColor}
                            />
                        ))}
                        {activeTab === 'flights' && tabData.schedules?.map(flight => (
                            <FlightCard
                                key={flight.id}
                                flight={flight}
                                expanded={expandedId === flight.id}
                                onToggle={() => setExpandedId(expandedId === flight.id ? null : flight.id)}
                                getStatusColor={getStatusColor}
                            />
                        ))}
                        {activeTab === 'buses' && tabData.schedules?.map(bus => (
                            <BusCard
                                key={bus.id}
                                bus={bus}
                                expanded={expandedId === bus.id}
                                onToggle={() => setExpandedId(expandedId === bus.id ? null : bus.id)}
                                getStatusColor={getStatusColor}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Train Card ──────────────────────────────────────────────────────────────

const TrainCard = ({ train, expanded, onToggle, getStatusColor }) => (
    <div className="px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">
                        #{train.trainNumber}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{ backgroundColor: getStatusColor(train.status) + '18', color: getStatusColor(train.status) }}>
                        {train.status}
                    </span>
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{train.trainName}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{train.trainType}</p>
            </div>
            <div className="text-right shrink-0 ml-3">
                <div className="flex items-center gap-2 text-sm">
                    <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white">{train.origin?.departureTime}</p>
                        <p className="text-[9px] text-gray-400">{train.origin?.code}</p>
                    </div>
                    <ArrowRight size={12} className="text-gray-300" />
                    <div className="text-left">
                        <p className="font-bold text-gray-900 dark:text-white">{train.destination?.arrivalTime}</p>
                        <p className="text-[9px] text-gray-400">{train.destination?.code}</p>
                    </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1 justify-end">
                    <Clock size={9} /> {train.duration}
                </p>
            </div>
            <div className="ml-2">
                {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
            </div>
        </div>

        {expanded && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700/50 space-y-2 animate-fadeIn">
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>📏 {train.distance}</span>
                    {train.classes && <span>🎟️ {Array.isArray(train.classes) ? train.classes.join(', ') : train.classes}</span>}
                </div>
                {train.fare && (
                    <div className="flex gap-2 flex-wrap">
                        {Object.entries(train.fare).map(([cls, price]) => (
                            <span key={cls} className="text-[10px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                                {cls}: ₹{price}
                            </span>
                        ))}
                    </div>
                )}
                {train.runningDays && (
                    <div className="flex gap-1">
                        {Object.entries(train.runningDays).map(([day, runs]) => (
                            <span key={day} className={`text-[9px] w-6 h-6 flex items-center justify-center rounded-full font-bold ${runs ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500 line-through'
                                }`}>
                                {day.charAt(0).toUpperCase() + day.charAt(1)}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        )}
    </div>
);

// ─── Flight Card ─────────────────────────────────────────────────────────────

const FlightCard = ({ flight, expanded, onToggle, getStatusColor }) => (
    <div className="px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded">
                        {flight.flightNumber}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{ backgroundColor: getStatusColor(flight.status) + '18', color: getStatusColor(flight.status) }}>
                        {flight.status}
                    </span>
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{flight.airline}</p>
                {flight.aircraft && <p className="text-[10px] text-gray-400 dark:text-gray-500">{flight.aircraft}</p>}
            </div>
            <div className="text-right shrink-0 ml-3">
                <div className="flex items-center gap-2 text-sm">
                    <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white">{flight.origin?.departureTime}</p>
                        <p className="text-[9px] text-gray-400">{flight.origin?.iata}</p>
                    </div>
                    <div className="flex flex-col items-center px-1">
                        <Plane size={10} className="text-purple-400 rotate-90" />
                        <div className="w-8 h-[1px] bg-gray-200 dark:bg-slate-700 mt-1" />
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-gray-900 dark:text-white">{flight.destination?.arrivalTime}</p>
                        <p className="text-[9px] text-gray-400">{flight.destination?.iata}</p>
                    </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1 justify-end">
                    <Clock size={9} /> {flight.duration}
                </p>
            </div>
            <div className="ml-2">
                {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
            </div>
        </div>

        {expanded && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700/50 space-y-2 animate-fadeIn">
                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                        <p className="text-gray-400 text-[10px]">Departure</p>
                        <p className="text-gray-700 dark:text-gray-300 font-medium">{flight.origin?.airport || 'N/A'}</p>
                        <p className="text-gray-400 text-[10px]">Terminal {flight.origin?.terminal || '-'} · Gate {flight.origin?.gate || '-'}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-[10px]">Arrival</p>
                        <p className="text-gray-700 dark:text-gray-300 font-medium">{flight.destination?.airport || 'N/A'}</p>
                        <p className="text-gray-400 text-[10px]">Terminal {flight.destination?.terminal || '-'} · Gate {flight.destination?.gate || '-'}</p>
                    </div>
                </div>
                {flight.fare && (
                    <div className="flex gap-2 flex-wrap">
                        {Object.entries(flight.fare).map(([cls, price]) => (
                            <span key={cls} className="text-[10px] bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full font-bold capitalize">
                                {cls}: ₹{price.toLocaleString()}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        )}
    </div>
);

// ─── Bus Card ────────────────────────────────────────────────────────────────

const BusCard = ({ bus, expanded, onToggle, getStatusColor }) => (
    <div className="px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{bus.operator}</span>
                    {bus.id?.startsWith('AI-BUS') && (
                        <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-800/30">
                            <Sparkles size={10} className="text-emerald-500" /> AI Powered
                        </span>
                    )}
                    <span className="text-[9px] text-gray-400 bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                        {bus.operatorType}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{ backgroundColor: getStatusColor(bus.status) + '18', color: getStatusColor(bus.status) }}>
                        {bus.status}
                    </span>
                </div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">{bus.busType}</p>
            </div>
            <div className="text-right shrink-0 ml-3">
                <div className="flex items-center gap-2 text-sm">
                    <p className="font-bold text-gray-900 dark:text-white">{bus.origin?.departureTime}</p>
                    <ArrowRight size={12} className="text-gray-300" />
                    <p className="font-bold text-gray-900 dark:text-white">{bus.destination?.arrivalTime}</p>
                </div>
                <div className="flex items-center gap-2 mt-0.5 justify-end">
                    <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                        <Clock size={9} /> {bus.duration}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {bus.currency === 'INR' ? '₹' : '$'}{bus.fare}
                    </span>
                </div>
            </div>
            <div className="ml-2">
                {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
            </div>
        </div>

        {expanded && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700/50 space-y-2 animate-fadeIn">
                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                        <p className="text-gray-400 text-[10px]">Boarding</p>
                        <p className="text-gray-700 dark:text-gray-300 font-medium">{bus.origin?.boardingPoint}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-[10px]">Dropping</p>
                        <p className="text-gray-700 dark:text-gray-300 font-medium">{bus.destination?.droppingPoint}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>📏 {bus.distance}</span>
                    <span className="flex items-center gap-1">
                        <Armchair size={10} /> {bus.seatsAvailable}/{bus.totalSeats} seats
                    </span>
                    {bus.rating && <span className="flex items-center gap-0.5">
                        <Star size={10} className="text-amber-400 fill-amber-400" /> {bus.rating}
                    </span>}
                </div>
                {bus.amenities && (
                    <div className="flex gap-1.5 flex-wrap">
                        {bus.amenities.map(a => (
                            <span key={a} className="text-[9px] bg-orange-50 dark:bg-orange-900/15 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-full">
                                {a}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        )}
    </div>
);

export default LiveSchedulePanel;
