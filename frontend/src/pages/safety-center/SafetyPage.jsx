import React, { useState, useEffect } from 'react';
import { Bell, Search, Loader2, MapPin, ExternalLink, Radio, ShieldAlert, RefreshCw } from 'lucide-react';
import RiskLevelCard from '../../components/safety/RiskLevelCard';
import EmergencyCard from '../../components/safety/EmergencyCard';
import ActiveAlertsCard from '../../components/safety/ActiveAlertsCard';
import AlertList from '../../components/safety/AlertList';
import AppLayout from '../../components/layout/AppLayout';
import { auth } from '../../services/firebase';
import { apiService } from '../../services/apiService';

const SafetyPage = () => {
    const [location, setLocation] = useState("");
    const [assessment, setAssessment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [activeTrip, setActiveTrip] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [nextUpdate, setNextUpdate] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchTripsAndDetermineLocation = async () => {
        try {
            const trips = await apiService.listTrips(auth);
            if (trips && trips.length > 0) {
                const today = new Date();

                // User Request: "whichever trip is created latest tht should be there"
                // Prioritize the absolute latest created trip (trips[0]) over "Active/Current" trips.
                // This ensures if a user just created a trip, they see THAT trip immediately.
                const latestCreatedTrip = trips[0];

                const targetTrip = latestCreatedTrip;

                if (targetTrip) {
                    setActiveTrip(targetTrip);
                    setLocation(targetTrip.destination);
                    fetchSafety(targetTrip.destination);
                } else {
                    // No trips at all.
                    setLoading(false);
                }
            } else {
                // No trips found
                setLoading(false);
            }
        } catch (error) {
            console.error("Error fetching trips:", error);
            setLoading(false);
        }
    };

    const [error, setError] = useState(null);

    const fetchSafety = async (loc) => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiService.assessSafety(auth, loc || location);
            if (!data) throw new Error("No data received from backend");
            setAssessment(data);
        } catch (err) {
            console.error("Safety Fetch Error:", err);
            setError(err.message || "Failed to load safety data");
        } finally {
            setLoading(false);
            setSubmitting(false);
            setLastUpdated(new Date());
            const next = new Date();
            next.setSeconds(next.getSeconds() + 60); // 60s update cycle
            setNextUpdate(next);
        }
    };

    useEffect(() => {
        fetchTripsAndDetermineLocation();
    }, []);

    useEffect(() => {
        if (!location) return;

        fetchSafety(location);



        const interval = setInterval(() => {
            fetchSafety(location);
        }, 60000); // every 60 seconds (Live feel)

        const timer = setInterval(() => {
            setRefreshKey(k => k + 1); // Force re-render for timer
        }, 1000);

        return () => {
            clearInterval(interval);
            clearInterval(timer);
        };
    }, [location]);

    const getTimeUntilNextUpdate = () => {
        if (!nextUpdate) return 60;
        const diff = Math.floor((nextUpdate - new Date()) / 1000);
        return diff > 0 ? diff : 0;
    };




    return (
        <AppLayout>
            <div className="font-sans min-h-full">
                <main className="flex-1 p-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1 rounded-full border border-red-100 animate-pulse">
                                    <Radio size={14} className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75" />
                                    <Radio size={14} className="relative inline-flex rounded-full bg-red-500" />
                                    <span className="text-xs font-bold tracking-wider">LIVE MONITOR</span>
                                </div>
                                {activeTrip && activeTrip.destination === location && (
                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                                        <MapPin size={12} /> Active Trip
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{location}</h2>
                            </div>
                            <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-sm mt-2">
                                <p>Real-time safety monitoring.</p>
                                {lastUpdated && (
                                    <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500 text-xs bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-700">
                                        <RefreshCw size={10} className={submitting ? "animate-spin" : ""} />
                                        Update in {getTimeUntilNextUpdate()}s
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <input
                                type="text"
                                placeholder="Search location..."
                                className="border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none w-full md:w-64 bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && fetchSafety(location)}
                            />
                            <button
                                onClick={() => {
                                    setSubmitting(true);
                                    fetchSafety(location);
                                }}
                                className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-all"
                            >
                                <Search size={20} />
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="animate-spin text-blue-600" size={48} />
                        </div>
                    ) : assessment ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                                <RiskLevelCard
                                    level={assessment.risk?.level || "Unknown"}
                                    score={assessment.risk?.score || 0}
                                    maxScore={100}
                                    description={assessment.risk?.reason || assessment.advice}
                                />

                                <div className="bg-blue-50/50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-800/50 flex flex-col justify-between">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase">EMERGENCY NUMBER</h3>
                                        <div className="text-blue-500 dark:text-blue-400">
                                            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-4xl font-bold text-slate-900 dark:text-white mb-1">
                                            {assessment.emergency?.primary?.number || "112"}
                                        </div>
                                        <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                                            {assessment.emergency?.primary?.label || "Local Emergency"}
                                        </p>
                                    </div>
                                    {assessment.emergency?.primary?.callable && (
                                        <a
                                            href={assessment.emergency.primary.tel}
                                            className="mt-4 inline-block text-sm font-semibold text-blue-700 dark:text-blue-400 hover:underline"
                                        >
                                            Call now &rarr;
                                        </a>
                                    )}
                                </div>

                                <ActiveAlertsCard
                                    count={assessment.alerts?.length || 0}
                                    recentCount={assessment.news?.filter(n => n.severity === "High").length || 0}
                                    description="Active safety alerts & high severity news."
                                />
                            </div>

                            {/* News Section */}
                            {assessment.news && assessment.news.length > 0 && (
                                <div className="mb-10">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Bell size={20} className="text-blue-600 dark:text-blue-400" />
                                        Real-time Local Alerts
                                    </h3>
                                    <div className="flex flex-col gap-3">
                                        {assessment.news.map((item, idx) => {
                                            // Severity Badge Color
                                            let badgeColor = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
                                            if (item.severity === "Medium") badgeColor = "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
                                            if (item.severity === "High") badgeColor = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";

                                            return (
                                                <div
                                                    key={idx}
                                                    className="bg-white/50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:shadow-md transition-all flex items-start gap-4"
                                                >
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${badgeColor}`}>
                                                        {item.severity === "High" ? (
                                                            <Bell size={18} />
                                                        ) : (
                                                            <div className="font-bold text-xs">{item.severity ? item.severity[0] : 'N'}</div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start">
                                                            <h4 className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-1">
                                                                {item.title}
                                                            </h4>
                                                            <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap ml-2">
                                                                {item.published || item.published_at}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center mt-1">
                                                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{item.source}</span>
                                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
                                                                {item.severity} Risk
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <AlertList alerts={assessment.alerts || []} />

                            <div className="mt-10 bg-blue-50/50 dark:bg-blue-900/10 rounded-3xl p-8 border border-blue-100/50 dark:border-blue-800/30">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-xl flex items-center justify-center text-white">
                                        <span className="font-bold">AI</span>
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Journey360 AI Insight</h3>
                                </div>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl italic">
                                    {assessment.ai_insight || assessment.description || assessment.advice}
                                </p>
                            </div>
                        </>
                    ) : (
                        error ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <div className="bg-red-50 dark:bg-red-900/20 w-20 h-20 rounded-full flex items-center justify-center mb-6">
                                    <ShieldAlert size={40} className="text-red-500 dark:text-red-400" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Safety System Offline</h3>
                                <p className="text-red-500 dark:text-red-400 max-w-md mx-auto mb-8 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30 font-mono text-sm text-wrap break-words">
                                    {error}
                                </p>
                                <div className="flex gap-2">
                                    <button onClick={() => fetchSafety(location)} className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition-colors">
                                        Retry Connection
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <div className="bg-blue-50 dark:bg-blue-900/20 w-20 h-20 rounded-full flex items-center justify-center mb-6">
                                    <ShieldAlert size={40} className="text-blue-500 dark:text-blue-400" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Safety Intelligence Grid</h3>
                                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
                                    Enter a city to activate real-time threat monitoring and safety assessments.
                                </p>
                                <div className="flex gap-2">
                                    <button onClick={() => setLocation("Paris, France")} className="text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-2 rounded-full transition-colors text-slate-600 dark:text-slate-300">
                                        Trial: Paris
                                    </button>
                                    <button onClick={() => setLocation("New York, USA")} className="text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-4 py-2 rounded-full transition-colors text-slate-600 dark:text-slate-300">
                                        Trial: New York
                                    </button>
                                </div>
                            </div>
                        )
                    )}

                </main>
            </div>
        </AppLayout>
    );
};

export default SafetyPage;