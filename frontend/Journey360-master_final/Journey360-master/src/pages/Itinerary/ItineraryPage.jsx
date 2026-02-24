import React, { useState } from 'react';
import {
    Search, MapPin, Calendar, MoreHorizontal, Plus, Minus,
    Navigation, Utensils, Flag, Star, Clock, Info, ChevronRight,
    Shield, Share, Save
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { itineraryData } from './data';
import AppLayout from '../../components/layout/AppLayout';

const TimelineEvent = ({ event, index, total }) => {
    return (
        <div className="flex gap-6 relative group">
            {/* Connector Line */}
            {index !== total - 1 && (
                <div className="absolute left-[19px] top-10 bottom-[-24px] w-0.5 bg-slate-200 group-hover:bg-blue-100 transition-colors"></div>
            )}

            {/* Number Badge */}
            <div className="relative z-10">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-sm border-2 border-white shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                    {event.id}
                </div>
            </div>

            {/* Content Card */}
            <div className="flex-1 pb-8">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-bold text-slate-900">{event.time}</span>
                        <div className="flex gap-2">
                            {event.badges?.map((badge, idx) => (
                                <span
                                    key={idx}
                                    className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md ${badge.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                                        badge.type === 'warning' ? 'bg-amber-50 text-amber-600' :
                                            'bg-blue-50 text-blue-600'
                                        }`}
                                >
                                    {badge.text}
                                </span>
                            ))}
                        </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {event.title}
                    </h3>

                    <p className="text-slate-500 text-sm leading-relaxed mb-4">
                        {event.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                        {event.category && (
                            <div className="flex items-center gap-1.5">
                                <Utensils className="w-3.5 h-3.5" />
                                <span>{event.category}</span>
                            </div>
                        )}
                        {event.price && (
                            <div className="flex items-center gap-1.5">
                                <span className="font-sans">€</span>
                                <span>{event.price}</span>
                            </div>
                        )}
                        {event.duration && (
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{event.duration}</span>
                            </div>
                        )}
                        {event.rating && (
                            <div className="flex items-center gap-1.5">
                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                <span>{event.rating}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ItineraryPage = () => {
    const { title, subtitle, costs, currentDay, days } = itineraryData;
    const [activeDay, setActiveDay] = useState(1);

    return (
        <AppLayout>
            <div className="bg-slate-50 font-sans text-slate-900 min-h-full">
                <main className="max-w-[1600px] mx-auto p-6 md:p-8">


                    {/* Breadcrumbs */}
                    <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                        <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                        <span className="hover:text-blue-600 transition-colors cursor-pointer">Destinations</span>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                        <span className="text-slate-900 font-medium">{title}</span>
                    </nav>

                    {/* Title Section */}
                    <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">{title}</h1>
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <Shield className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                                <span className="text-slate-600">AI Generated Optimized Route • High Safety Rating</span>
                            </div>
                        </div>

                        <div className="flex gap-4 overflow-x-auto pb-2 xl:pb-0">
                            {[
                                { label: "TRAVEL COST", value: `$${costs.travel}` },
                                { label: "FOOD COST", value: `$${costs.food}` },
                                { label: "STAY COST", value: `$${costs.stay}` }
                            ].map((stat, idx) => (
                                <div key={idx} className="bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm min-w-[130px]">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{stat.label}</div>
                                    <div className="text-xl font-bold text-slate-900">{stat.value}</div>
                                </div>
                            ))}

                            <button className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-600 font-bold rounded-xl border-2 border-blue-100 hover:bg-blue-100 transition-colors whitespace-nowrap">
                                <span className="text-lg">✨</span>
                                Regenerate with AI
                            </button>
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 h-[calc(100vh-280px)] min-h-[600px]">

                        {/* Left: Itinerary List */}
                        <div className="xl:col-span-5 h-full overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-slate-900">Itinerary Details</h2>
                                <div className="flex items-center gap-2">
                                    {days.map(day => (
                                        <button
                                            key={day.id}
                                            onClick={() => setActiveDay(day.id)}
                                            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${activeDay === day.id
                                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                                }`}
                                        >
                                            {day.label}
                                        </button>
                                    ))}
                                    <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-600">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex-1 overflow-y-auto custom-scrollbar">
                                <div className="mb-6">
                                    <div className="flex items-center gap-3 mb-1.5">
                                        <Calendar className="w-4 h-4 text-blue-500" />
                                        <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">{currentDay.date}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900">{currentDay.title}</h3>
                                </div>

                                <div className="pl-2">
                                    {currentDay.events.map((event, index) => (
                                        <TimelineEvent key={event.id} event={event} index={index} total={currentDay.events.length} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right: Map */}
                        <div className="xl:col-span-7 h-full relative group rounded-3xl overflow-hidden border border-slate-200 shadow-lg bg-slate-100">
                            {/* Map Placeholder */}
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center opacity-80 group-hover:opacity-100 transition-opacity">
                                {/* Fallback pattern if image fails */}
                                <div className="absolute inset-0 bg-slate-200 opacity-50" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                            </div>

                            {/* Map Controls */}
                            <div className="absolute top-6 left-6 flex flex-col gap-2">
                                <button className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-slate-700 hover:bg-slate-50 font-bold">
                                    <Plus className="w-5 h-5" />
                                </button>
                                <button className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-slate-700 hover:bg-slate-50 font-bold">
                                    <Minus className="w-5 h-5" />
                                </button>
                                <button className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-slate-700 hover:bg-slate-50 font-bold mt-2">
                                    <Navigation className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Map Markers (Simulated) */}
                            {currentDay.events.map((event, idx) => (
                                <div
                                    key={event.id}
                                    className="absolute transform -translate-x-1/2 -translate-y-full cursor-pointer hover:z-50 transition-all hover:scale-110"
                                    style={{
                                        top: `${40 + (idx * 15)}%`,
                                        left: `${40 + (idx * 10)}%`
                                    }}
                                >
                                    <div className="relative">
                                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shadow-lg border-2 border-white text-sm">
                                            {event.id}
                                        </div>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white px-3 py-1.5 rounded-lg shadow-xl text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            {event.title}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Live Route Insights Card */}
                            <div className="absolute bottom-6 right-6 w-80 bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-2xl border border-white/50">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
                                    <h3 className="font-bold text-slate-900">Live Route Insights</h3>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Total Distance</span>
                                        <span className="font-bold text-slate-900">4.2 km</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Walking Time</span>
                                        <span className="font-bold text-slate-900">52 mins</span>
                                    </div>

                                    <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-xs text-slate-600 italic leading-relaxed">
                                            "AI Tip: Use the 'Batobus' water taxi between Step 2 and 4 to save 15 mins of walking."
                                        </p>
                                    </div>
                                </div>
                            </div>

                        </div>

                    </div>
                </main>
            </div>
        </AppLayout>
    );
};

export default ItineraryPage;
