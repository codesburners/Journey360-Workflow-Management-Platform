import React, { useState, useEffect } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import { Bookmark, MapPin, Trash2, ExternalLink, Star } from 'lucide-react';
import { apiService } from '../../services/apiService';
import { auth } from '../../services/firebase';

const SavedPlaces = () => {
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const categories = ['All', 'Attraction', 'Hotel', 'Food', 'Other'];

    const filteredPlaces = places.filter(place => {
        const matchesSearch = place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (place.address && place.address.toLowerCase().includes(searchQuery.toLowerCase()));

        if (selectedCategory === 'All') return matchesSearch;

        const placeCategory = (place.category || "Other").toLowerCase();
        const selectedLower = selectedCategory.toLowerCase();

        return matchesSearch && placeCategory === selectedLower;
    });

    useEffect(() => {
        fetchSavedPlaces();
    }, []);

    const fetchSavedPlaces = async () => {
        try {
            setLoading(true);
            const data = await apiService.getSavedPlaces(auth);
            setPlaces(data);
        } catch (err) {
            console.error("Failed to fetch saved places:", err);
            setError("Failed to load your saved places.");
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (placeId) => {
        try {
            await apiService.removeSavedPlace(auth, placeId);
            setPlaces(places.filter(p => p.placeId !== placeId));
        } catch (err) {
            console.error("Failed to remove place:", err);
            alert("Failed to remove place. Please try again.");
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="p-8 flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Saved Places</h1>

                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search Input */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search saved places..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-64"
                            />
                            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        {/* Category Filter */}
                        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {!loading && places.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
                        <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-full mb-4">
                            <Bookmark size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No saved places yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm text-center">
                            Save interesting locations from your itineraries to see them here.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPlaces.map((place) => (
                            <div key={place.placeId} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden group hover:shadow-md transition-shadow">
                                <div className="h-48 bg-gray-200 dark:bg-slate-700 relative overflow-hidden">
                                    {place.image ? (
                                        <img src={place.image} alt={place.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <MapPin size={48} />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2">
                                        <button
                                            onClick={() => handleRemove(place.placeId)}
                                            className="p-2 bg-white/90 dark:bg-slate-900/90 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            title="Remove from saved"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white line-clamp-1">{place.name}</h3>
                                        {place.rating && (
                                            <div className="flex items-center gap-1 text-amber-500 text-sm font-medium">
                                                <Star size={14} fill="currentColor" />
                                                <span>{place.rating}</span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                                        {place.address || place.notes || "No additional details available."}
                                    </p>
                                    <div className="flex items-center justify-between mt-4">
                                        <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-md">
                                            {place.category || "Place"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
};

export default SavedPlaces;
