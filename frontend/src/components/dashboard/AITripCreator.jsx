import React, { useState } from 'react';
import { MapPin, Calendar, Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../services/firebase';
import { apiService } from '../../services/apiService';

const AITripCreator = ({ initialData }) => {
    const navigate = useNavigate();
    const [destination, setDestination] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [budget, setBudget] = useState(50);
    const [pace, setPace] = useState('Balanced');
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [customInterest, setCustomInterest] = useState('');
    const [loading, setLoading] = useState(false);

    // Update local state AND auto-generate when prop changes
    React.useEffect(() => {
        if (initialData) {
            const dest = initialData.name.split(',')[0];
            setDestination(dest);
            if (initialData.budget) setBudget(initialData.budget);
            if (initialData.pace) setPace(initialData.pace);
            if (initialData.interests) setSelectedInterests(initialData.interests);

            // Auto-Generate directly using the passed data (plus defaults)
            executeGeneration({
                destination: dest,
                budget: initialData.budget || 50,
                pace: initialData.pace || 'Balanced',
                interests: initialData.interests || [],
                // Default to 3 days from tomorrow for quick suggestions
                start_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                end_date: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0]
            });
        }
    }, [initialData]);

    const interests = [
        { id: 'adventure', label: 'Adventure', icon: '🏃' },
        { id: 'culture', label: 'Culture', icon: '🏛️' },
        { id: 'foodie', label: 'Foodie', icon: '🍴' },
        { id: 'relaxation', label: 'Relaxation', icon: '🌿' },
        { id: 'photography', label: 'Photography', icon: '📷' },
    ];

    const toggleInterest = (id) => {
        setSelectedInterests(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const executeGeneration = async (data) => {
        if (!auth.currentUser) return alert("Please login first");

        setLoading(true);
        try {
            const tripData = {
                destination: data.destination,
                budget: parseInt(data.budget) * 2000,
                interests: data.interests.length > 0 ? data.interests : ['General'],
                travel_pace: data.pace,
                start_date: data.start_date || new Date().toISOString().split('T')[0],
                end_date: data.end_date || new Date().toISOString().split('T')[0],
            };

            const newTrip = await apiService.createTrip(auth, tripData);
            await apiService.generateItinerary(auth, newTrip.trip_id);
            navigate(`/itinerary?trip_id=${newTrip.trip_id}`);
        } catch (error) {
            console.error("Generation Error:", error);
            alert("Error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleManualGenerate = () => {
        const combinedInterests = [...selectedInterests];
        if (customInterest.trim()) combinedInterests.push(customInterest.trim());

        executeGeneration({
            destination,
            budget,
            pace,
            interests: combinedInterests,
            start_date: startDate,
            end_date: endDate
        });
    };

    return (
        <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/20 dark:border-slate-700/50 transition-colors duration-300">
            <div className="flex items-center gap-2 mb-6">
                <Sparkles className="text-emerald-600 dark:text-emerald-400" size={20} />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">AI Trip Creator</h2>
            </div>

            <div className="space-y-6">
                {/* Destination & Dates */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Destination</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                            <input
                                type="text"
                                placeholder="e.g. Kyoto"
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 focus:border-emerald-400 dark:focus:border-emerald-500 transition-all text-sm text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">From</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 focus:border-emerald-400 dark:focus:border-emerald-500 transition-all text-sm text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">To</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 focus:border-emerald-400 dark:focus:border-emerald-500 transition-all text-sm text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Budget Level */}
                <div>
                    <div className="flex justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estimated Budget</label>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">₹{parseInt(budget) * 2000}</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:accent-emerald-500"
                    />
                    <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
                        <span>Economy</span>
                        <span>Balanced</span>
                        <span>Luxury</span>
                    </div>
                </div>

                {/* Interests */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Interests</label>
                    <div className="flex flex-wrap gap-2">
                        {interests.map((interest) => (
                            <button
                                key={interest.id}
                                onClick={() => toggleInterest(interest.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm transition-all ${selectedInterests.includes(interest.id)
                                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                    : 'border-gray-100 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-emerald-200 dark:hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <span>{interest.icon}</span>
                                <span>{interest.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Custom Interests Input */}
                    <div className="mt-4">
                        <input
                            type="text"
                            placeholder="Add custom interest (e.g. Scuba Diving, History)"
                            value={customInterest}
                            onChange={(e) => setCustomInterest(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 focus:border-emerald-400 dark:focus:border-emerald-500 transition-all text-sm text-gray-900 dark:text-white"
                        />
                    </div>
                </div>

                {/* Travel Pace */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Travel Pace</label>
                    <div className="grid grid-cols-3 bg-gray-50 dark:bg-slate-800 p-1 rounded-xl">
                        {['Relaxed', 'Balanced', 'Fast-Paced'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPace(p)}
                                className={`text-sm py-2 rounded-lg font-medium transition-all ${pace === p
                                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleManualGenerate}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                    {loading ? 'Crafting Itinerary...' : 'Generate AI Itinerary'}
                </button>

            </div>
        </div>
    );
};

export default AITripCreator;
