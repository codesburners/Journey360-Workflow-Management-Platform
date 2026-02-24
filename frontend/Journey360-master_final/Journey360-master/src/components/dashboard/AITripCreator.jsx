import React, { useState } from 'react';
import { MapPin, Calendar, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AITripCreator = () => {
    const navigate = useNavigate();
    const [budget, setBudget] = useState(50);
    const [pace, setPace] = useState('Balanced');

    const interests = [
        { id: 'adventure', label: 'Adventure', icon: '🏃' }, // Using emoji as placeholder for custom icons if needed, or lucide
        { id: 'culture', label: 'Culture', icon: '🏛️' },
        { id: 'foodie', label: 'Foodie', icon: '🍴' },
        { id: 'relaxation', label: 'Relaxation', icon: '🌿' },
        { id: 'photography', label: 'Photography', icon: '📷' },
    ];

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
                <Sparkles className="text-blue-600" size={20} />
                <h2 className="text-lg font-bold text-gray-900">AI Trip Creator</h2>
            </div>

            <div className="space-y-6">
                {/* Destination & Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Destination</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="e.g. Kyoto, Japan"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Travel Dates</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Select dates"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Budget Level */}
                <div>
                    <div className="flex justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">Budget Level</label>
                        <span className="text-xs font-semibold text-blue-600">Luxury Preferred</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Economy</span>
                        <span>Balanced</span>
                        <span>Luxury</span>
                    </div>
                </div>

                {/* Interests */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Interests</label>
                    <div className="flex flex-wrap gap-2">
                        {interests.map((interest) => (
                            <button
                                key={interest.id}
                                className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-100 text-sm text-gray-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 transition-all"
                            >
                                <span>{interest.icon}</span>
                                <span>{interest.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Travel Pace */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Travel Pace</label>
                    <div className="grid grid-cols-3 bg-gray-50 p-1 rounded-xl">
                        {['Relaxed', 'Balanced', 'Fast-Paced'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPace(p)}
                                className={`text-sm py-2 rounded-lg font-medium transition-all ${pace === p ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Generate Button */}
                <button
                    onClick={() => navigate('/itinerary')}
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                    <Sparkles size={18} />
                    Generate AI Itinerary
                </button>

            </div>
        </div>
    );
};

export default AITripCreator;
