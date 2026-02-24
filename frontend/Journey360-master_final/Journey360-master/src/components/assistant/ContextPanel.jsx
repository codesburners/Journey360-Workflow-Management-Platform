import React from 'react';
import { MapPin, Calendar, Sun, Plus } from 'lucide-react';

const ContextPanel = () => {
    return (
        <div className="w-full lg:w-96 flex-shrink-0 space-y-6">
            <h3 className="font-bold text-gray-900 text-lg">Next Activity</h3>

            {/* Map Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative h-48 group">
                <img
                    src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=600&h=400"
                    alt="Map Location"
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent flex flex-col justify-end p-4 text-white">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">Current Location</span>
                    <h4 className="font-bold text-lg">Park Hyatt Tokyo</h4>
                </div>
            </div>

            {/* Schedule Card */}
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                <div className="flex items-center gap-2 mb-4 text-blue-600 font-bold text-sm uppercase tracking-wide">
                    <Calendar size={16} />
                    <span>Schedule • Today</span>
                </div>

                <div className="space-y-6 relative">
                    {/* Timeline Line */}
                    <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-blue-200"></div>

                    <div className="relative pl-6">
                        <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white ring-1 ring-blue-200"></div>
                        <h5 className="font-bold text-gray-900 text-sm">Dinner at Sushi Shin</h5>
                        <p className="text-xs text-gray-500 mt-0.5">19:30 • 0.8km away</p>
                    </div>

                    <div className="relative pl-6">
                        <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-gray-300 border-2 border-white"></div>
                        <h5 className="font-medium text-gray-500 text-sm">Robot Restaurant Show</h5>
                        <p className="text-xs text-gray-400 mt-0.5">21:30 • Kabukicho</p>
                    </div>
                </div>
            </div>

            {/* Weather Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Weather in Tokyo</p>
                    <h4 className="text-3xl font-bold text-gray-900">22°C</h4>
                    <p className="text-xs text-gray-500 mt-1">High 24° • Low 18°</p>
                </div>
                <Sun className="text-orange-400 w-10 h-10" />
            </div>

            {/* Add Item Button */}
            <button className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 font-medium hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                <span>Add Item to Trip</span>
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
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
