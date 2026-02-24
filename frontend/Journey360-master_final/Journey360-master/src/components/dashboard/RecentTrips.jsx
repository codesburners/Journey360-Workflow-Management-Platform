import React from 'react';
import { MapPin } from 'lucide-react';

const RecentTrips = () => {
    const trips = [
        {
            id: 1,
            title: "Tuscany Getaway",
            dates: "Oct 12 - Oct 18, 2023",
            safetyLevel: "High",
            image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&q=80&w=300&h=200", // Placeholder
        },
        {
            id: 2,
            title: "Urban Singapore",
            dates: "Aug 05 - Aug 12, 2023",
            safetyLevel: "High",
            image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&q=80&w=300&h=200", // Placeholder
        }
    ];

    return (
        <div className="space-y-4">
            <h3 className="font-bold text-gray-900 text-lg">Recent Trips</h3>
            <div className="space-y-4">
                {trips.map((trip) => (
                    <div key={trip.id} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-4 hover:shadow-md transition-shadow cursor-pointer">
                        <img src={trip.image} alt={trip.title} className="w-20 h-20 rounded-xl object-cover" />
                        <div className="flex flex-col justify-center">
                            <h4 className="font-bold text-gray-900 text-sm">{trip.title}</h4>
                            <p className="text-xs text-gray-500 mb-2">{trip.dates}</p>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                <span className="text-[10px] font-bold text-green-600 uppercase tracking-wide">Safety Level: {trip.safetyLevel}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentTrips;
