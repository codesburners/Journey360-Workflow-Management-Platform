import React from 'react';
import { LayoutDashboard, Map, Bell, PlusSquare, Shield, MapPin } from 'lucide-react';

const SafetySidebar = () => {
    const menuItems = [
        { icon: LayoutDashboard, label: 'Overview', active: true },
        { icon: Map, label: 'Risk Map', active: false },
        { icon: Bell, label: 'Alert History', active: false },
        { icon: PlusSquare, label: 'Hospitals', active: false },
        { icon: Shield, label: 'Police Stations', active: false },
    ];

    return (
        <aside className="w-64 flex-shrink-0 pr-8 hidden lg:block">
            <div className="mb-8">
                <h2 className="text-lg font-bold text-slate-900">Safety Center</h2>
                <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
                    <MapPin className="w-3 h-3" />
                    <span>Paris, France</span>
                </div>
            </div>

            <nav className="space-y-1 mb-8">
                {menuItems.map((item) => (
                    <a
                        key={item.label}
                        href="#"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.active
                            ? 'bg-blue-50 text-blue-600 font-medium'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                    >
                        <item.icon className="w-5 h-5" />
                        {item.label}
                    </a>
                ))}
            </nav>

            <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Nearby Resource</h3>
                <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                    <div className="h-24 bg-slate-200 rounded-lg mb-3 overflow-hidden relative">
                        {/* Placeholder for map */}
                        <div className="absolute inset-0 bg-opacity-10 bg-blue-500 flex items-center justify-center text-slate-400 text-xs">
                            Map View
                        </div>
                    </div>
                    <div className="text-sm font-semibold text-slate-900">Hôpital de la Pitié-Salpêtrière</div>
                    <div className="text-xs text-slate-500 mt-1">47 Boulevard de l'Hôpital, 75013 Paris</div>
                </div>
            </div>
        </aside>
    );
};

export default SafetySidebar;
