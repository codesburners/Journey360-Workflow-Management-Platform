import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ARViewer from '../../components/navigation/ARViewer';
import { Navigation, MapPin, Compass, AlertTriangle, ArrowRight, Smartphone, Locate } from 'lucide-react';

/**
 * Standalone AR Navigation Page
 * 
 * Opens via QR code scan on mobile. Reads destination from URL params:
 *   /ar-navigate?lat=12.97&lng=77.59&name=Library
 * 
 * Flow:
 *   1. Parse & validate URL params
 *   2. Show permission request screen
 *   3. Launch ARViewer with destination
 */
const ARNavigate = () => {
    const [searchParams] = useSearchParams();
    const [stage, setStage] = useState('welcome'); // welcome | loading | ar | error
    const [error, setError] = useState(null);
    const [userDistance, setUserDistance] = useState(null);

    // Parse destination from URL query params
    const lat = parseFloat(searchParams.get('lat'));
    const lng = parseFloat(searchParams.get('lng'));
    const name = searchParams.get('name') || 'Destination';

    // Validate coordinates
    const isValid = !isNaN(lat) && !isNaN(lng) &&
        lat >= -90 && lat <= 90 &&
        lng >= -180 && lng <= 180;

    // Try to get initial distance estimate on mount
    useEffect(() => {
        if (!isValid) return;

        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const d = haversineDistance(
                        pos.coords.latitude, pos.coords.longitude,
                        lat, lng
                    );
                    setUserDistance(d);
                },
                () => {
                    // Silently ignore — user hasn't granted permission yet
                },
                { enableHighAccuracy: false, timeout: 5000 }
            );
        }
    }, [isValid, lat, lng]);

    const haversineDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371000;
        const toRad = d => d * Math.PI / 180;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const formatDistance = (meters) => {
        if (meters == null) return null;
        if (meters > 1000) return (meters / 1000).toFixed(1) + ' km';
        return Math.round(meters) + ' m';
    };

    const handleStartAR = async () => {
        // Check if running on a secure context (HTTPS or localhost)
        if (!window.isSecureContext) {
            const currentUrl = window.location.href;
            const httpsUrl = currentUrl.replace('http://', 'https://');
            setError(
                `AR navigation requires HTTPS for camera and GPS access. ` +
                `Please use: ${httpsUrl}`
            );
            setStage('error');
            return;
        }

        setStage('loading');

        try {
            // Request camera permission
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                // Stop the test stream immediately — ARViewer will create its own
                stream.getTracks().forEach(t => t.stop());
            }

            // Verify GPS is available
            await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000
                });
            });

            // All permissions granted — launch AR
            setStage('ar');
        } catch (err) {
            console.error('Permission error:', err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError('Camera and location permissions are required for AR navigation. Please allow access and try again.');
            } else if (err.code === 1) {
                setError('Location access denied. Please enable GPS in your device settings and try again.');
            } else if (err.code === 2) {
                setError('Could not determine your location. Please ensure GPS is enabled.');
            } else if (err.code === 3) {
                setError('Location request timed out. Please try again in an open area.');
            } else {
                setError('Could not start AR navigation. Please ensure you are using a modern mobile browser with camera and GPS access.');
            }
            setStage('error');
        }
    };

    // --- INVALID PARAMS SCREEN ---
    if (!isValid) {
        return (
            <div className="h-screen w-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
                <div className="max-w-sm w-full text-center">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                        <AlertTriangle className="text-red-400" size={36} />
                    </div>
                    <h1 className="text-2xl font-black text-white mb-3">Invalid Destination</h1>
                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                        This navigation link is missing valid coordinates. Please scan a valid Journey360 QR code.
                    </p>
                    <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 text-left">
                        <p className="text-xs text-slate-500 font-mono">
                            Expected: /ar-navigate?lat=12.97&lng=77.59&name=Place
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // --- ERROR SCREEN ---
    if (stage === 'error') {
        return (
            <div className="h-screen w-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
                <div className="max-w-sm w-full text-center">
                    <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
                        <AlertTriangle className="text-amber-400" size={36} />
                    </div>
                    <h1 className="text-2xl font-black text-white mb-3">Permission Required</h1>
                    <p className="text-slate-400 text-sm leading-relaxed mb-8">{error}</p>
                    <button
                        onClick={() => { setError(null); setStage('welcome'); }}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-600/30"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // --- LOADING SCREEN ---
    if (stage === 'loading') {
        return (
            <div className="h-screen w-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-6"></div>
                    <h2 className="text-xl font-bold text-white mb-2">Starting AR Navigation</h2>
                    <p className="text-slate-400 text-sm">Requesting camera & location access...</p>
                </div>
            </div>
        );
    }

    // --- AR VIEW (Full Screen) ---
    if (stage === 'ar') {
        return (
            <div className="h-screen w-screen overflow-hidden">
                <ARViewer
                    destination={{ lat, lng, name }}
                    onClose={() => setStage('welcome')}
                />
            </div>
        );
    }

    // --- WELCOME / PERMISSION REQUEST SCREEN ---
    return (
        <div className="h-screen w-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col overflow-hidden">

            {/* Top Section */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 pb-4">

                {/* Logo / Brand */}
                <div className="mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/30 mx-auto mb-4">
                        <Navigation className="text-white" size={36} />
                    </div>
                    <h1 className="text-3xl font-black text-white text-center tracking-tight">
                        AR Navigation
                    </h1>
                    <p className="text-emerald-400 text-sm font-semibold text-center mt-1">
                        Powered by Journey360
                    </p>
                </div>

                {/* Destination Card */}
                <div className="w-full max-w-sm bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 border border-slate-700/50 shadow-xl mb-6">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-500/20">
                            <MapPin className="text-emerald-400" size={22} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Navigate to</p>
                            <h2 className="text-xl font-bold text-white leading-tight truncate">{name}</h2>
                            <p className="text-slate-500 text-xs font-mono mt-1">
                                {lat.toFixed(5)}, {lng.toFixed(5)}
                            </p>
                            {userDistance != null && (
                                <div className="flex items-center gap-1.5 mt-3">
                                    <Locate size={14} className="text-emerald-400" />
                                    <span className="text-emerald-400 text-sm font-bold">
                                        {formatDistance(userDistance)} away
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Requirements List */}
                <div className="w-full max-w-sm space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-slate-400 text-sm">
                        <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0">
                            <Smartphone size={16} className="text-blue-400" />
                        </div>
                        <span>Camera access for AR overlay</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 text-sm">
                        <div className="w-8 h-8 bg-teal-500/10 rounded-xl flex items-center justify-center shrink-0">
                            <Locate size={16} className="text-teal-400" />
                        </div>
                        <span>GPS location for positioning</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 text-sm">
                        <div className="w-8 h-8 bg-purple-500/10 rounded-xl flex items-center justify-center shrink-0">
                            <Compass size={16} className="text-purple-400" />
                        </div>
                        <span>Compass & gyroscope for direction</span>
                    </div>
                </div>
            </div>

            {/* Bottom CTA */}
            <div className="px-6 pb-10 pt-4">
                <button
                    onClick={handleStartAR}
                    className="w-full max-w-sm mx-auto flex items-center justify-center gap-3 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white text-lg font-black rounded-2xl transition-all shadow-2xl shadow-emerald-600/30"
                >
                    Start AR Navigation
                    <ArrowRight size={22} />
                </button>
                <p className="text-center text-slate-600 text-xs mt-4">
                    Works best outdoors with GPS signal
                </p>
            </div>
        </div>
    );
};

export default ARNavigate;
