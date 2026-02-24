import { LayoutDashboard, Map, Shield, Bookmark, User, Navigation } from 'lucide-react';
import { auth } from '../../services/firebase';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
    const location = useLocation();

    // Determine active state helper
    const isActive = (path) => {
        if (path === '/dashboard') return location.pathname === '/dashboard';
        return location.pathname.startsWith(path);
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: Map, label: 'My Trips', path: '/my-trips' },
        { icon: Shield, label: 'Safety Alerts', path: '/safety' },
        { icon: Navigation, label: 'Transport', path: '/transport' },
        { icon: Bookmark, label: 'Saved Places', path: '/saved' },
        { icon: User, label: 'Profile', path: '/profile' },
    ];

    return (
        <aside className="w-64 bg-slate-50/95 dark:bg-slate-900/40 backdrop-blur-lg border-r border-slate-200/50 dark:border-slate-800 flex flex-col h-full text-gray-600 dark:text-gray-400 shrink-0 transition-all duration-300">
            {/* Navigation */}
            <nav className="flex-1 px-3 py-6 space-y-2">
                {navItems.map((item) => (
                    <Link
                        key={item.label}
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium text-sm ${isActive(item.path)
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        <item.icon
                            size={20}
                            className={`${isActive(item.path) ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}
                        />
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>

            {/* Footer / Info */}
            <div className="p-4 border-t border-gray-100 dark:border-slate-800">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-800/50 rounded-xl p-4 border border-emerald-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-md">
                            <Shield size={12} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">Pro Tip</h4>
                    </div>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed font-medium">
                        Create an AI trip to get personalized safety alerts.
                    </p>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
