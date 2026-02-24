import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ArrowDownUp, Clock, Calendar, X, Train, Bus, Plane, SlidersHorizontal, Loader2, MapPin, Navigation } from 'lucide-react';
import { transportService } from '../../services/transportService';

const TransportSearchPanel = ({ onSearch, onModeChange, activeModes, onLocationReady }) => {
    const [source, setSource] = useState('');
    const [destination, setDestination] = useState('');
    const [sourceSuggestions, setSourceSuggestions] = useState([]);
    const [destSuggestions, setDestSuggestions] = useState([]);
    const [selectedSource, setSelectedSource] = useState(null);
    const [selectedDest, setSelectedDest] = useState(null);
    const [scheduleMode, setScheduleMode] = useState('now');
    const [scheduledTime, setScheduledTime] = useState('');
    const [showSourceSuggestions, setShowSourceSuggestions] = useState(false);
    const [showDestSuggestions, setShowDestSuggestions] = useState(false);
    const [loadingSource, setLoadingSource] = useState(false);
    const [loadingDest, setLoadingDest] = useState(false);
    const [locationError, setLocationError] = useState(null);
    const sourceRef = useRef(null);
    const destRef = useRef(null);
    const sourceDebounce = useRef(null);
    const destDebounce = useRef(null);

    const modeOptions = [
        { id: 'train', icon: Train, label: 'Train', color: '#3B82F6' },
        { id: 'bus', icon: Bus, label: 'Bus', color: '#F97316' },
        { id: 'airport', icon: Plane, label: 'Airport', color: '#8B5CF6' },
    ];

    // Debounced async place search for source
    useEffect(() => {
        if (source.length >= 2 && !selectedSource) {
            setLoadingSource(true);
            clearTimeout(sourceDebounce.current);
            sourceDebounce.current = setTimeout(async () => {
                try {
                    const results = await transportService.searchPlaces(source);
                    setSourceSuggestions(results);
                    setShowSourceSuggestions(true);
                } catch {
                    setSourceSuggestions([]);
                }
                setLoadingSource(false);
            }, 300);
        } else {
            setSourceSuggestions([]);
            setShowSourceSuggestions(false);
            if (!loadingSource || selectedSource) setLoadingSource(false);
        }
        return () => clearTimeout(sourceDebounce.current);
    }, [source, selectedSource]);

    // Debounced async place search for destination
    useEffect(() => {
        if (destination.length >= 2 && !selectedDest) {
            setLoadingDest(true);
            clearTimeout(destDebounce.current);
            destDebounce.current = setTimeout(async () => {
                try {
                    const results = await transportService.searchPlaces(destination);
                    setDestSuggestions(results);
                    setShowDestSuggestions(true);
                } catch {
                    setDestSuggestions([]);
                }
                setLoadingDest(false);
            }, 300);
        } else {
            setDestSuggestions([]);
            setShowDestSuggestions(false);
            setLoadingDest(false);
        }
        return () => clearTimeout(destDebounce.current);
    }, [destination, selectedDest]);

    // Close suggestions on click outside
    useEffect(() => {
        const handler = (e) => {
            if (sourceRef.current && !sourceRef.current.contains(e.target)) setShowSourceSuggestions(false);
            if (destRef.current && !destRef.current.contains(e.target)) setShowDestSuggestions(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSelectSource = (stop) => {
        setSelectedSource(stop);
        setSource(stop.name);
        setShowSourceSuggestions(false);
        trySearch(stop, selectedDest);
    };

    const handleSelectDest = (stop) => {
        setSelectedDest(stop);
        setDestination(stop.name);
        setShowDestSuggestions(false);
        trySearch(selectedSource, stop);
    };

    const trySearch = (src, dst) => {
        if (src && dst && onSearch) {
            onSearch(src, dst);
        }
    };

    const handleSourceKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (sourceSuggestions.length > 0) {
                handleSelectSource(sourceSuggestions[0]);
            } else if (selectedSource && selectedDest) {
                trySearch(selectedSource, selectedDest);
            }
        }
    };

    const handleDestKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (destSuggestions.length > 0) {
                handleSelectDest(destSuggestions[0]);
            } else if (selectedSource && selectedDest) {
                trySearch(selectedSource, selectedDest);
            }
        }
    };

    const handleSwap = () => {
        const tmpSrc = selectedSource;
        const tmpSrcName = source;
        setSelectedSource(selectedDest);
        setSource(destination);
        setSelectedDest(tmpSrc);
        setDestination(tmpSrcName);
        if (selectedDest && tmpSrc) {
            onSearch(selectedDest, tmpSrc);
        }
    };

    const handleClearSource = () => {
        setSource('');
        setSelectedSource(null);
    };

    const handleClearDest = () => {
        setDestination('');
        setSelectedDest(null);
    };

    const handleUseCurrentLocation = () => {
        if ("geolocation" in navigator) {
            setLoadingSource(true);
            setLocationError(null);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const loc = {
                        id: 'current-location',
                        name: 'Current Location',
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                        type: 'place'
                    };
                    handleSelectSource(loc);
                    setLoadingSource(false);
                    if (onLocationReady) {
                        onLocationReady({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    }
                },
                (err) => {
                    setLocationError("Could not get location");
                    setLoadingSource(false);
                }
            );
        }
    };

    const toggleMode = (modeId) => {
        onModeChange(modeId);
    };

    const getStopIcon = (type) => {
        if (type === 'train') return '🚂';
        if (type === 'bus') return '🚌';
        if (type === 'airport') return '✈️';
        return '📍';
    };

    const renderSuggestion = (stop) => (
        <button
            key={stop.id}
            onClick={() => stop._isSource ? handleSelectSource(stop) : handleSelectDest(stop)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 text-left transition-colors border-b border-gray-100 dark:border-slate-700/50 last:border-b-0"
        >
            <span className="text-base">{getStopIcon(stop.type)}</span>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{stop.name}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
                    {stop.region || stop.type}
                </div>
            </div>
        </button>
    );

    return (
        <div className="space-y-5">
            {/* Location Error Banner */}
            {locationError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <Navigation size={14} className="text-amber-500 shrink-0" />
                    <span className="text-xs text-amber-700 dark:text-amber-400">{locationError}</span>
                    <button onClick={handleUseCurrentLocation} className="ml-auto text-xs font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 whitespace-nowrap">
                        Retry
                    </button>
                </div>
            )}

            {/* Transport Mode Filter */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <SlidersHorizontal size={14} className="text-gray-400 dark:text-gray-500" />
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Transport Mode</span>
                </div>
                <div className="flex gap-2">
                    {modeOptions.map(mode => {
                        const isActive = activeModes.includes(mode.id);
                        return (
                            <button
                                key={mode.id}
                                onClick={() => toggleMode(mode.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${isActive
                                    ? 'text-white shadow-lg scale-[1.02]'
                                    : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                                    }`}
                                style={isActive ? { backgroundColor: mode.color, borderColor: mode.color } : {}}
                            >
                                <mode.icon size={16} />
                                {mode.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Source / Destination Inputs */}
            <div className="relative">
                <div className="space-y-3">
                    {/* Source */}
                    <div ref={sourceRef} className="relative">
                        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 focus-within:border-emerald-500 dark:focus-within:border-emerald-500 transition-colors">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 shrink-0"></div>
                            <input
                                type="text"
                                value={source}
                                onChange={(e) => { setSource(e.target.value); setSelectedSource(null); }}
                                onKeyDown={handleSourceKeyDown}
                                placeholder="From — enter origin city"
                                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                            />
                            {loadingSource && <Loader2 size={14} className="text-emerald-500 animate-spin" />}
                            {!loadingSource && !source && (
                                <button
                                    onClick={handleUseCurrentLocation}
                                    className="flex items-center gap-1 text-emerald-500 hover:text-emerald-600 transition-colors"
                                >
                                    <MapPin size={14} />
                                </button>
                            )}
                            {source && !loadingSource && (
                                <button onClick={handleClearSource} className="text-gray-400 hover:text-gray-600">
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        {showSourceSuggestions && sourceSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                                {sourceSuggestions.map(stop => renderSuggestion({ ...stop, _isSource: true }))}
                            </div>
                        )}
                    </div>

                    {/* Swap */}
                    <div className="flex justify-center -my-1">
                        <button onClick={handleSwap} className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full hover:bg-emerald-50">
                            <ArrowDownUp size={16} />
                        </button>
                    </div>

                    {/* Destination */}
                    <div ref={destRef} className="relative">
                        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 focus-within:border-red-500 transition-colors">
                            <div className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-500/20 shrink-0"></div>
                            <input
                                type="text"
                                value={destination}
                                onChange={(e) => { setDestination(e.target.value); setSelectedDest(null); }}
                                onKeyDown={handleDestKeyDown}
                                placeholder="To — enter destination city"
                                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-white"
                            />
                            {loadingDest && <Loader2 size={14} className="text-red-500 animate-spin" />}
                            {destination && !loadingDest && (
                                <button onClick={handleClearDest} className="text-gray-400 hover:text-gray-600">
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        {showDestSuggestions && destSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                                {destSuggestions.map(stop => renderSuggestion({ ...stop, _isSource: false }))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Schedule Toggle */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setScheduleMode('now')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${scheduleMode === 'now' ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-800 text-gray-500'}`}
                >
                    <Clock size={14} />
                    Leave Now
                </button>
                <button
                    onClick={() => setScheduleMode('later')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${scheduleMode === 'later' ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-800 text-gray-500'}`}
                >
                    <Calendar size={14} />
                    Schedule Later
                </button>
                {scheduleMode === 'later' && (
                    <input
                        type="datetime-local"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="ml-2 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-500"
                    />
                )}
            </div>

            {/* Search Button */}
            <button
                onClick={async () => {
                    let src = selectedSource;
                    let dst = selectedDest;

                    // If suggestions exist but nothing selected, pick first one
                    if (!src && sourceSuggestions.length > 0) src = sourceSuggestions[0];
                    if (!dst && destSuggestions.length > 0) dst = destSuggestions[0];

                    // If still nothing but text exists, perform a "force geocode"
                    if ((!src && source.length >= 2) || (!dst && destination.length >= 2)) {
                        setLoadingSource(!src);
                        setLoadingDest(!dst);
                        try {
                            const [srcRes, dstRes] = await Promise.all([
                                !src ? transportService.searchPlaces(source) : Promise.resolve([src]),
                                !dst ? transportService.searchPlaces(destination) : Promise.resolve([dst])
                            ]);

                            if (srcRes.length > 0) src = srcRes[0];
                            if (dstRes.length > 0) dst = dstRes[0];
                        } catch (err) {
                            console.warn("Manual geocode failed", err);
                        }
                        setLoadingSource(false);
                        setLoadingDest(false);
                    }

                    if (src && dst) {
                        // Update the text and selection to reflect the geocoded results
                        if (!selectedSource) { setSource(src.name); setSelectedSource(src); }
                        if (!selectedDest) { setDestination(dst.name); setSelectedDest(dst); }
                        trySearch(src, dst);
                        setLocationError(null);
                    } else if (!source || !destination) {
                        setLocationError("Please enter both origin and destination");
                    } else {
                        setLocationError("Could not find these locations. Please select from suggestions.");
                    }
                }}
                disabled={!source || !destination || loadingSource || loadingDest}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all duration-200 active:scale-95 mt-2"
            >
                {(loadingSource || loadingDest) ? (
                    <Loader2 size={18} className="animate-spin" />
                ) : (
                    <Search size={18} />
                )}
                {(loadingSource || loadingDest) ? 'Locating...' : 'Search Routes'}
            </button>
        </div>
    );
};

export default TransportSearchPanel;
