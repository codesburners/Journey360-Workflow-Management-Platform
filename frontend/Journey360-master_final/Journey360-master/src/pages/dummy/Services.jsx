import React from 'react';
import AppLayout from '../../components/layout/AppLayout';

const Services = () => {
    return (
        <AppLayout>
            <div className="p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Our Services</h1>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                    <li>AI Trip Planning</li>
                    <li>Safety Alerts</li>
                    <li>Real-time Navigation</li>
                    <li>Community Recommendations</li>
                </ul>
                <p className="mt-4 text-sm text-gray-500">(This is a placeholder page).</p>
            </div>
        </AppLayout>
    );
};

export default Services;
