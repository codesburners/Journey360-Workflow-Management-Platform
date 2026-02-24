import React from 'react';
import { Radio } from 'lucide-react';

const ActiveAlertsCard = ({ count, recentCount, description }) => {
    return (
        <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/20 dark:border-slate-700/50 p-6 rounded-3xl shadow-sm">
            <div className="flex items-start justify-between mb-4">
                <h3 className="text-xs font-bold text-red-500 tracking-widest uppercase">Active Alerts</h3>
                <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            </div>

            <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{count} Active</div>
            <div className="flex items-center gap-2 mb-6">
                <span className="text-sm font-bold text-red-500">+{recentCount} in the last hour</span>
            </div>

            <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed">
                {description}
            </p>
        </div>
    );
};

export default ActiveAlertsCard;
