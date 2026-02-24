import React from 'react';
import { ShieldAlert } from 'lucide-react';

const RiskLevelCard = ({ level, score, maxScore, description }) => {
    const percentage = (score / maxScore) * 100;

    return (
        <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/20 dark:border-slate-700/50 p-6 rounded-3xl shadow-sm">
            <div className="flex items-start justify-between mb-4">
                <h3 className="text-xs font-bold text-orange-500 dark:text-orange-400 uppercase tracking-widest">Current Risk Level</h3>
                <ShieldAlert className="w-5 h-5 text-orange-500 dark:text-orange-400" />
            </div>

            <div className="text-xl font-bold text-slate-900 dark:text-white mb-4">{level}</div>

            <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full mb-2 overflow-hidden">
                <div
                    className="h-full bg-orange-500 dark:bg-orange-400 rounded-full"
                    style={{ width: `${percentage}%` }}
                />
            </div>

            <div className="flex justify-end text-xs font-bold text-orange-500 dark:text-orange-400 mb-4">
                {score}/{maxScore}
            </div>

            <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed">
                {description}
            </p>
        </div>
    );
};

export default RiskLevelCard;
