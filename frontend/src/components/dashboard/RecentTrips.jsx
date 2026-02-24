import React, { useState, useEffect } from 'react';
import { MapPin, Loader2, Calendar } from 'lucide-react';
import { auth } from '../../services/firebase';
import { apiService } from '../../services/apiService';
import { useNavigate } from 'react-router-dom';
import velloreImage from '../../assets/images/vellore_image.png';

const RecentTrips = () => {
    const navigate = useNavigate();
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrips = async () => {
            try {
                const data = await apiService.listTrips(auth);
                setTrips(data);
            } catch (error) {
                console.error("Fetch Trips Error:", error);
            } finally {
                setLoading(false);
            }
        };

        if (auth.currentUser) {
            fetchTrips();
        } else {
            const unsub = auth.onAuthStateChanged(u => {
                if (u) {
                    fetchTrips();
                } else {
                    setLoading(false);
                }
            });
            return unsub;
        }
    }, []);

    if (loading) return (
        <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-emerald-600" />
        </div>
    );

    if (trips.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">My Trips</h3>
                <button
                    onClick={() => navigate('/my-trips')}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                    View All
                </button>
            </div>
            <div className="space-y-4">
                {trips.slice(0, 4).map((trip) => (
                    <div
                        key={trip.trip_id}
                        onClick={() => navigate(`/itinerary?trip_id=${trip.trip_id}`)}
                        className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white/20 dark:border-slate-700/50 flex gap-4 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all cursor-pointer items-center"
                    >
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 overflow-hidden relative shrink-0">
                            {(trip.destination && trip.destination.toLowerCase().trim() === 'vellore') ? (
                                <img src={velloreImage} alt={trip.destination} className="w-full h-full object-cover" />
                            ) : trip.image_url ? (
                                <img src={trip.image_url} alt={trip.destination} className="w-full h-full object-cover" />
                            ) : (
                                <MapPin size={24} />
                            )}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{trip.destination}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{trip.status}</p>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                                    Budget: ₹{trip.budget}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentTrips;
