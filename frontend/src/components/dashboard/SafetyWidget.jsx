import React from 'react';
import { ShieldCheck } from 'lucide-react';

const SafetyWidget = () => {
    return (
        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-teal-500/20">
            {/* Background decoration */}
            <ShieldCheck className="absolute -right-6 -bottom-6 text-white/10 w-40 h-40 transform rotate-12" />

            <div className="relative z-10 max-w-lg">
                <h3 className="text-xl font-bold mb-2">Safety First Guarantee</h3>
                <p className="text-teal-50 text-sm leading-relaxed">
                    Our AI cross-references global travel advisories in real-time to ensure your adventure is as safe as it is exciting.
                </p>
            </div>
        </div>
    );
};

export default SafetyWidget;
