import React from 'react';
import { Shield, Lock, Scale, FileText, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsOfService = () => {
    const sections = [
        {
            title: "1. Acceptance of Terms",
            icon: Scale,
            content: "By accessing and using Journey360, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services."
        },
        {
            title: "2. User Responsibilities",
            icon: FileText,
            content: "You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account. You agree to use the service for lawful purposes only."
        },
        {
            title: "3. AI-Generated Content",
            icon: Shield,
            content: "Journey360 uses artificial intelligence to generate travel itineraries and safety advice. While we strive for accuracy, these are suggestions and should be verified. We are not liable for any issues arising from the use of AI-generated content."
        },
        {
            title: "4. Privacy & Data",
            icon: Lock,
            content: "Your privacy is important to us. Please refer to our Privacy Policy to understand how we collect, use, and protect your personal information."
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-12">
            <div className="max-w-4xl mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
                        Terms of <span className="text-emerald-600">Service</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
                        Last updated: January 2026. Please read these terms carefully before using the Journey360 platform.
                    </p>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {sections.map((section, index) => (
                        <div
                            key={index}
                            className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-all duration-300 group"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                                    <section.icon size={24} />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                        {section.title}
                                    </h2>
                                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                        {section.content}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer section */}
                <div className="mt-16 p-8 bg-emerald-600 rounded-3xl text-white text-center shadow-xl shadow-emerald-600/20 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                    <h2 className="text-2xl font-bold mb-4">Have questions about our terms?</h2>
                    <p className="text-emerald-50 mb-8 max-w-xl mx-auto opacity-90">
                        Our support team is here to help you understand your rights and responsibilities.
                    </p>
                    <Link
                        to="/contact"
                        className="inline-flex items-center gap-2 bg-white text-emerald-600 px-8 py-3 rounded-xl font-bold hover:bg-emerald-50 transition-colors shadow-lg"
                    >
                        Contact Support <ChevronRight size={18} />
                    </Link>
                </div>

                {/* Back Link */}
                <div className="text-center mt-12">
                    <Link to="/" className="text-slate-400 hover:text-emerald-600 transition-colors font-medium">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
