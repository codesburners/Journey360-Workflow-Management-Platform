import React from 'react';
import { Bell } from 'lucide-react';
import { auth } from '../../services/firebase';

const DashboardHeader = () => {
    const user = auth.currentUser;
    const email = user?.email || 'Traveler';
    const nameDisplay = email.split('@')[0];
    const avatarUrl = `https://ui-avatars.com/api/?name=${nameDisplay}&background=random`;

    return (
        <header className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Where to next, {nameDisplay}?</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Plan your next adventure with AI-powered precision and safety.</p>
            </div>


        </header>
    );
};

export default DashboardHeader;
