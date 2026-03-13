import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../../services/firebase';
import {
    Plane, Shield, MessageCircle, Bookmark,
    MapPin, Calendar, Globe, TrendingUp, Sparkles
} from 'lucide-react';
import { apiService } from '../../services/apiService';

const DashboardHeader = () => {
    const user = auth.currentUser;
    const email = user?.email || 'Traveler';
    const nameDisplay = email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);

    const [tripCount, setTripCount] = useState(0);

    // Time-based greeting
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const emoji = hour < 12 ? '🌅' : hour < 17 ? '☀️' : '🌙';

    useEffect(() => {
        const fetchTripCount = async () => {
            try {
                const trips = await apiService.listTrips(auth);
                setTripCount(Array.isArray(trips) ? trips.length : 0);
            } catch {
                setTripCount(0);
            }
        };
        fetchTripCount();
    }, []);

    const quickActions = [
        { label: 'New Trip', icon: Plane, path: null, color: 'from-indigo-500 to-indigo-600', shadowColor: 'shadow-indigo-500/25', action: 'scroll' },
        { label: 'Safety', icon: Shield, path: '/safety', color: 'from-emerald-500 to-emerald-600', shadowColor: 'shadow-emerald-500/25' },
        { label: 'Assistant', icon: MessageCircle, path: '/assistant', color: 'from-violet-500 to-violet-600', shadowColor: 'shadow-violet-500/25' },
        { label: 'Saved', icon: Bookmark, path: '/saved', color: 'from-amber-500 to-amber-600', shadowColor: 'shadow-amber-500/25' },
    ];

    const stats = [
        { label: 'Total Trips', value: tripCount, icon: MapPin, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'This Month', value: new Date().toLocaleString('default', { month: 'short' }), icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'AI Assist', value: 'Active', icon: Sparkles, color: 'text-violet-600', bg: 'bg-violet-50' },
    ];

    return (
        <header className="mb-8">
            {/* Greeting Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {greeting}, {nameDisplay} {emoji}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Ready to plan your next adventure? Let our AI guide the way.
                    </p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-white rounded-xl border border-slate-200/80 p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
                        <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}>
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                            <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-gray-400 mr-1">Quick actions</span>
                {quickActions.map((action) => {
                    const content = (
                        <span className={`inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r ${action.color} text-white rounded-xl text-sm font-semibold shadow-lg ${action.shadowColor} hover:scale-[1.03] active:scale-95 transition-all cursor-pointer`}>
                            <action.icon className="w-4 h-4" />
                            {action.label}
                        </span>
                    );
                    if (action.path) {
                        return <Link key={action.label} to={action.path}>{content}</Link>;
                    }
                    return <span key={action.label} onClick={() => {
                        document.querySelector('#ai-trip-creator')?.scrollIntoView({ behavior: 'smooth' });
                    }}>{content}</span>;
                })}
            </div>
        </header>
    );
};

export default DashboardHeader;
