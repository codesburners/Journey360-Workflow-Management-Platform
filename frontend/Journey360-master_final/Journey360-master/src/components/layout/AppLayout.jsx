import React from 'react';
import Sidebar from './Sidebar';
import DashboardNavbar from './DashboardNavbar';
import AssistantWidget from '../dashboard/AssistantWidget';

const AppLayout = ({ children }) => {
    return (
        <div className="h-screen bg-gray-50 dark:bg-slate-950 font-sans flex flex-col overflow-hidden transition-colors duration-300">
            <DashboardNavbar />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                    <div className="flex-1 overflow-auto">
                        {children}
                    </div>
                    <AssistantWidget />
                </main>
            </div>
        </div>
    );
};

export default AppLayout;
