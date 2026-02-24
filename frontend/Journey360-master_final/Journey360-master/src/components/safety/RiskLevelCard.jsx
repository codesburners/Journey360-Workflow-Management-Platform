import React from 'react';
import { ShieldAlert } from 'lucide-react';

const RiskLevelCard = ({ level, score, maxScore, description }) => {
    const percentage = (score / maxScore) * 100;

    return (
        <div className="bg-[#FFF8F0] border border-orange-100 p-6 rounded-3xl">
            <div className="flex items-start justify-between mb-4">
                <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest">Current Risk Level</h3>
                <ShieldAlert className="w-5 h-5 text-orange-400" />
            </div>

            <div className="text-xl font-bold text-slate-900 mb-4">{level}</div>

            <div className="w-full h-2 bg-gray-200 rounded-full mb-2 overflow-hidden">
                <div
                    className="h-full bg-orange-400 rounded-full"
                    style={{ width: `${percentage}%` }}
                />
            </div>

            <div className="flex justify-end text-xs font-bold text-orange-400 mb-4">
                {score}/{maxScore}
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
                {description}
            </p>
        </div>
    );
};

export default RiskLevelCard;
