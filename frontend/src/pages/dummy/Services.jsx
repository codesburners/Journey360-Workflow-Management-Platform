import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/layout/AppLayout';
import Footer from '../../components/layout/Footer';
import { Sparkles, Activity, Map, Users, Globe, Ticket, ArrowRight } from 'lucide-react';

const ServiceCard = ({ icon: Icon, title, desc, color, path, onAction }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (path) {
            navigate(path);
        } else if (onAction) {
            onAction();
        }
    };

    return (
        <div
            onClick={handleClick}
            className="group bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/20 dark:border-slate-700/50 rounded-[2rem] p-8 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:shadow-2xl hover:shadow-emerald-500/10 hover:border-emerald-500/50 hover:-translate-y-2 transition-all duration-500 cursor-pointer shadow-sm"
        >
            <div className={`w-16 h-16 rounded-2xl ${color} bg-opacity-20 dark:bg-opacity-30 flex items-center justify-center mb-8 group-hover:bg-opacity-40 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg shadow-emerald-500/5`}>
                <Icon size={32} className="text-white dark:text-white transition-transform drop-shadow-sm" />
            </div>
            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                {title}
                {!path && <span className="text-xs bg-gray-100/50 dark:bg-slate-900/50 text-gray-400 px-2 py-1 rounded-full border border-gray-200 dark:border-slate-700">Soon</span>}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6 min-h-[60px]">{desc}</p>
            <button className={`flex items-center gap-2 text-sm font-semibold  transition-colors ${color.replace('bg-', 'text-')}`}>
                {path ? 'Launch Tool' : 'Notify Me'} <ArrowRight size={16} className={!path ? 'opacity-50' : ''} />
            </button>
        </div>
    );
};

const Services = () => {
    const handleComingSoon = () => {
        alert("This feature is currently in development! Stay tuned for updates.");
    };

    const services = [
        {
            icon: Sparkles,
            title: "AI Trip Planner",
            desc: "Generate complete, personalized itineraries in seconds using our advanced Gemini AI engine.",
            color: "bg-emerald-500",
            path: "/dashboard"
        },
        {
            icon: Activity,
            title: "Safety Intelligence",
            desc: "Real-time safety scores, neighborhood analysis, and emergency alerts for any destination.",
            color: "bg-blue-500",
            path: "/safety"
        },
        {
            icon: Map,
            title: "Smart Navigation",
            desc: "Interactive maps with curated points of interest, hidden gems, and optimized routes.",
            color: "bg-teal-500",
            path: "/my-trips"
        },
        {
            icon: Users,
            title: "Community Hub",
            desc: "Connect with verified travelers, share experiences, and get tips from locals.",
            color: "bg-purple-500",
            onAction: handleComingSoon
        },
        {
            icon: Globe,
            title: "Visa Assistant",
            desc: "Automated visa requirements check and document preparation assistance.",
            color: "bg-orange-500",
            onAction: handleComingSoon
        },
        {
            icon: Ticket,
            title: "Instant Booking",
            desc: "Seamlessly book flights, hotels, and experiences directly from your itinerary.",
            color: "bg-pink-500",
            onAction: handleComingSoon
        }
    ];

    return (
        <AppLayout>
            <div className="bg-transparent min-h-screen flex flex-col">
                <div className="max-w-7xl mx-auto p-8 mb-20 flex-1">
                    <div className="text-center max-w-3xl mx-auto mb-16 pt-12">
                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-6">
                            Everything you need for the <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">perfect trip</span>
                        </h1>
                        <p className="text-xl text-gray-500 dark:text-gray-400">
                            Access our suite of AI-powered tools designed to make your journey safer, smarter, and more memorable.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {services.map((service, index) => (
                            <ServiceCard key={index} {...service} />
                        ))}
                    </div>
                </div>
                <Footer />
            </div>
        </AppLayout>
    );
};

export default Services;
