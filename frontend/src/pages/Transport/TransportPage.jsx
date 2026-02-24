import React, { useState, useCallback, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import TransportSearchPanel from '../../components/transport/TransportSearchPanel';
import TransportItinerary from '../../components/transport/TransportItinerary';
import TransportMapView from '../../components/transport/TransportMapView';
import TransportSchedule from '../../components/transport/TransportSchedule';
import LiveSchedulePanel from '../../components/transport/LiveSchedulePanel';
import { transportService } from '../../services/transportService';
import { Download, QrCode, X, ChevronRight, Sparkles, ArrowRight, MapPin } from 'lucide-react';
import QRCode from 'react-qr-code';

const TransportPage = () => {
    const [activeModes, setActiveModes] = useState(['train', 'bus', 'airport']);
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [highlightedLeg, setHighlightedLeg] = useState(null);
    const [sourceStop, setSourceStop] = useState(null);
    const [destStop, setDestStop] = useState(null);
    const [showQRModal, setShowQRModal] = useState(false);
    const [ticketData, setTicketData] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [activeScheduleTab, setActiveScheduleTab] = useState('trains');

    // Handle Search Action
    const handleSearch = useCallback(async (src, dst) => {
        setSourceStop(src);
        setDestStop(dst);
        setIsSearching(true);

        try {
            // Pass names for live data matching
            const sName = src.city || src.name;
            const dName = dst.city || dst.name;
            const result = await transportService.generateRoute(src.lat, src.lng, dst.lat, dst.lng, activeModes, sName, dName);
            setRoutes(result);
            setSelectedRoute(result.length > 0 ? result[0] : null);
        } catch (err) {
            console.error('Route generation failed:', err);
            setRoutes([]);
            setSelectedRoute(null);
        }
        setIsSearching(false);
    }, [activeModes]);

    // Handle re-searching when modes change (via useEffect for stability)
    useEffect(() => {
        if (!sourceStop || !destStop) return;

        const reSearch = async () => {
            setIsSearching(true);
            try {
                const sName = sourceStop.city || sourceStop.name;
                const dName = destStop.city || destStop.name;
                const result = await transportService.generateRoute(
                    sourceStop.lat,
                    sourceStop.lng,
                    destStop.lat,
                    destStop.lng,
                    activeModes,
                    sName,
                    dName
                );
                setRoutes(result);
                // Keep same selection index if possible, else first
                setSelectedRoute(prev => {
                    if (!prev || result.length === 0) return result[0] || null;
                    return result.find(r => r.name === prev.name) || result[0];
                });
            } catch (err) {
                console.error('Route re-generation failed:', err);
            }
            setIsSearching(false);
        };

        reSearch();
    }, [activeModes, sourceStop, destStop]);

    const handleModeChange = useCallback((modeId) => {
        setActiveModes(prev => {
            const isActive = prev.includes(modeId);
            if (isActive && prev.length === 1) return prev;
            return isActive ? prev.filter(m => m !== modeId) : [...prev, modeId];
        });
    }, []);

    const handleGenerateQR = () => {
        if (!selectedRoute) return;
        const ticket = transportService.generateTicketData(selectedRoute);
        setTicketData(ticket);
        setShowQRModal(true);
    };

    const handleDownload = () => {
        if (!selectedRoute) return;
        transportService.downloadItinerary(
            selectedRoute,
            sourceStop?.name || 'Origin',
            destStop?.name || 'Destination'
        );
    };

    const handleLegClick = useCallback((leg) => {
        setHighlightedLeg(leg);
        if (leg.mode === 'train') setActiveScheduleTab('trains');
        if (leg.mode === 'airport') setActiveScheduleTab('flights');
        if (leg.mode === 'bus') setActiveScheduleTab('buses');

        const panel = document.getElementById('live-schedule-panel');
        if (panel) panel.scrollIntoView({ behavior: 'smooth' });
    }, []);

    return (
        <AppLayout>
            <div className="h-full flex flex-col lg:flex-row overflow-hidden">
                {/* ═══ Left Panel — Search, Itinerary, Schedule ═══ */}
                <div className="w-full lg:w-[440px] xl:w-[480px] flex flex-col border-r border-gray-200/50 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/30 shrink-0 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 pt-6 pb-4 border-b border-gray-200/50 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <MapPin size={20} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Transport Planner</h1>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Multi-modal route planning</p>
                            </div>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="p-6 space-y-6">
                            {/* Search Panel */}
                            <TransportSearchPanel
                                onSearch={handleSearch}
                                onModeChange={handleModeChange}
                                activeModes={activeModes}
                                onLocationReady={setUserLocation}
                            />

                            {/* Loading State */}
                            {isSearching && (
                                <div className="flex items-center justify-center py-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Finding best routes...</span>
                                    </div>
                                </div>
                            )}

                            {/* Route Options (when multiple) */}
                            {routes.length > 1 && !isSearching && (
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Sparkles size={12} className="text-emerald-500" />
                                        AI Recommended Routes
                                    </h3>
                                    <div className="space-y-2">
                                        {routes.map(route => (
                                            <button
                                                key={route.id}
                                                onClick={() => setSelectedRoute(route)}
                                                className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 ${selectedRoute?.id === route.id
                                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 shadow-sm'
                                                    : 'bg-white dark:bg-slate-800/50 border-gray-100 dark:border-slate-700/50 hover:border-gray-200 dark:hover:border-slate-600'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-gray-900 dark:text-white">{route.name}</span>
                                                        {route.tags?.map((tag, i) => (
                                                            <span key={i} className="text-[9px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <ChevronRight size={14} className="text-gray-400" />
                                                </div>
                                                <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                    <span>⏱ {route.totalDuration} min</span>
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">₹{route.totalFare}</span>
                                                    <span>🚶 {route.totalWalkM}m</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Itinerary Timeline */}
                            {selectedRoute && !isSearching && (
                                <>
                                    <div className="border-t border-gray-200/50 dark:border-slate-800 pt-6">
                                        <TransportItinerary
                                            route={selectedRoute}
                                            onLegHover={setHighlightedLeg}
                                            onLegClick={handleLegClick}
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleGenerateQR}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:scale-[1.02]"
                                        >
                                            <QrCode size={16} />
                                            QR Ticket
                                        </button>
                                        <button
                                            onClick={handleDownload}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-xl text-sm font-bold transition-all duration-200"
                                        >
                                            <Download size={16} />
                                            Download
                                        </button>
                                    </div>

                                    {/* Schedule */}
                                    <div className="border-t border-gray-200/50 dark:border-slate-800 pt-6">
                                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Schedule & Alerts</h3>
                                        <TransportSchedule route={selectedRoute} />
                                    </div>

                                    {/* Live Transport Schedules */}
                                    {sourceStop && destStop && (
                                        <div id="live-schedule-panel" className="border-t border-gray-200/50 dark:border-slate-800 pt-6">
                                            <LiveSchedulePanel
                                                sourceName={sourceStop.name || sourceStop.city || 'Origin'}
                                                destName={destStop.name || destStop.city || 'Destination'}
                                                initialTab={activeScheduleTab}
                                            />
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Empty State */}
                            {routes.length === 0 && !isSearching && (
                                <div className="text-center py-10">
                                    <div className="text-4xl mb-4">🚆</div>
                                    <h3 className="text-base font-bold text-gray-700 dark:text-gray-300 mb-1">Plan your journey</h3>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 max-w-[240px] mx-auto">
                                        Enter a source and destination above to discover the best multi-modal routes
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ═══ Right Panel — Map ═══ */}
                <div className="flex-1 relative min-h-[300px] lg:min-h-0">
                    <TransportMapView
                        route={selectedRoute}
                        highlightedLeg={highlightedLeg}
                        userLocation={userLocation}
                        className="w-full h-full"
                    />
                </div>
            </div>

            {/* ═══ QR Ticket Modal ═══ */}
            {showQRModal && ticketData && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fadeIn">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <QrCode size={18} className="text-emerald-600" />
                                <h3 className="font-bold text-gray-900 dark:text-white">Digital Ticket</h3>
                            </div>
                            <button onClick={() => setShowQRModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <X size={18} className="text-gray-400" />
                            </button>
                        </div>

                        {/* Ticket Content */}
                        <div className="p-6 text-center space-y-5">
                            {/* QR Code */}
                            <div className="bg-white p-4 rounded-xl inline-block shadow-inner">
                                <QRCode
                                    value={ticketData.qrPayload}
                                    size={180}
                                    level="H"
                                    bgColor="#ffffff"
                                    fgColor="#0f172a"
                                />
                            </div>

                            {/* Ticket Info */}
                            <div className="space-y-3">
                                <div className="text-center">
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Ticket ID</p>
                                    <p className="text-sm font-mono font-bold text-gray-900 dark:text-white">{ticketData.ticketId}</p>
                                </div>
                                <div className="flex justify-between text-xs px-4">
                                    <div>
                                        <p className="text-gray-400 dark:text-gray-500">Route</p>
                                        <p className="font-bold text-gray-800 dark:text-gray-200">{ticketData.routeName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-gray-400 dark:text-gray-500">Fare</p>
                                        <p className="font-bold text-emerald-600 dark:text-emerald-400">₹{ticketData.totalFare}</p>
                                    </div>
                                </div>

                                {/* Route Steps Mini */}
                                <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-3 space-y-1 text-left">
                                    {ticketData.legs.map((leg, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs">
                                            <span>{leg.mode === 'Walk' ? '🚶' : leg.mode === 'Train' ? '🚂' : leg.mode === 'Bus' ? '🚌' : '✈️'}</span>
                                            <span className="text-gray-600 dark:text-gray-300 truncate">{leg.from}</span>
                                            <ArrowRight size={10} className="text-gray-400 shrink-0" />
                                            <span className="text-gray-600 dark:text-gray-300 truncate">{leg.to}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Status */}
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">{ticketData.status}</span>
                                </div>

                                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                    Valid until {new Date(ticketData.validUntil).toLocaleString('en-IN')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
};

export default TransportPage;
