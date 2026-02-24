import React from 'react';
import AppLayout from '../../components/layout/AppLayout';

const Contact = () => {
    return (
        <AppLayout>
            <div className="p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Contact Us</h1>
                <p className="text-gray-600 mb-4">
                    Have questions? Reach out to our support team.
                </p>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-md">
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-gray-600 mb-4">support@journey360.ai</p>

                    <p className="text-sm font-medium text-gray-900">Phone</p>
                    <p className="text-gray-600">+1 (555) 123-4567</p>
                </div>
                <p className="mt-4 text-sm text-gray-500">(This is a placeholder page).</p>
            </div>
        </AppLayout>
    );
};

export default Contact;
