import React from 'react';
import { Phone } from 'lucide-react';

const EmergencyCard = ({ number, label }) => {
    return (
        <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl">
            <div className="flex items-start justify-between mb-4">
                <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Emergency Number</h3>
                <Phone className="w-5 h-5 text-emerald-500" />
            </div>

            <div className="text-2xl font-bold text-slate-900 mb-1">{number}</div>
            <div className="text-sm font-medium text-emerald-600 mb-8">{label}</div>

            <a href="#" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 underline decoration-2 underline-offset-2">
                View all local numbers
            </a>
        </div>
    );
};

export default EmergencyCard;
