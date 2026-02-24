import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ARViewer from '../../components/navigation/ARViewer';
import { Navigation, MapPin, Compass, AlertTriangle, ArrowRight, Smartphone, Locate } from 'lucide-react';

/**
 * Standalone AR Navigation Page (Restored)
 */
const TripNavigation = () => {
    const [searchParams] = useSearchParams();
    const [stage, setStage] = useState('welcome'); // welcome | loading | ar | error
    const [error, setError] = useState(null);
    const [userDistance, setUserDistance] = useState(null);

    // Parse destination from URL query params
    const lat = parseFloat(searchParams.get('lat'));
    const lng = parseFloat(searchParams.get('lng'));
    const name = searchParams.get('name') || 'Destination';

    // Validate coordinates
    const isValid = !isNaN(lat) && !isNaN(lng);

    useEffect(() => {
        if (!isValid) return;
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const d = haversineDistance(pos.coords.latitude, pos.coords.longitude, lat, lng);
                setUserDistance(d);
            }, null, { enableHighAccuracy: false, timeout: 5000 });
        }
    }, [isValid, lat, lng]);

    const haversineDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371000;
        const toRad = d => d * Math.PI / 180;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const formatDistance = (meters) => {
        if (meters == null) return null;
        if (meters > 1000) return (meters / 1000).toFixed(1) + ' km';
        return Math.round(meters) + ' m';
    };

    const handleStartAR = async () => {
        setStage('loading');
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            }
            setStage('ar');
        } catch (err) {
            setError('Permissions required');
            setStage('error');
        }
    };

    if (!isValid) return <div>Invalid coordinates</div>;
    if (stage === 'ar') return <div className="h-screen w-screen"><ARViewer destination={{ lat, lng, name }} onClose={() => setStage('welcome')} /></div>;

    return (
        <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mb-6">
                <Navigation size={40} className="text-emerald-500" />
            </div>
            <h1 className="text-3xl font-black mb-4">AR Navigation</h1>
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 mb-8 w-full max-w-sm">
                <h2 className="text-xl font-bold">{name}</h2>
                {userDistance && <p className="text-emerald-500 mt-2 font-bold">{formatDistance(userDistance)} away</p>}
            </div>
            <button
                onClick={handleStartAR}
                className="w-full max-w-sm py-5 bg-emerald-600 rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/20"
            >
                Start Navigation
            </button>
        </div>
    );
};

export default TripNavigation;
