import React, { useState, useEffect } from 'react';
import { X, Smartphone, Share2, Copy, ExternalLink, QrCode, Wifi, RefreshCw } from 'lucide-react';
import QRCode from "react-qr-code";
import ARViewer from './ARViewer';
import { db } from '../../services/firebase';
import { doc, setDoc, onSnapshot } from "firebase/firestore";

const MobilePreviewModal = ({ destination, onClose }) => {
    const [activeTab, setActiveTab] = useState('preview'); // 'preview' or 'qr'
    const [sessionId, setSessionId] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('waiting'); // waiting, connected
    const [writeError, setWriteError] = useState(null);
    // Initialize from localStorage or auto-detect public tunnel
    const getInitialTunnel = () => {
        const saved = localStorage.getItem('ar_tunnel_url');
        if (saved) return saved;

        const host = window.location.hostname;
        if (host !== 'localhost' && host !== '127.0.0.1' && !host.startsWith('192.168.')) {
            return window.location.origin;
        }
        return "https://sharp-hats-try.loca.lt"; // Fallback to last known good
    };

    const [customIp, setCustomIp] = useState(getInitialTunnel());
    const [realDistance, setRealDistance] = useState(null);
    const [isStatelessMode, setIsStatelessMode] = useState(false);

    // Initialize Session
    useEffect(() => {
        // Generate a random 6-char session code
        const sid = Math.random().toString(36).substring(2, 8).toUpperCase();
        setSessionId(sid);

        // Initial Write
        const sessionRef = doc(db, "ar_sessions", sid);
        setDoc(sessionRef, {
            active: true,
            destination: {
                name: destination.name,
                lat: destination.lat,
                lng: destination.lng
            },
            timestamp: Date.now(),
            status: 'waiting'
        }).catch(err => {
            console.error("Firestore Error:", err);
            setWriteError(err.message);
        });

        // Listen for mobile connection updates
        const unsub = onSnapshot(sessionRef, (doc) => {
            if (doc.exists() && doc.data().status === 'connected') {
                setConnectionStatus('connected');
            } else if (doc.exists() && doc.data().status === 'waiting') {
                setConnectionStatus('ready');
            }
        }, (err) => {
            // Handle permission errors on the read side too
            if (err.code === 'permission-denied') {
                setWriteError("Permission Denied: Check Firestore Rules");
            }
        });

        return () => unsub();
    }, []); // Run once on mount to create ID

    // Update destination when prop changes
    useEffect(() => {
        if (!sessionId) return;
        const sessionRef = doc(db, "ar_sessions", sessionId);
        setDoc(sessionRef, {
            destination: {
                name: destination.name,
                lat: destination.lat,
                lng: destination.lng
            },
            timestamp: Date.now()
        }, { merge: true });

        // Watch real distance if laptop has GPS
        let watchId = null;
        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition((pos) => {
                const d = haversineKm(pos.coords.latitude, pos.coords.longitude, destination.lat, destination.lng);
                setRealDistance(d);
            }, (err) => {
                console.warn("GPS Watch Error (Modal):", err);
            }, { enableHighAccuracy: true, maximumAge: 1000 });
        }

        return () => {
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        };
    }, [sessionId]);

    // Save tunnel to localStorage
    useEffect(() => {
        if (customIp) {
            localStorage.setItem('ar_tunnel_url', customIp);
        }
    }, [customIp]);

    // Internal Haversine helper for modal UI
    function haversineKm(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }


    // Generate a routable URL for mobile devices
    const getMobileUrl = () => {
        if (isStatelessMode) {
            // Stateless mode: encode destination data directly
            const base = customIp.endsWith('/') ? customIp.slice(0, -1) : customIp;
            const destData = btoa(JSON.stringify({
                lat: destination.lat,
                lng: destination.lng,
                name: destination.name
            }));
            return `${base}/ar-connect?direct=${destData}`;
        }

        if (!sessionId) return "";

        // If user entered a full URL (e.g. tunnel URL), use it directly
        if (customIp.startsWith('http')) {
            const base = customIp.endsWith('/') ? customIp.slice(0, -1) : customIp;
            return `${base}/ar-connect?session=${sessionId}`;
        }

        // If user entered an IP, build HTTP URL
        if (customIp) {
            const port = window.location.port || '5173';
            return `http://${customIp}:${port}/ar-connect?session=${sessionId}`;
        }

        return `${window.location.origin}/ar-connect?session=${sessionId}`;
    };

    const mobileUrl = getMobileUrl();

    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    const handleCopyLink = () => {
        navigator.clipboard.writeText(mobileUrl);
        alert("Live Link copied! Send this to your phone.");
    };

    return (
        <div className="fixed inset-0 z-[10000] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col md:flex-row overflow-hidden border border-slate-200 dark:border-slate-700/50 animate-in zoom-in-[0.97] duration-300">

                {/* Left Side: Controls & QR */}
                <div className="w-full md:w-96 bg-slate-50 dark:bg-slate-800/50 p-6 flex flex-col border-r border-slate-200 dark:border-slate-700/50">
                    <div className="mb-4">
                        {writeError && (
                            <div className="bg-red-100 text-red-600 p-3 rounded-lg text-xs font-bold mb-4 border border-red-200">
                                Firebase Error: {writeError}
                            </div>
                        )}

                        {isLocalhost && (
                            <div className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 p-4 rounded-xl text-[11px] font-medium mb-4 border border-amber-200 dark:border-amber-700/50 leading-relaxed">
                                <p className="font-bold mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                                    <Wifi size={12} className="text-amber-500" />
                                    Tunnel / URL Config
                                </p>
                                <p className="mb-2">Paste your tunnel URL (e.g. from Pinggy or Ngrok):</p>

                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={customIp}
                                        onChange={(e) => setCustomIp(e.target.value)}
                                        className="flex-1 bg-white dark:bg-slate-950 px-2 py-1 rounded border border-amber-300 dark:border-amber-800 text-xs font-mono"
                                        placeholder="https://sharp-hats-try.loca.lt"
                                    />
                                </div>

                                <p className="opacity-80 text-[10px] mb-1">Mobile Link:</p>
                                <code className="block bg-amber-50 dark:bg-amber-950 p-1.5 rounded mb-2 text-center border border-amber-200/50 select-all overflow-hidden text-ellipsis whitespace-nowrap">
                                    {getMobileUrl() || 'Enter your tunnel URL above'}
                                </code>
                                <div className="space-y-1 mt-2">
                                    <p className="opacity-80 font-bold">Recommended (Pinggy):</p>
                                    <code className="block bg-slate-900 text-slate-300 p-2 rounded text-[10px] font-mono select-all">
                                        ssh -p 443 -R0:localhost:5173 a.pinggy.io
                                    </code>
                                </div>
                            </div>
                        )}


                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : connectionStatus === 'ready' ? 'bg-blue-500' : 'bg-amber-500'}`}></div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                {connectionStatus === 'connected' ? 'Device Connected' : connectionStatus === 'ready' ? 'Session Ready' : 'Setting up Session...'}
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Live AR Link</h2>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                                Scan this dynamic code with your phone.
                            </p>
                            {realDistance !== null && (
                                <div className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-md border border-emerald-200 dark:border-emerald-800/50">
                                    {realDistance > 1 ? `${realDistance.toFixed(1)} km` : `${Math.round(realDistance * 1000)} m`} away
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <button
                                onClick={() => setIsStatelessMode(!isStatelessMode)}
                                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full transition-all border shadow-sm ${isStatelessMode ? 'bg-amber-500 border-amber-600 text-white shadow-amber-500/20' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-200'}`}
                            >
                                {isStatelessMode ? (
                                    <><RefreshCw size={10} className="animate-spin-slow" /> Direct Mode ON</>
                                ) : (
                                    <><RefreshCw size={10} /> Continuous Sync</>
                                )}
                            </button>
                            <span className={`text-[9px] font-bold uppercase tracking-tight ${isStatelessMode ? 'text-amber-500' : 'text-slate-400'}`}>
                                {isStatelessMode ? 'Ultra-Stable Link' : 'Real-time Desktop Sync'}
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-4 relative overflow-hidden">
                        {/* Scan Line Animation */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent h-full w-full animate-scan pointer-events-none"></div>

                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-4 z-10">
                            {mobileUrl && (
                                <QRCode
                                    value={mobileUrl}
                                    size={170}
                                    viewBox={`0 0 256 256`}
                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                />
                            )}
                        </div>

                        <div className="w-full text-center z-10">
                            <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 break-all mb-2 px-2">
                                {mobileUrl}
                            </p>
                            <p className="text-[11px] font-bold text-cyan-500 uppercase tracking-wider flex items-center justify-center gap-2">
                                <Wifi size={14} />
                                Real-time Sync Active
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleCopyLink}
                            className="w-full flex items-center justify-center gap-2 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-slate-700 dark:text-slate-300 font-medium text-sm"
                        >
                            <Copy size={16} />
                            Copy Live Link
                        </button>
                    </div>
                </div>

                {/* Right Side: Phone Preview */}
                <div className="flex-1 bg-slate-100 dark:bg-slate-950 relative flex items-center justify-center p-8">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-slate-500 hover:text-white transition-all z-10"
                    >
                        <X size={24} />
                    </button>

                    {/* iPhone Frame */}
                    <div className="relative w-[375px] h-[812px] bg-slate-900 rounded-[50px] shadow-[0_0_0_12px_#1e293b,0_0_0_14px_#475569,0_50px_100px_-20px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden border-8 border-slate-800 ring-1 ring-slate-900/50 transform scale-90 md:scale-100 transition-transform">

                        {/* Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-slate-950 rounded-b-2xl z-30 flex items-center justify-center">
                            <div className="w-16 h-1 bg-slate-800/50 rounded-full"></div>
                        </div>

                        {/* Status Bar Mock */}
                        <div className="h-12 w-full bg-black text-white flex justify-between items-center px-6 pt-2 text-[10px] font-bold z-20 relative">
                            <span>Live</span>
                            <div className="flex gap-1.5 ml-auto">
                                <Wifi size={10} />
                            </div>
                        </div>

                        {/* Content Area - AR Viewer */}
                        <div className="flex-1 relative bg-black">
                            <ARViewer
                                destination={destination}
                                onClose={onClose}
                                isEmbedded={true}
                            />
                        </div>

                        {/* Home Bar */}
                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full z-30"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobilePreviewModal;
