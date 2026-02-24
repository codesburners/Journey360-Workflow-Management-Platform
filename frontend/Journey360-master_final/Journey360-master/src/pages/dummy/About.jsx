import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../services/firebase';
import { BookOpen, Globe, Shield, Users, ArrowRight } from 'lucide-react';

const AboutContent = () => (
    <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
            <div>
                <h1 className="text-5xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
                    Redefining the <span className="text-emerald-600">Future of Travel</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed mb-8">
                    Journey360 is your premier AI-powered travel companion. We leverage cutting-edge technology to curate
                    personalized itineraries, provide real-time safety alerts, and manage your travel documents all in one place.
                </p>
                <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full text-emerald-700 font-semibold text-sm">
                        <Globe size={18} />
                        <span>Global Coverage</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full text-slate-700 font-semibold text-sm">
                        <Shield size={18} />
                        <span>AI Safety Insights</span>
                    </div>
                </div>
            </div>
            <div className="relative">
                <img
                    src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop"
                    alt="Adventure"
                    className="rounded-3xl shadow-2xl shadow-emerald-200/50 object-cover h-[400px] w-full"
                />
                <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 hidden md:block">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-600 rounded-xl text-white">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">10k+</p>
                            <p className="text-xs text-gray-500 font-medium">Active Travelers</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Blog / Insights Section */}
        <section className="mb-24">
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Travel Insights</h2>
                    <p className="text-gray-500">Expert tips and stories from the Journey360 community.</p>
                </div>
                <button className="hidden sm:flex items-center gap-2 text-emerald-600 font-bold hover:gap-3 transition-all">
                    View all blogs <ArrowRight size={20} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    {
                        title: "10 Hidden Gems in Japan to Visit in 2024",
                        image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070&auto=format&fit=crop",
                        category: "Destinations",
                        readTime: "5 min read"
                    },
                    {
                        title: "How AI is Changing the Way We Plan Trips",
                        image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop",
                        category: "Technology",
                        readTime: "8 min read"
                    },
                    {
                        title: "Safe Solo Travel: A Complete Guide for 2024",
                        image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=2070&auto=format&fit=crop",
                        category: "Safety",
                        readTime: "6 min read"
                    }
                ].map((blog, idx) => (
                    <article key={idx} className="group cursor-pointer">
                        <div className="relative overflow-hidden rounded-2xl mb-4 h-48">
                            <img
                                src={blog.image}
                                alt={blog.title}
                                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                                {blog.category}
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 leading-snug mb-2 group-hover:text-emerald-600 transition-colors">
                            {blog.title}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
                            <span className="flex items-center gap-1">
                                <BookOpen size={14} /> {blog.readTime}
                            </span>
                        </div>
                    </article>
                ))}
            </div>
        </section>

        {/* Mission Quote */}
        <section className="bg-slate-900 rounded-[40px] p-12 lg:p-20 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-slate-500 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2"></div>
            </div>
            <div className="relative z-10 max-w-3xl mx-auto">
                <span className="text-emerald-400 font-bold uppercase tracking-[0.2em] text-xs mb-6 block">Our Vision</span>
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-8 italic">
                    "Redefining the way the world moves, one journey at a time."
                </h2>
                <div className="w-20 h-1 bg-emerald-600 mx-auto rounded-full"></div>
            </div>
        </section>
    </div>
);

const About = () => {
    const navigate = useNavigate();

    useEffect(() => {
        if (auth.currentUser) {
            navigate('/dashboard', { replace: true });
        }
    }, [navigate]);

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex flex-col">
            <div className="flex-1 py-12">
                <AboutContent />
            </div>
            {/* Simple footer for guest view */}
            <footer className="py-6 text-center text-gray-400 text-sm border-t border-gray-100 bg-white/50 backdrop-blur-sm">
                © 2024 Journey360 AI. All rights reserved.
            </footer>
        </div>
    );
};

export default About;
