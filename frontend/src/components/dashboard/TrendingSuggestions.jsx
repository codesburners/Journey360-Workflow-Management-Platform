import React from 'react';
import { ArrowRight } from 'lucide-react';

const TrendingSuggestions = ({ onSelectSuggestion }) => {
    const suggestions = [
        {
            name: "Santorini, Greece",
            desc: "Perfect for culture and relaxation during the shoulder season.",
            image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=600&auto=format&fit=crop",
            tag: "Popular",
            budget: 75, // High budget
            pace: "Relaxed",
            interests: ["culture", "relaxation", "photography"],
            displayBudget: "₹1.5L+"
        },
        {
            name: "Kyoto, Japan",
            desc: "Immerse yourself in cherry blossoms and ancient temples.",
            image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=600&auto=format&fit=crop",
            tag: "Trending",
            budget: 60, // Medium-High
            pace: "Balanced",
            interests: ["culture", "foodie", "photography"],
            displayBudget: "₹1.2L"
        },
        {
            name: "Reykjavik, Iceland",
            desc: "Chase the Northern Lights and explore dramatic landscapes.",
            image: "https://images.unsplash.com/photo-1476610182048-b716b8518aae?q=80&w=600&auto=format&fit=crop",
            tag: "Adventure",
            budget: 85, // Expensive
            pace: "Fast-Paced",
            interests: ["adventure", "photography"],
            displayBudget: "₹1.7L"
        }
    ];

    return (
        <div className="space-y-4">
            <h3 className="font-bold text-gray-900 text-lg dark:text-white">Trending Suggestions</h3>

            <div className="space-y-4">
                {suggestions.map((place) => (
                    <div key={place.name} className="relative h-48 rounded-2xl overflow-hidden group cursor-pointer shadow-sm transition-all hover:shadow-lg">
                        {/* Background Image */}
                        <img
                            src={place.image}
                            alt={place.name}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>

                        {/* Content */}
                        <div className="absolute bottom-0 left-0 right-0 p-5 space-y-2">
                            <div className="flex gap-2">
                                <span className="inline-block px-2 py-0.5 bg-white/20 backdrop-blur-md rounded text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">
                                    {place.tag}
                                </span>
                                <span className="inline-block px-2 py-0.5 bg-emerald-500/20 backdrop-blur-md rounded text-[10px] font-bold text-emerald-100 uppercase tracking-wider border border-emerald-500/20">
                                    {place.displayBudget}
                                </span>
                            </div>

                            <div>
                                <h4 className="text-xl font-bold text-white mb-0.5">{place.name}</h4>
                                <p className="text-xs text-gray-300 line-clamp-1">
                                    Best for: {place.interests.slice(0, 2).join(', ')}
                                </p>
                            </div>

                            <button
                                onClick={() => onSelectSuggestion && onSelectSuggestion(place)}
                                className="flex items-center gap-2 text-xs font-bold text-emerald-400 group/btn pt-1 hover:text-emerald-300 transition-colors uppercase tracking-wide"
                            >
                                Plan This Trip
                                <ArrowRight size={14} className="transition-transform group-hover/btn:translate-x-1" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TrendingSuggestions;
