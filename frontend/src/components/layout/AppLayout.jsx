import React from 'react';
import Sidebar from './Sidebar';
import DashboardNavbar from './DashboardNavbar';
import AssistantWidget from '../dashboard/AssistantWidget';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { auth } from '../../services/firebase';

const AppLayout = ({ children }) => {
    const { theme } = useTheme();
    const location = useLocation();
    const user = auth.currentUser;
    const isAssistantPage = location.pathname === '/assistant';
    const isDark = theme === 'dark';

    // If no user is logged in, we render a simplified layout (just the background and content)
    // The public Navbar is handled by App.jsx
    if (!user) {
        return (
            <div
                className="min-h-screen font-sans flex flex-col transition-colors duration-300"
                style={{
                    backgroundImage: `url('/travel_bg.png')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed',
                    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.82)' : '#f8fafc',
                    backgroundBlendMode: isDark ? 'soft-light' : 'normal'
                }}
            >
                <div className={`flex flex-1 backdrop-blur-[4px] ${isDark ? 'bg-slate-950/40' : 'bg-slate-50/50'}`}>
                    <main className="flex-1 flex flex-col min-w-0 relative">
                        {children}
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div
            className="h-screen font-sans flex flex-col overflow-hidden transition-colors duration-300"
            style={{
                backgroundImage: `url('/travel_bg.png')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                backgroundColor: isDark ? 'rgba(15, 23, 42, 0.82)' : '#f8fafc',
                backgroundBlendMode: isDark ? 'soft-light' : 'normal'
            }}
        >
            <DashboardNavbar />
            <div className={`flex flex-1 overflow-hidden backdrop-blur-[4px] ${isDark ? 'bg-slate-950/40' : 'bg-slate-50/50'}`}>
                <Sidebar />
                <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                    <div className="flex-1 overflow-auto">
                        {children}
                    </div>
                    {!isAssistantPage && <AssistantWidget />}
                </main>
            </div>
        </div>
    );
};

export default AppLayout;
