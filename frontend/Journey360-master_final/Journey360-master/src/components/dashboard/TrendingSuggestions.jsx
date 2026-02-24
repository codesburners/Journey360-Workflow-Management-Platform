import React from 'react';
import { ArrowRight } from 'lucide-react';

const TrendingSuggestions = () => {
    return (
        <div className="space-y-4">
            <h3 className="font-bold text-gray-900 text-lg">Trending Suggestions</h3>

            {/* Santorini Card */}
            <div className="relative h-96 rounded-3xl overflow-hidden group cursor-pointer shadow-sm">
                {/* Background Image */}
                {/* Background Image */}
                <img
                    src="https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=600&auto=format&fit=crop"
                    alt="Santorini, Greece"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
                    <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs font-semibold text-white uppercase tracking-wider border border-white/10">
                        Popular
                    </span>

                    <div>
                        <h4 className="text-2xl font-bold text-white">Santorini, Greece</h4>
                        <p className="text-sm text-gray-300 line-clamp-2 mt-2">
                            Perfect for culture and relaxation during the shoulder season.
                        </p>
                    </div>

                    <button className="flex items-center gap-2 text-sm font-semibold text-white group/btn">
                        View Guide
                        <ArrowRight size={16} className="transition-transform group-hover/btn:translate-x-1" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TrendingSuggestions;
