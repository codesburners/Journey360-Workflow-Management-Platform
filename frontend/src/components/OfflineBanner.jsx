import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

/**
 * Offline detection banner — slides in when network connection is lost,
 * and shows a brief "Back online!" toast when reconnected.
 */
export default function OfflineBanner() {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [showReconnected, setShowReconnected] = useState(false);

    useEffect(() => {
        const handleOffline = () => {
            setIsOffline(true);
            setShowReconnected(false);
        };

        const handleOnline = () => {
            setIsOffline(false);
            setShowReconnected(true);
            setTimeout(() => setShowReconnected(false), 3000);
        };

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    if (!isOffline && !showReconnected) return null;

    return (
        <div
            className={`fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${isOffline
                    ? 'bg-red-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
            role="alert"
            aria-live="assertive"
        >
            {isOffline ? (
                <>
                    <WifiOff className="w-4 h-4" />
                    <span>You're offline. Some features may not work.</span>
                </>
            ) : (
                <>
                    <Wifi className="w-4 h-4" />
                    <span>Back online!</span>
                </>
            )}
        </div>
    );
}
