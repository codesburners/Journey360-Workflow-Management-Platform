import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Sun, Plus } from 'lucide-react';
import { apiService } from '../../services/apiService';
import { auth } from '../../services/firebase';
import { useNavigate } from 'react-router-dom';

const ContextPanel = () => {
    const navigate = useNavigate();
    const [context, setContext] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContext = async () => {
            try {
                const data = await apiService.getDashboardContext(auth);
                setContext(data);
            } catch (error) {
                console.error("Failed to fetch dashboard context:", error);
                // Fallback or leave context null to show empty/add state
            } finally {
                setLoading(false);
            }
        };

        fetchContext();
    }, []);

    const handleAddTrip = () => {
        navigate('/trips'); // Or a modal to add trip
    };

    if (loading) {
        return (
            <div className="w-full lg:w-96 flex-shrink-0 space-y-6 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-2xl"></div>
                <div className="h-40 bg-gray-200 rounded-2xl"></div>
            </div>
        );
    }

    // Default static data if no trip found, or better, an empty state prompting to plan a trip.
    if (!context) {
        return (
            <div className="w-full lg:w-96 flex-shrink-0 space-y-6">
                <div className="bg-emerald-50 rounded-2xl p-8 text-center border border-emerald-100">
                    <h3 className="font-bold text-gray-900 text-lg mb-2">No Active Trip</h3>
                    <p className="text-sm text-gray-600 mb-6">Plan a new trip to see real-time suggestions and weather here!</p>
                    <button onClick={handleAddTrip} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium shadow-sm hover:bg-emerald-700 transition-colors">
                        Plan a Trip
                    </button>
                </div>
            </div>
        );
    }

    const { destination, weather, next_activity, schedule } = context;

    return (
        <div className="w-full lg:w-96 flex-shrink-0 space-y-6">
            <h3 className="font-bold text-gray-900 text-lg">Next Activity</h3>

            {/* Map Card / Next Activity Highlight */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative h-48 group">
                <img
                    src={`https://source.unsplash.com/800x600/?${destination},travel`}
                    alt={destination}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    onError={(e) => e.target.src = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=600&h=400"}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent flex flex-col justify-end p-4 text-white">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                        {next_activity ? "Up Next" : "Current Location"}
                    </span>
                    <h4 className="font-bold text-lg">
                        {next_activity ? next_activity.title : destination}
                    </h4>
                    {next_activity && <p className="text-sm text-gray-200">{next_activity.time}</p>}
                </div>
            </div>

            {/* Schedule Card */}
            {schedule && schedule.length > 0 && (
                <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                    <div className="flex items-center gap-2 mb-4 text-emerald-600 font-bold text-sm uppercase tracking-wide">
                        <Calendar size={16} />
                        <span>Schedule • Today</span>
                    </div>

                    <div className="space-y-6 relative">
                        {/* Timeline Line */}
                        <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-emerald-200"></div>

                        {schedule.map((item, index) => (
                            <div key={index} className="relative pl-6">
                                <div className={`absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white 
                                    ${index === 0 ? 'bg-emerald-600 ring-1 ring-emerald-200' : 'bg-gray-300'}`}>
                                </div>
                                <h5 className={`font-bold text-sm ${index === 0 ? 'text-gray-900' : 'text-gray-500'}`}>
                                    {item.title}
                                </h5>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {item.time} • {item.location}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Weather Card */}
            {weather && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Weather in {destination}</p>
                        <h4 className="text-3xl font-bold text-gray-900">{Math.round(weather.main?.temp || 0)}°C</h4>
                        <p className="text-xs text-gray-500 mt-1 capitalize">
                            {weather.weather?.[0]?.description || "Unknown"}
                        </p>
                    </div>
                    {/* Simple weather icon logic based on description or id would be better, sticking to generic Sun for MVP simplicity or generic icon */}
                    <Sun className="text-orange-400 w-10 h-10" />
                </div>
            )}

            {/* Add Item Button */}
            <button className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 font-medium hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2">
                <span>Add Item to Trip</span>
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <Plus size={14} />
                </div>
            </button>

            {/* Bottom Actions Row (from image) */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {/* These look like quick chips in the bottom of the image, maybe simpler to just list them */}
            </div>

        </div>
    );
};

export default ContextPanel;
