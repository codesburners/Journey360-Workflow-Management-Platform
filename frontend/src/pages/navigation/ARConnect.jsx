import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from '../../services/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import ARViewer from '../../components/navigation/ARViewer';
import { Loader2, Wifi, WifiOff, RefreshCw, Smartphone } from 'lucide-react';

const ARConnect = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session');

    const [destination, setDestination] = useState(null);
    const [status, setStatus] = useState('connecting'); // connecting, connected, disconnected
    const [error, setError] = useState(null);
    const [permissionsGranted, setPermissionsGranted] = useState(false);
    const destinationRef = useRef(null); // Track destination for timeout closure

    useEffect(() => {
        // First check for stateless 'direct' parameter
        const urlParams = new URLSearchParams(window.location.search);
        const directData = urlParams.get('direct');

        if (directData) {
            try {
                const decoded = JSON.parse(atob(directData));
                setDestination(decoded);
                setStatus('connected');
                setPermissionsGranted(true); // Auto-grant since they tapped the link
                return;
            } catch (e) {
                console.error("Direct decode error:", e);
                setError("Invalid destination link");
            }
        }

        if (!sessionId) {
            setError("No session ID provided. Please scan a valid QR code.");
            setStatus('disconnected');
            return;
        }

        const sessionRef = doc(db, "ar_sessions", sessionId);

        // 1. Mark as connected (setDoc with merge won't fail if doc doesn't exist yet)
        setDoc(sessionRef, { status: 'connected' }, { merge: true })
            .catch(err => console.warn("Failed to update status", err));

        // Start a timeout — use ref to avoid stale closure
        const timeoutId = setTimeout(() => {
            if (!destinationRef.current) {
                setError("Session timed out. The desktop may not have sent a destination yet, or the session is invalid.");
                setStatus('disconnected');
            }
        }, 15000); // 15 second grace period

        // 2. Listen for updates from desktop
        const unsub = onSnapshot(sessionRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                if (data.destination) {
                    setDestination(data.destination);
                    destinationRef.current = data.destination;
                    setStatus('connected');
                    setError(null);
                    clearTimeout(timeoutId);
                } else if (data.status === 'connected' || data.status === 'waiting') {
                    // Document exists but destination not yet written
                    setStatus('connecting');
                    setError(null);
                }
            }
        }, (err) => {
            console.error("Firestore listen error:", err);
            if (err.code === 'permission-denied') {
                setError("Permission Denied: Check Firebase Rules. The Firestore security rules may be blocking access.");
            } else {
                setError("Connection Lost: " + (err.message || "Unknown error"));
            }
            setStatus('disconnected');
            clearTimeout(timeoutId);
        });

        return () => {
            unsub();
            clearTimeout(timeoutId);
        };
    }, [sessionId]);

    const handleRetry = () => {
        setError(null);
        setStatus('connecting');
        destinationRef.current = null;
        // Force re-mount by reloading window
        window.location.reload();
    };

    if (error) {
        return (
            <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-white p-8 text-center">
                <WifiOff size={48} className="text-red-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Connection Issue</h1>
                <p className="text-slate-400 mb-6 max-w-sm text-sm leading-relaxed">{error}</p>
                <button
                    onClick={handleRetry}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-xl font-bold text-sm transition-all"
                >
                    <RefreshCw size={16} />
                    Retry Connection
                </button>
            </div>
        );
    }

    if (!destination) {
        return (
            <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-white p-8 text-center">
                <div className="relative mb-8">
                    <Loader2 size={64} className="text-emerald-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Smartphone size={24} className="text-emerald-500/50" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold mb-3 tracking-tight">Syncing with Journey360</h1>
                <p className="text-slate-400 text-sm mb-8 max-w-[280px] leading-relaxed">
                    Connected to session! Please select a location on your desktop map to start AR navigation.
                </p>

                <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                    <div className="w-full bg-slate-900 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Wifi size={18} className="text-emerald-500" />
                            <div className="text-left">
                                <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Session ID</div>
                                <div className="text-sm font-mono font-bold text-white">{sessionId}</div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold">Status</div>
                            <div className="text-xs font-bold text-emerald-400">Ready</div>
                        </div>
                    </div>

                    <div className="text-[10px] text-slate-600 font-medium uppercase tracking-[0.2em]">
                        Keep this page open
                    </div>
                </div>
            </div>
        );
    }

    // Render AR View with "Live" badge
    return (
        <div className="relative h-screen w-screen overflow-hidden">
            <ARViewer
                destination={destination}
                onClose={() => {
                    window.location.reload();
                }}
            />

            {/* Permission Overlay (Required for iOS/Chrome sensors) */}
            {!permissionsGranted && (
                <div className="absolute inset-0 z-[20000] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center text-white">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                        <Navigation size={40} className="text-emerald-500 animate-pulse" />
                    </div>
                    <h2 className="text-3xl font-black mb-4 tracking-tight">Ready to Navigate?</h2>
                    <p className="text-slate-400 mb-10 max-w-xs leading-relaxed">
                        We need access to your sensors for high-accuracy AR directions. This works best when holding your phone upright.
                    </p>
                    <button
                        onClick={() => {
                            setPermissionsGranted(true);
                            // Trigger sensor request from ARViewer static method if available
                            if (ARViewer.setupCompass) {
                                ARViewer.setupCompass();
                            }
                        }}
                        className="w-full max-w-[280px] py-5 bg-emerald-600 text-white font-black rounded-3xl hover:bg-emerald-500 active:scale-95 transition-all shadow-xl shadow-emerald-500/20 uppercase tracking-widest text-sm"
                    >
                        Start Navigation
                    </button>
                    <p className="mt-6 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                        Hold phone upright for best results
                    </p>
                </div>
            )}

            {/* Live Indicator Overlay */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[10000] bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-2 border border-white/10 shadow-lg pointer-events-none">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Live Sync</span>
            </div>
        </div>
    );
};

export default ARConnect;
