import React, { useState, useEffect, useRef } from 'react';
import {
    Search, MapPin, Calendar, MoreHorizontal, Plus, Minus,
    Utensils, Flag, Star, Clock, Info, ChevronRight,
    Shield, Share, Save, Loader2, Navigation, ExternalLink, Map as MapIcon, Sparkles, X
} from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { auth } from '../../services/firebase';
import { apiService } from '../../services/apiService';
import AppLayout from '../../components/layout/AppLayout';
import Skeleton, { ItinerarySkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import ARViewer from '../../components/navigation/ARViewer';
import MobilePreviewModal from '../../components/navigation/MobilePreviewModal';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import CostChart from '../../components/itinerary/CostChart';
import { toast } from 'sonner';

// Fix for default marker icon in Leaflet - Use CDNs for maximum reliability in Vite
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Sub-component to handle map centering and rendering fixes
const ForceResize = ({ center, zoom }) => {
    const map = useMap();

    useEffect(() => {
        const refresh = () => {
            map.invalidateSize();
            if (center) map.setView(center, zoom);
        };
        refresh();
    }, [center, zoom, map]);

    return null;
};

// Component to frame all markers for the current day
const FocusView = ({ dayPlaces }) => {
    const map = useMap();

    const handleFocus = () => {
        const coords = dayPlaces
            .filter(p => p.lat && p.lng)
            .map(p => [parseFloat(p.lat), parseFloat(p.lng)]);

        if (coords.length > 0) {
            const bounds = L.latLngBounds(coords);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
    };

    return (
        <button
            onClick={handleFocus}
            className="absolute bottom-6 right-6 z-[1000] bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 hover:scale-110 active:scale-95 transition-all text-emerald-600 dark:text-emerald-400 group"
            title="Focus Day Route"
        >
            <MapIcon size={24} className="group-hover:rotate-12 transition-transform" />
        </button>
    );
};

// Custom Modal for AI Regeneration Instructions
const RegenModal = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
    const [instruction, setInstruction] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                            <Sparkles className="text-emerald-600 dark:text-emerald-400" size={20} />
                        </div>
                        <h3 className="text-lg font-bold">Refine Itinerary</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Tell AI how you want to change your plan. E.g., "Add more beaches" or "I want to visit a museum today".
                    </p>
                    <textarea
                        autoFocus
                        value={instruction}
                        onChange={(e) => setInstruction(e.target.value)}
                        placeholder="Type your instructions here..."
                        className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none text-sm"
                    />
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-950/50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSubmit(instruction)}
                        disabled={!instruction.trim() || isSubmitting}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                        Update Itinerary
                    </button>
                </div>
            </div>
        </div>
    );
};

// Component to automatically open popup when position/label changes
const AutoPopupMarker = ({ position, label, bookingUrl, timestamp, onLaunchAR }) => {
    const markerRef = useRef(null);
    useEffect(() => {
        if (markerRef.current) {
            markerRef.current.openPopup();
        }
    }, [position, label, timestamp]);

    return (
        <Marker position={position} ref={markerRef}>
            <Popup>
                <div className="p-1 min-w-[150px]">
                    <h4 className="font-bold text-sm mb-1">{label}</h4>
                    <div className="flex flex-col gap-2">
                        {bookingUrl && (
                            <a
                                href={bookingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                            >
                                <ExternalLink size={10} />
                                Book Now
                            </a>
                        )}
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // AutoPopupMarker doesn't have ar_model_url context, keep enabled for located items
                                    onLaunchAR && onLaunchAR({ name: label, lat: position[0], lng: position[1] });
                                }}
                                className="flex-1 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5 hover:bg-emerald-700 transition-colors"
                            >
                                <Sparkles size={10} />
                                Launch AR
                            </button>
                        </div>
                    </div>
                </div>
            </Popup>
        </Marker>
    );
};

// Currency Conversion Helper
const EXCHANGE_RATES = {
    'INR': { 'USD': 0.012, 'EUR': 0.011, 'INR': 1 },
    'USD': { 'INR': 83.5, 'EUR': 0.92, 'USD': 1 },
    'EUR': { 'INR': 90.5, 'USD': 1.09, 'EUR': 1 }
};

const getCurrencySymbol = (code) => {
    switch (code) {
        case 'USD': return '$';
        case 'EUR': return '€';
        case 'INR': return '₹';
        default: return code;
    }
};

const PriceDisplay = ({ amount, sourceCode = 'INR', targetCode = 'INR', className }) => {
    // 1. Clean the amount string/number
    let numericVal = 0;
    if (typeof amount === 'number') {
        numericVal = amount;
    } else if (typeof amount === 'string') {
        // Remove known symbols and commas
        const clean = amount.replace(/[₹$€,]/g, '').trim();
        numericVal = parseFloat(clean) || 0;
    }

    // 2. Identify Source Code (if symbol passed in amount overrides prop)
    // Actually, we rely on sourceCode prop usually being the global itinerary currency code

    // 3. Convert
    // Default to 1:1 if rate unknown
    const rates = EXCHANGE_RATES[sourceCode] || {};
    const rate = rates[targetCode] || 1;

    // If source and target same, just format
    if (sourceCode === targetCode && rate === 1) {
        // keep original if possible or reformat? Reformat ensures consistency
    }

    const converted = numericVal * rate;
    // Check if result is valid
    if (isNaN(converted)) {
        return <span className={className}>{amount}</span>;
    }

    const finalVal = Math.round(converted).toLocaleString();
    const symbol = getCurrencySymbol(targetCode);

    return (
        <span className={className}>
            <span className="font-sans">{symbol}</span>
            <span>{finalVal}</span>
        </span>
    );
};

// ─── Distance Helpers ───────────────────────────────────────────────────────
/** Haversine straight-line distance in km between two lat/lng pairs */
function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Nearest-Neighbor TSP: reorders non-hotel stops to minimize total travel distance.
 *  Hotels always stay at the front of the list. */
function optimizePlaceOrder(places) {
    const hotels = places.filter(p => p.category?.toLowerCase() === 'hotel');
    const stops = places.filter(p => p.category?.toLowerCase() !== 'hotel' && p.lat && p.lng);
    if (stops.length < 2) return places;

    const visited = new Array(stops.length).fill(false);
    const route = [0];
    visited[0] = true;

    for (let i = 1; i < stops.length; i++) {
        const last = route[route.length - 1];
        let nearest = -1, nearestDist = Infinity;
        for (let j = 0; j < stops.length; j++) {
            if (!visited[j]) {
                const d = haversineKm(
                    parseFloat(stops[last].lat), parseFloat(stops[last].lng),
                    parseFloat(stops[j].lat), parseFloat(stops[j].lng)
                );
                if (d < nearestDist) { nearestDist = d; nearest = j; }
            }
        }
        if (nearest !== -1) { visited[nearest] = true; route.push(nearest); }
    }
    return [...hotels, ...route.map(i => stops[i])];
}
// ────────────────────────────────────────────────────────────────────────────

const TimelineEvent = ({
    event, index, total, onLocate, onLaunchAR, sourceCurrencyCode,
    targetCurrencyCode, isSaved, onToggleSave, launchingPlace,
    onDragStart, onDragOver, onDrop, onDragEnd, draggable = true
}) => {
    const isHotel = event.category?.toLowerCase() === 'hotel';

    return (
        <div
            className="flex gap-6 relative group"
            draggable={draggable && !isHotel}
            onDragStart={(e) => onDragStart && onDragStart(e, index)}
            onDragOver={(e) => onDragOver && onDragOver(e, index)}
            onDrop={(e) => onDrop && onDrop(e, index)}
            onDragEnd={(e) => onDragEnd && onDragEnd(e)}
        >
            {/* Connector Line */}
            {index !== total - 1 && (
                <div className="absolute left-[19px] top-10 bottom-[-24px] w-0.5 bg-slate-200 group-hover:bg-emerald-100 transition-colors"></div>
            )}

            {/* Number Badge */}
            <div className="relative z-10">
                <div className={`w-10 h-10 rounded-full font-bold flex items-center justify-center text-sm border-2 border-white shadow-sm transition-all duration-300 ${isHotel ? 'bg-teal-600 text-white' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'
                    }`}>
                    {isHotel ? '🏨' : index + 1}
                </div>
            </div>

            {/* Content Card */}
            <div className="flex-1 pb-8">
                <div
                    onClick={() => onLocate && onLocate(event)}
                    className={`p-5 rounded-3xl border transition-all duration-300 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] group/card ${isHotel
                        ? 'bg-teal-50/30 dark:bg-teal-900/20 border-teal-100 dark:border-teal-800/50 hover:border-teal-300 dark:hover:border-teal-600'
                        : 'bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border-slate-100 dark:border-slate-700/50 hover:border-emerald-200 dark:hover:border-emerald-500/50'
                        }`}>
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{event.timeSlot}</span>
                        <div className="flex gap-2">
                            {event.category && (
                                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md ${isHotel ? 'bg-teal-600 text-white' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                    }`}>
                                    {event.category}
                                </span>
                            )}
                        </div>
                    </div>

                    <h3 className={`text-lg font-bold mb-2 transition-colors ${isHotel ? 'text-teal-900 dark:text-teal-100 group-hover:text-teal-600 dark:group-hover:text-teal-400' : 'text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                        }`}>
                        {event.name}
                    </h3>

                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-3">
                        {event.description || "Explore this amazing location suggested by AI."}
                    </p>

                    {/* Photo Gallery (Mini) */}
                    {event.imageUrl && (
                        <div className="mb-4 rounded-2xl overflow-hidden h-32 w-full border border-slate-100 dark:border-slate-700">
                            <img
                                src={event.imageUrl}
                                alt={event.name}
                                className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                            />
                        </div>
                    )}

                    {/* Rating & Reviews */}
                    {event.rating && (
                        <div className="flex items-center gap-2 mb-4">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{event.rating}</span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                                ({(event.userRatingCount || 0).toLocaleString()} reviews)
                            </span>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs font-medium text-slate-400 dark:text-slate-500">
                            {event.estimatedCost !== undefined && (
                                <div className="flex items-center gap-1.5">
                                    <PriceDisplay
                                        amount={event.estimatedCost}
                                        sourceCode={sourceCurrencyCode}
                                        targetCode={targetCurrencyCode}
                                    />
                                </div>
                            )}
                            {event.duration && !isHotel && (
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{event.duration}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleSave && onToggleSave(event);
                                }}
                                className={`p-1.5 rounded-lg border shadow-sm transition-all flex items-center justify-center ${isSaved
                                    ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/50 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                                    : 'bg-white dark:bg-slate-800/80 border-slate-100 dark:border-slate-700/50 text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-100 dark:hover:border-rose-900/50'
                                    }`}
                                title={isSaved ? "Remove from Saved" : "Save Place"}
                            >
                                <Save size={14} className={isSaved ? "fill-current" : ""} />
                            </button>

                            {isHotel ? (
                                <>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const url = event.bookingUrl || `https://www.google.com/search?q=${encodeURIComponent(event.name + ' booking')}`;
                                            window.open(url, '_blank');
                                        }}
                                        className="text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 px-3 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                                    >
                                        <ExternalLink size={12} />
                                        Book Now
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onLocate && onLocate(event);
                                        }}
                                        className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-white dark:bg-slate-800 border border-teal-100 dark:border-teal-900/50 px-3 py-1.5 rounded-lg shadow-sm hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all flex items-center gap-1.5"
                                    >
                                        <MapIcon size={12} />
                                        Locate
                                    </button>
                                </>
                            ) : (
                                (() => {
                                    const hasCoords = !!(event.lat && event.lng);
                                    const isLaunching = launchingPlace === (event.name || event.label);
                                    return (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (hasCoords && !isLaunching) onLaunchAR && onLaunchAR(event);
                                            }}
                                            disabled={!hasCoords || isLaunching}
                                            title={hasCoords ? 'Launch AR Navigation to this place' : 'No coordinates available for AR'}
                                            className={`relative flex-1 py-2.5 px-4 text-xs font-semibold tracking-wide rounded-xl flex items-center justify-center gap-2 transition-all duration-300 overflow-hidden select-none ${isLaunching
                                                ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-white scale-95 shadow-inner cursor-wait'
                                                : hasCoords
                                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-md shadow-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/40 hover:scale-[1.04] active:scale-95 cursor-pointer'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                                                }`}
                                        >
                                            {/* Shimmer overlay on hover */}
                                            {hasCoords && !isLaunching && (
                                                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 rounded-xl" />
                                            )}
                                            <Sparkles
                                                size={14}
                                                className={`transition-all duration-300 ${isLaunching ? 'animate-spin' : hasCoords ? 'animate-pulse' : ''}`}
                                            />
                                            <span className="ml-1 uppercase tracking-widest">
                                                {isLaunching ? 'Launching' : 'AR Launch'}
                                            </span>
                                        </button>
                                    );
                                })()
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ItineraryPage = () => {
    const { theme } = useTheme();
    const [searchParams] = useSearchParams();
    const tripId = searchParams.get('trip_id');
    const [itinerary, setItinerary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeDay, setActiveDay] = useState(1);
    const [activeView, setActiveView] = useState('timeline'); // 'timeline' | 'calendar' | 'budget'
    const [regenerating, setRegenerating] = useState(false);
    const [mapMarker, setMapMarker] = useState(null);
    const [mapCenter, setMapCenter] = useState([20, 0]);
    const [mapZoom, setMapZoom] = useState(2);
    const [showHotels, setShowHotels] = useState(true);
    const [optimizedDays, setOptimizedDays] = useState(null); // null = original AI order

    // AR State
    const [activeAR, setActiveAR] = useState(null);          // Full screen AR
    const [previewAR, setPreviewAR] = useState(null);        // Mobile Preview Modal
    const [launchingPlace, setLaunchingPlace] = useState(null); // Brief visual before modal opens
    const [isRegenModalOpen, setIsRegenModalOpen] = useState(false);

    // User Preference State
    const [targetCurrency, setTargetCurrency] = useState('INR');

    // Saved Places State
    const [savedPlacesMap, setSavedPlacesMap] = useState(new Map()); // Name -> ID

    useEffect(() => {
        const fetchSavedPlaces = async () => {
            if (!auth.currentUser) return;
            try {
                const savedList = await apiService.getSavedPlaces(auth);
                const map = new Map(savedList.map(p => [p.name, p.placeId]));
                setSavedPlacesMap(map);
            } catch (err) {
                console.warn("Failed to sync saved places:", err);
            }
        };
        fetchSavedPlaces();
    }, [auth.currentUser]);

    const handleToggleSave = async (place) => {
        if (!auth.currentUser) {
            alert("Please login to save places.");
            return;
        }

        const isSaved = savedPlacesMap.has(place.name);

        try {
            if (isSaved) {
                // Remove
                const placeId = savedPlacesMap.get(place.name);
                await apiService.removeSavedPlace(auth, placeId);
                const newMap = new Map(savedPlacesMap);
                newMap.delete(place.name);
                setSavedPlacesMap(newMap);
            } else {
                // Save
                // Generate a stable-ish ID or random? Random is fine as we map by Name locally for now.
                // Ideally backend handles uniqueness, but we need ID for deletes.
                const newPlaceId = crypto.randomUUID();
                const payload = {
                    placeId: newPlaceId,
                    name: place.name,
                    category: place.category || "Attraction", // Fallback
                    lat: place.lat ? parseFloat(place.lat) : null,
                    lng: place.lng ? parseFloat(place.lng) : null,
                    address: place.address || itinerary.destination, // Context
                    notes: place.description || "Saved from Itinerary",
                    image: null
                };

                await apiService.savePlace(auth, payload);
                const newMap = new Map(savedPlacesMap);
                newMap.set(place.name, newPlaceId);
                setSavedPlacesMap(newMap);
            }
        } catch (err) {
            console.error("Save action failed:", err);
            alert("Failed to update saved places");
        }
    };

    useEffect(() => {
        console.log("DEBUG: ItineraryPage mounted/updated. TripID:", tripId);

        const fetchItineraryAndPrefs = async () => {
            console.log("DEBUG: fetchItineraryAndPrefs called.");
            if (!tripId) {
                console.log("DEBUG: No tripId, aborting.");
                return;
            }
            try {
                if (auth.currentUser) {
                    console.log("DEBUG: User authenticated, calling private API...", tripId);
                    const data = await apiService.getItinerary(auth, tripId);
                    console.log("DEBUG: Itinerary fetched:", data);
                    setItinerary(data);
                } else {
                    console.log("DEBUG: Waiting for auth...");
                    return;
                }

                // 2. Fetch User Prefs (Only if logged in)
                if (auth.currentUser) {
                    try {
                        const profile = await apiService.getProfile(auth);
                        if (profile.preferences?.currency) {
                            setTargetCurrency(profile.preferences.currency);
                        }
                    } catch (err) {
                        console.warn("Failed to fetch user prefs:", err);
                    }
                }
            } catch (error) {
                console.error("Fetch Error:", error);
                // Don't alert "Failed" too aggressively if it's just an auth delay, 
                // but here we are explicit.
            } finally {
                console.log("DEBUG: Setting loading to false.");
                setLoading(false);
            }
        };

        // Try immediately (for public access) or wait for auth
        // We set a small timeout to let Auth initialize if it's going to
        const timer = setTimeout(() => {
            fetchItineraryAndPrefs();
        }, 500);

        const unsub = auth.onAuthStateChanged(user => {
            // If user logs in *while* viewing, refresh to get private capabilities if needed
            if (user) {
                console.log("DEBUG: Auth detected, refreshing...");
                fetchItineraryAndPrefs();
            }
        });

        return () => {
            clearTimeout(timer);
            unsub();
        };
    }, [tripId]);

    // Auto-center map when day changes
    useEffect(() => {
        if (itinerary && itinerary.days) {
            const dayData = itinerary.days.find(d => d.dayNumber === activeDay) || itinerary.days[0];
            if (dayData && dayData.places && dayData.places.length > 0) {
                const firstPlace = dayData.places.find(p => p.lat && p.lng);
                if (firstPlace) {
                    setMapCenter([parseFloat(firstPlace.lat), parseFloat(firstPlace.lng)]);
                    setMapZoom(13);
                }
            }
        }
    }, [activeDay, itinerary]);

    const handleLocate = (place) => {
        if (place.lat && place.lng) {
            const lat = parseFloat(place.lat);
            const lng = parseFloat(place.lng);
            setMapMarker({
                lat: lat,
                lng: lng,
                label: place.name,
                bookingUrl: place.bookingUrl || place.link,
                timestamp: Date.now()
            });
            setMapCenter([lat, lng]);
            setMapZoom(17);
        } else {
            if (itinerary.topHotels?.[0]?.lat) {
                setMapCenter([itinerary.topHotels[0].lat, itinerary.topHotels[0].lng]);
                setMapZoom(13);
            }
        }
    };

    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            toast.success('Itinerary link copied to clipboard!');
        }).catch(err => {
            toast.error('Failed to copy link');
        });
    };

    // Drag and Drop Logic
    const [draggedItemIndex, setDraggedItemIndex] = useState(null);

    const handleDragStart = (e, index) => {
        setDraggedItemIndex(index);
        e.dataTransfer.effectAllowed = "move";
        // Visual ghosting for better UX
        e.target.style.opacity = "0.5";
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
    };

    const handleDrop = (e, index) => {
        e.preventDefault();
        if (draggedItemIndex === null || draggedItemIndex === index) return;

        const newItinerary = { ...itinerary };
        const dayIdx = newItinerary.days.findIndex(d => d.dayNumber === activeDay);
        if (dayIdx === -1) return;

        const dayPlaces = [...newItinerary.days[dayIdx].places];
        const [movedItem] = dayPlaces.splice(draggedItemIndex, 1);
        dayPlaces.splice(index, 0, movedItem);

        newItinerary.days[dayIdx].places = dayPlaces;
        setItinerary(newItinerary);
        setDraggedItemIndex(null);
        toast.info('Plan rearranged!');
    };

    const handleDragEnd = (e) => {
        e.target.style.opacity = "1";
    };

    const handleLaunchAR = (place) => {
        if (place.lat && place.lng) {
            // Brief launching animation before opening the modal
            setLaunchingPlace(place.name || place.label);
            setTimeout(() => {
                setLaunchingPlace(null);
                setPreviewAR({
                    name: place.name || place.label,
                    lat: parseFloat(place.lat),
                    lng: parseFloat(place.lng)
                });
            }, 380);
        } else {
            alert("This location does not have coordinates for AR navigation.");
        }
    };

    const handleRegenerate = async (instruction) => {
        if (!instruction) return;

        setRegenerating(true);
        setIsRegenModalOpen(false);
        try {
            const res = await apiService.regenerateItinerary(auth, tripId, instruction);
            setItinerary(res.updatedItinerary);
            setOptimizedDays(null); // Reset optimization when itinerary changes
        } catch (error) {
            alert("Regeneration failed: " + error.message);
        } finally {
            setRegenerating(false);
        }
    };

    /** Toggle route optimization: reorder places per day by Nearest-Neighbor TSP. */
    const handleOptimize = () => {
        if (optimizedDays) {
            setOptimizedDays(null); // restore original
            return;
        }
        const reordered = itinerary.days.map(day => ({
            ...day,
            places: optimizePlaceOrder(day.places)
        }));
        setOptimizedDays(reordered);
    };

    /** Total straight-line route distance for a day's places (km). */
    const getDayTotalKm = (places) => {
        let total = 0;
        for (let i = 0; i < places.length - 1; i++) {
            const a = places[i], b = places[i + 1];
            if (a.lat && a.lng && b.lat && b.lng)
                total += haversineKm(parseFloat(a.lat), parseFloat(a.lng),
                    parseFloat(b.lat), parseFloat(b.lng));
        }
        return total;
    };

    if (loading) return (
        <AppLayout>
            <ItinerarySkeleton />
        </AppLayout>
    );

    if (!itinerary) return (
        <AppLayout>
            <div className="max-w-4xl mx-auto py-20 px-6">
                <div className="bg-white/20 dark:bg-slate-900/20 backdrop-blur-sm rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                    <EmptyState
                        variant="itinerary"
                        onAction={() => setIsRegenModalOpen(true)}
                    />
                </div>
            </div>
        </AppLayout>
    );

    const sourceDays = optimizedDays || itinerary.days;
    const currentDayData = sourceDays.find(d => d.dayNumber === activeDay) || sourceDays[0];

    // Determine Source Currency from Itinerary (Default to INR if missing)
    const sourceCurrencyCode = itinerary.currencyCode || 'INR';

    return (
        <AppLayout>
            <div className="bg-transparent font-sans text-slate-900 dark:text-slate-100 min-h-full">
                <main className="max-w-[1600px] mx-auto p-6 md:p-8">
                    {/* Breadcrumbs */}
                    <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
                        <Link to="/dashboard" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Home</Link>
                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700" />
                        <span className="text-slate-900 dark:text-slate-100 font-medium">{itinerary.destination}</span>
                    </nav>

                    {/* Title Section */}
                    <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight mb-2">{itinerary.destination} Adventure</h1>
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <Shield className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                    AI Generated Optimized Route •
                                    <PriceDisplay amount={itinerary.budget} sourceCode={sourceCurrencyCode} targetCode={targetCurrency} />
                                    Budget
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-4 overflow-x-auto pb-2 xl:pb-0">
                            {[
                                { label: "TOTAL COST", value: itinerary.costSummary.total },
                                { label: "FOOD", value: itinerary.costSummary.food },
                                { label: "STAY", value: itinerary.costSummary.stay }
                            ].map((stat, idx) => (
                                <div key={idx} className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm min-w-[130px]">
                                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{stat.label}</div>
                                    <div className="text-xl font-bold text-slate-900 dark:text-slate-50">
                                        <PriceDisplay amount={stat.value} sourceCode={sourceCurrencyCode} targetCode={targetCurrency} />
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={handleShare}
                                className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors whitespace-nowrap"
                            >
                                <Share size={18} />
                                Share
                            </button>

                            <button
                                onClick={() => setIsRegenModalOpen(true)}
                                disabled={regenerating}
                                className="flex items-center gap-2 px-6 py-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold rounded-xl border-2 border-emerald-100 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors whitespace-nowrap disabled:opacity-50"
                            >
                                {regenerating ? <Loader2 className="animate-spin" size={20} /> : <span className="text-lg">✨</span>}
                                {regenerating ? 'Updating...' : 'Regenerate with AI'}
                            </button>
                        </div>
                    </div>

                    {/* View Switcher */}
                    <div className="flex items-center gap-1 p-1 bg-slate-100/50 dark:bg-slate-800/30 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-2xl w-fit mb-8">
                        {['timeline', 'calendar', 'budget'].map(view => (
                            <button
                                key={view}
                                onClick={() => setActiveView(view)}
                                className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${activeView === view
                                    ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400 border border-slate-200/50 dark:border-slate-600'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                {view}
                            </button>
                        ))}
                    </div>

                    {activeView === 'timeline' && (
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-[calc(100vh-340px)] min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* Left: Itinerary List */}
                            <div className="xl:col-span-5 h-full overflow-hidden flex flex-col">
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Itinerary Details</h2>
                                    <button
                                        onClick={handleOptimize}
                                        title={optimizedDays ? 'Restore original AI order' : 'Reorder stops to minimize travel distance'}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${optimizedDays
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/30'
                                            : 'bg-white/80 dark:bg-slate-800/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                            }`}
                                    >
                                        <Navigation size={12} />
                                        {optimizedDays ? 'Optimized ✓' : 'Optimize Route'}
                                    </button>
                                </div>

                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar max-w-[260px] sm:max-w-[400px] lg:max-w-full pb-2">
                                        {itinerary.days.map(day => (
                                            <button
                                                key={day.dayNumber}
                                                onClick={() => setActiveDay(day.dayNumber)}
                                                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeDay === day.dayNumber
                                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                                                    : 'bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                    }`}
                                            >
                                                Day {day.dayNumber}
                                            </button>
                                        ))}
                                    </div>
                                    {/* Day total distance badge */}
                                    {(() => {
                                        const km = getDayTotalKm(currentDayData.places);
                                        return km > 0 ? (
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap">
                                                ~{km.toFixed(1)} km total
                                            </span>
                                        ) : null;
                                    })()}
                                </div>

                                <div className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm p-6 flex-1 overflow-y-auto custom-scrollbar">
                                    <div className="mb-6">
                                        <div className="flex items-center gap-3 mb-1.5">
                                            <Calendar className="w-4 h-4 text-emerald-500" />
                                            <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">{currentDayData.date || `Day ${currentDayData.dayNumber}`}</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">{currentDayData.weatherNote}</h3>
                                    </div>

                                    <div className="pl-2">
                                        {currentDayData.places.map((place, index) => {
                                            const nextPlace = currentDayData.places[index + 1];
                                            const distKm = (nextPlace && place.lat && place.lng && nextPlace.lat && nextPlace.lng)
                                                ? haversineKm(
                                                    parseFloat(place.lat), parseFloat(place.lng),
                                                    parseFloat(nextPlace.lat), parseFloat(nextPlace.lng)
                                                )
                                                : null;
                                            return (
                                                <React.Fragment key={index}>
                                                    <TimelineEvent
                                                        event={place}
                                                        index={index}
                                                        total={currentDayData.places.length}
                                                        onLocate={handleLocate}
                                                        onLaunchAR={handleLaunchAR}
                                                        sourceCurrencyCode={sourceCurrencyCode}
                                                        targetCurrencyCode={targetCurrency}
                                                        isSaved={savedPlacesMap.has(place.name)}
                                                        onToggleSave={handleToggleSave}
                                                        launchingPlace={launchingPlace}
                                                        onDragStart={handleDragStart}
                                                        onDragOver={handleDragOver}
                                                        onDrop={handleDrop}
                                                        onDragEnd={handleDragEnd}
                                                    />
                                                    {distKm !== null && (
                                                        <div className="flex items-center gap-1.5 pl-14 pb-1 -mt-6 mb-1">
                                                            <Navigation size={10} className="text-emerald-400 shrink-0" />
                                                            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                                                                {distKm < 1
                                                                    ? `${Math.round(distKm * 1000)} m to next stop`
                                                                    : `${distKm.toFixed(1)} km to next stop`}
                                                            </span>
                                                        </div>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Map */}
                            <div className="xl:col-span-7 h-full relative group rounded-3xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 shadow-lg bg-emerald-50/10 dark:bg-slate-900/20 min-h-[500px]">
                                <MapContainer
                                    center={mapCenter}
                                    zoom={mapZoom}
                                    scrollWheelZoom={true}
                                    style={{ height: '100%', minHeight: '600px', width: '100%', zIndex: 0 }}
                                    className="h-full w-full outline-none"
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                                    />
                                    <ForceResize center={mapCenter} zoom={mapZoom} />

                                    {currentDayData.places.map((place, idx) => (
                                        place.lat && place.lng && (
                                            <Marker
                                                key={`marker-${activeDay}-${idx}`}
                                                position={[place.lat, place.lng]}
                                            >
                                                <Popup>
                                                    <div className="p-1 min-w-[120px] dark:text-slate-100">
                                                        <p className="font-bold text-sm mb-1">{place.name}</p>
                                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2">{place.timeSlot}</p>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (place.lat && place.lng) handleLaunchAR(place);
                                                            }}
                                                            disabled={!(place.lat && place.lng)}
                                                            title={(place.lat && place.lng) ? 'Launch AR Navigation' : 'No coordinates available'}
                                                            className={`w-full py-2.5 px-4 text-[10px] font-bold tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${(place.lat && place.lng)
                                                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/20 hover:scale-[1.03] active:scale-95 cursor-pointer border-none'
                                                                : 'bg-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                                                                }`}
                                                        >
                                                            <Sparkles size={12} className="animate-pulse" />
                                                            AR Launch
                                                        </button>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        )
                                    ))}

                                    {/* Dashed polyline connecting places in visit order */}
                                    {(() => {
                                        const positions = currentDayData.places
                                            .filter(p => p.lat && p.lng)
                                            .map(p => [parseFloat(p.lat), parseFloat(p.lng)]);
                                        return positions.length > 1 ? (
                                            <Polyline
                                                positions={positions}
                                                pathOptions={{ color: '#10b981', weight: 4.5, dashArray: '8 6', opacity: 0.9 }}
                                            />
                                        ) : null;
                                    })()}

                                    {mapMarker && mapMarker.lat && (
                                        <AutoPopupMarker
                                            position={[mapMarker.lat, mapMarker.lng]}
                                            label={mapMarker.label}
                                            bookingUrl={mapMarker.bookingUrl}
                                            timestamp={mapMarker.timestamp}
                                            onLaunchAR={handleLaunchAR}
                                        />
                                    )}

                                    <FocusView dayPlaces={currentDayData.places} />
                                </MapContainer>

                                {/* Top Hotels Section */}
                                {itinerary.topHotels && itinerary.topHotels.length > 0 && (
                                    <div className={`absolute top-4 left-4 z-20 transition-all duration-300 ${showHotels ? 'w-80' : 'w-12'}`}>
                                        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/50 dark:border-slate-700/50 overflow-hidden">
                                            <div className="flex items-center justify-between p-4 border-b border-slate-100/50">
                                                {showHotels ? (
                                                    <div className="flex items-center gap-2">
                                                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recommended Stays</h3>
                                                    </div>
                                                ) : (
                                                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                )}
                                                <button
                                                    onClick={() => setShowHotels(!showHotels)}
                                                    className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors"
                                                >
                                                    {showHotels ? <ChevronRight className="rotate-180 w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                </button>
                                            </div>

                                            {showHotels && (
                                                <div className="p-4 flex flex-col gap-3 max-h-[400px] overflow-y-auto no-scrollbar">
                                                    {itinerary.topHotels?.slice(0, 6).map((hotel, idx) => (
                                                        <div key={idx} className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm hover:border-emerald-200 transition-all group/hotel">
                                                            <div
                                                                className="flex gap-3 group/hotel cursor-pointer mb-3"
                                                                onClick={() => handleLocate({ ...hotel, category: 'hotel' })}
                                                            >
                                                                <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200/50">
                                                                    {hotel.image ? (
                                                                        <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover group-hover/hotel:scale-110 transition-transform" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                                            <MapPin size={24} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mb-1">{hotel.name}</h4>
                                                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 capitalize">
                                                                        <span className="flex items-center gap-0.5"><Star size={8} className="text-amber-500 fill-amber-500" /> {hotel.rating || '4.5'}</span>
                                                                        <span>• {hotel.price || 'Premium'}</span>
                                                                    </div>
                                                                    <span className="text-xs font-black text-teal-600 dark:text-teal-400 mt-0.5 block">
                                                                        <PriceDisplay amount={hotel.price} sourceCode={sourceCurrencyCode} targetCode={targetCurrency} />
                                                                    </span>
                                                                </div>
                                                                <div className="self-center">
                                                                    <ExternalLink size={10} className="text-slate-300 group-hover/hotel:text-emerald-500" />
                                                                </div>
                                                            </div>

                                                            <div className="flex gap-2 pt-2 border-t border-slate-50 dark:border-slate-700">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const url = hotel.bookingUrl || `https://www.google.com/search?q=${encodeURIComponent(hotel.name + ' ' + itinerary.destination + ' booking')}`;
                                                                        window.open(url, '_blank');
                                                                    }}
                                                                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm"
                                                                >
                                                                    <ExternalLink size={12} />
                                                                    Book Now
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleLocate({ ...hotel, category: 'hotel' });
                                                                    }}
                                                                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 hover:border-teal-200 dark:hover:border-teal-500/50 text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5"
                                                                >
                                                                    <MapIcon size={12} />
                                                                    Locate
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeView === 'calendar' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
                            {itinerary.days.map(day => (
                                <div key={day.dayNumber} className="bg-white/50 dark:bg-slate-900/40 backdrop-blur-sm p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[300px]">
                                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                                        <span className="text-xl font-black text-emerald-500">Day {day.dayNumber}</span>
                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{day.date || 'Scheduled'}</span>
                                    </div>
                                    <div className="flex-1 flex flex-col gap-3">
                                        {day.places?.map((place, pIdx) => (
                                            <div key={pIdx} className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${place.category === 'hotel' ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
                                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{place.name}</span>
                                            </div>
                                        ))}
                                        {(!day.places || day.places.length === 0) && (
                                            <div className="text-xs text-slate-400 italic">No activities planned</div>
                                        )}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div className="text-[10px] text-slate-400 mb-1">Estimated Cost</div>
                                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                            <PriceDisplay
                                                amount={day.totalDayCost || (day.places?.reduce((sum, p) => sum + (parseFloat(p.price || p.cost || 0)), 0)) || 0}
                                                sourceCode={sourceCurrencyCode}
                                                targetCode={targetCurrency}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeView === 'budget' && (
                        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
                            <CostChart
                                costSummary={itinerary.costSummary}
                                dailyCosts={itinerary.days}
                                currencySymbol={targetCurrency === 'INR' ? '₹' : '$'}
                            />
                        </div>
                    )}
                </main>
            </div>

            {/* Modals & Overlays */}
            {activeAR && (
                <ARViewer
                    destination={activeAR}
                    onClose={() => setActiveAR(null)}
                />
            )}

            {previewAR && (
                <MobilePreviewModal
                    isOpen={!!previewAR}
                    onClose={() => setPreviewAR(null)}
                    destination={previewAR}
                />
            )}

            <RegenModal
                isOpen={isRegenModalOpen}
                onClose={() => setIsRegenModalOpen(false)}
                onSubmit={handleRegenerate}
                isSubmitting={regenerating}
            />
        </AppLayout>
    );
};

export default ItineraryPage;
