import React, { useState, useEffect } from 'react';
import { MapPin, Loader2, Calendar, ChevronRight, Search, Plus } from 'lucide-react';
import { auth } from '../../services/firebase';
import { apiService } from '../../services/apiService';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';

import velloreImage from '../../assets/images/vellore_image.png';

const MyTripsPage = () => {
    const navigate = useNavigate();
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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
                    setLoading(false); // Stop loading if no user found
                }
            });
            return unsub;
        }
    }, []);

    const filteredTrips = trips.filter(trip =>
        trip.destination.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Helper logic to get image
    const getTripImage = (trip) => {
        // Debug logging
        // console.log("Trip Dest:", trip.destination, "Vellore Image:", velloreImage);

        if (trip.destination && trip.destination.toLowerCase().trim() === 'vellore') return velloreImage;
        return trip.image_url;
    };

    return (
        <AppLayout>
            <div className="bg-transparent min-h-full p-6 md:p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Adventures</h1>
                            <p className="text-slate-500 dark:text-gray-400">Manage and view all your planned trips.</p>
                        </div>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                        >
                            <Plus size={20} />
                            Plan New Trip
                        </button>
                    </div>

                    {/* Search & Stats */}
                    <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white/20 dark:border-slate-700/50 flex flex-col md:flex-row gap-4 mb-8">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" size={20} />
                            <input
                                type="text"
                                placeholder="Search by destination..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                        </div>
                        <div className="flex items-center gap-6 px-4 border-l border-white/20 dark:border-slate-700 hidden md:flex">
                            <div className="text-center">
                                <div className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Total Trips</div>
                                <div className="text-xl font-bold text-slate-900 dark:text-white">{trips.length}</div>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white/20 dark:bg-slate-900/20 backdrop-blur-sm rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                            <Loader2 className="animate-spin text-emerald-600 mb-4" size={40} />
                            <p className="text-slate-500 dark:text-gray-400 font-medium">Retrieving your travel history...</p>
                        </div>
                    ) : filteredTrips.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white/20 dark:bg-slate-900/20 backdrop-blur-sm rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-4xl">🌎</div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No trips found</h3>
                            <p className="text-slate-500 dark:text-gray-400 mb-8 max-w-xs text-center">Ready to start your next adventure? AI is here to help you plan everything.</p>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                            >
                                Create your first trip →
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredTrips.map((trip) => (
                                <div
                                    key={trip.trip_id}
                                    onClick={() => navigate(`/itinerary?trip_id=${trip.trip_id}`)}
                                    className="group bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-sm hover:shadow-xl hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all cursor-pointer overflow-hidden flex flex-col"
                                >
                                    <div className="h-32 bg-slate-800 p-6 flex items-start justify-between relative overflow-hidden">
                                        {/* Background Fallback (Neutral Dark) */}
                                        <div className="absolute inset-0 bg-slate-950 -z-10" />

                                        {getTripImage(trip) ? (
                                            <>
                                                <img
                                                    src={getTripImage(trip)}
                                                    alt={trip.destination}
                                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                    onError={(e) => {
                                                        const isLocal = trip.destination === 'Vellore';
                                                        if (isLocal) return;
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'none';
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent pointer-events-none" />
                                            </>
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
                                        )}

                                        <div className="relative z-10">
                                            <h3 className="text-xl font-bold text-white mb-1 drop-shadow-md">{trip.destination}</h3>
                                            <p className="text-emerald-300 text-xs font-semibold uppercase tracking-widest drop-shadow-sm">{trip.status}</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white z-10 group-hover:bg-emerald-500 transition-colors">
                                            <ChevronRight size={20} />
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 text-slate-600 dark:text-gray-300">
                                                <Calendar size={18} className="text-slate-400 dark:text-gray-500" />
                                                <div className="text-sm">
                                                    <span className="font-medium text-slate-900 dark:text-white">{trip.start_date || 'TBD'}</span>
                                                    <span className="mx-2 text-slate-300 dark:text-gray-600">→</span>
                                                    <span className="font-medium text-slate-900 dark:text-white">{trip.end_date || 'TBD'}</span>
                                                </div>
                                            </div>
                                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
                                                <div>
                                                    <div className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">Budget</div>
                                                    <div className="text-lg font-bold text-slate-900 dark:text-white">₹{trip.budget}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">Days</div>
                                                    <div className="text-lg font-bold text-slate-900 dark:text-white">{trip.days || 3}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default MyTripsPage;

