import React from 'react';
import { Radio } from 'lucide-react';

const ActiveAlertsCard = ({ count, recentCount, description }) => {
    return (
        <div className="bg-[#FEF2F2] border border-red-100 p-6 rounded-3xl">
            <div className="flex items-start justify-between mb-4">
                <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest">Active Alerts</h3>
                <Radio className="w-5 h-5 text-red-500" />
            </div>

            <div className="text-2xl font-bold text-slate-900 mb-1">{count} Active</div>
            <div className="flex items-center gap-2 mb-6">
                <span className="text-sm font-bold text-red-500">+{recentCount} in the last hour</span>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
                {description}
            </p>
        </div>
    );
};

export default ActiveAlertsCard;
