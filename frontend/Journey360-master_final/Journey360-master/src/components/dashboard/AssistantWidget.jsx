import React from 'react';
import { Bot } from 'lucide-react';
import { Link } from 'react-router-dom';

const AssistantWidget = () => {
    return (
        <div className="fixed bottom-8 right-8 z-50">
            <Link to="/assistant">
                <button className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg shadow-blue-600/20 transition-transform hover:scale-105 flex items-center justify-center">
                    <span className="sr-only">AI Assistant</span>
                    <Bot size={24} />
                </button>
            </Link>
        </div>
    );
};

export default AssistantWidget;
