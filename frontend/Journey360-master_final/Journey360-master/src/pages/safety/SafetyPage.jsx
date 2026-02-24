import React from 'react';
import { Bell } from 'lucide-react';
import RiskLevelCard from '../../components/safety/RiskLevelCard';
import EmergencyCard from '../../components/safety/EmergencyCard';
import ActiveAlertsCard from '../../components/safety/ActiveAlertsCard';
import AlertList from '../../components/safety/AlertList';
import AppLayout from '../../components/layout/AppLayout';
import { safetyData } from './data';



const SafetyPage = () => {
    return (
        <AppLayout>
            <div className="bg-white font-sans text-slate-900 min-h-full">
                <main className="flex-1 p-8">
                    <div className="mb-8">
                        <p className="text-slate-500 text-sm mb-1">Real-time safety monitoring powered by Journey360 AI. Stay informed, stay safe.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                        <RiskLevelCard
                            level={safetyData.riskLevel.status}
                            score={safetyData.riskLevel.score}
                            maxScore={safetyData.riskLevel.maxScore}
                            description={safetyData.riskLevel.description}
                        />
                        <EmergencyCard
                            number={safetyData.emergency.number}
                            label={safetyData.emergency.label}
                        />
                        <ActiveAlertsCard
                            count={safetyData.activeAlerts.total}
                            recentCount={safetyData.activeAlerts.recent}
                            description={safetyData.activeAlerts.description}
                        />
                    </div>

                    <AlertList alerts={safetyData.alerts} />

                    <div className="mt-12 bg-blue-50/50 rounded-3xl p-8 border border-blue-100/50">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                                <span className="font-bold">AI</span>
                            </div>
                            <h3 className="text-base font-bold text-slate-900">{safetyData.aiInsight.title}</h3>
                        </div>
                        <p className="text-slate-600 leading-relaxed max-w-3xl">
                            {safetyData.aiInsight.text}
                        </p>
                    </div>

                </main>
            </div>

            {/* Sticky Emergency Button for mobile */}
            <div className="lg:hidden fixed bottom-6 left-6 right-6">
                <button className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-red-500/30 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    EMERGENCY SOS
                </button>
            </div>
        </AppLayout>
    );
};

export default SafetyPage;
