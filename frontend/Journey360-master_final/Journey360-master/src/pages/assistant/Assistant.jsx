import React from 'react';
import AppLayout from '../../components/layout/AppLayout';
import ChatInterface from '../../components/assistant/ChatInterface';
import ContextPanel from '../../components/assistant/ContextPanel';

const Assistant = () => {
    return (
        <AppLayout>
            <div className="flex flex-col h-full overflow-hidden">
                {/* Page Header */}
                <div className="px-8 py-6 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <span className="text-gray-900 font-semibold">AI Travel Assistant</span>
                    </div>
                </div>

                {/* Main Content Area - Fixed height to allow internal scrolling */}
                <div className="flex-1 overflow-hidden">
                    <div className="h-full max-w-7xl mx-auto p-6 md:p-8 flex flex-col lg:flex-row gap-8">

                        {/* Left: Chat Interface (Flexible width) */}
                        <div className="flex-1 h-full min-h-0">
                            <ChatInterface />
                        </div>

                        {/* Right: Context Panel (Fixed width on desktop, stacked on mobile) */}
                        <div className="h-full overflow-y-auto overflow-x-hidden pr-2">
                            <ContextPanel />
                        </div>

                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default Assistant;
