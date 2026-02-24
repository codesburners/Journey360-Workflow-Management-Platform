import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Globe, Shield, Users, ArrowRight, Linkedin } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Footer from '../../components/layout/Footer';
import aaronImage from '../../assets/images/aaron.jpg';
import gowthamImage from '../../assets/images/gowtham.jpg';
import karthikImage from '../../assets/images/karthik_new.jpg';
import sandhiyaImage from '../../assets/images/sandhiya.png';

const AboutContent = () => {
    return (
        <div className="max-w-6xl mx-auto px-6 py-12">
            {/* Hero Section */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
                <div>
                    <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight leading-tight">
                        Redefining the <span className="text-emerald-600 dark:text-emerald-400">Future of Travel</span>
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
                        Journey360 is your premier AI-powered travel companion. We leverage cutting-edge technology to curate
                        personalized itineraries, provide real-time safety alerts, and manage your travel documents all in one place.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-full text-emerald-700 dark:text-emerald-400 font-semibold text-sm border border-emerald-100 dark:border-emerald-800/50">
                            <Globe size={18} />
                            <span>Global Coverage</span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/50 px-4 py-2 rounded-full text-slate-700 dark:text-gray-300 font-semibold text-sm border border-slate-200 dark:border-slate-700">
                            <Shield size={18} />
                            <span>AI Safety Insights</span>
                        </div>
                    </div>
                </div>
                <div className="relative">
                    <img
                        src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop"
                        alt="Adventure"
                        className="rounded-3xl shadow-2xl shadow-emerald-200/50 dark:shadow-emerald-900/20 object-cover h-[400px] w-full border border-white/10"
                    />
                    <div className="absolute -bottom-6 -left-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 hidden md:block">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-emerald-600 dark:bg-emerald-500 rounded-xl text-white">
                                <Users size={24} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">10k+</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Active Travelers</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Blog / Insights Section */}
            <section className="mb-24">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Travel Insights</h2>
                        <p className="text-gray-500 dark:text-gray-400">Expert tips and stories from the Journey360 community.</p>
                    </div>
                    <button className="hidden sm:flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold hover:gap-3 transition-all">
                        View all blogs <ArrowRight size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        {
                            id: "hidden-gems-japan",
                            title: "10 Hidden Gems in Japan to Visit in 2024",
                            image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070&auto=format&fit=crop",
                            category: "Destinations",
                            readTime: "5 min read"
                        },
                        {
                            id: "ai-travel-planning",
                            title: "How AI is Changing the Way We Plan Trips",
                            image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop",
                            category: "Technology",
                            readTime: "8 min read"
                        },
                        {
                            id: "safe-solo-travel",
                            title: "Safe Solo Travel: A Complete Guide for 2024",
                            image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=2070&auto=format&fit=crop",
                            category: "Safety",
                            readTime: "6 min read"
                        }
                    ].map((blog, idx) => (
                        <Link
                            key={idx}
                            to={`/blog/${blog.id}`}
                            className="group block cursor-pointer"
                        >
                            <article className="h-full bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm rounded-2xl p-4 border border-white/20 dark:border-slate-800 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all">
                                <div className="relative overflow-hidden rounded-xl mb-4 h-48">
                                    <img
                                        src={blog.image}
                                        alt={blog.title}
                                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                        {blog.category}
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-snug mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                    {blog.title}
                                </h3>
                                <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 font-medium">
                                    <span className="flex items-center gap-1">
                                        <BookOpen size={14} /> {blog.readTime}
                                    </span>
                                </div>
                            </article>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Developers Team Section */}
            <section className="mb-24">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Our Developers Team</h2>
                        <p className="text-gray-500 dark:text-gray-400">The architects behind the world's smartest travel companion.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        {
                            name: "Aaron Alphons Thomas",
                            image: aaronImage,
                            linkedin: "https://www.linkedin.com/in/aaron-alphons-thomas",
                            imgStyle: { objectPosition: "center 15%", transform: "scale(2.2)" }
                        },
                        {
                            name: "Gowtham G",
                            image: gowthamImage,
                            linkedin: "https://www.linkedin.com/in/gowtham-g-b38241338",
                            imgStyle: { objectPosition: "center 35%", transform: "scale(2.4)" }
                        },
                        {
                            name: "Kaarthik M",
                            image: karthikImage,
                            linkedin: "https://www.linkedin.com/in/kaarthik-m-47198728a",
                            imgStyle: { objectPosition: "center top", transform: "scale(2.4) translateY(15px)" }
                        },
                        {
                            name: "Sandhiya Umapathi",
                            image: sandhiyaImage,
                            linkedin: "https://www.linkedin.com/in/sandhiyaumapathi/",
                            imgStyle: { objectPosition: "center center", transform: "scale(0.9)" }
                        }
                    ].map((dev, idx) => (
                        <div key={idx} className="bg-white/95 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 text-center border-t border-l border-white dark:border-slate-800 shadow-[0_15px_50px_rgba(0,0,0,0.03)] dark:shadow-none hover:shadow-[0_30px_60px_rgba(16,185,129,0.12)] hover:scale-[1.03] hover:-translate-y-2 transition-all duration-500 group flex flex-col items-center">
                            <div className="relative w-36 h-36 mb-8 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl transition-all duration-500">
                                <div className="absolute inset-0 bg-emerald-100 dark:bg-emerald-900/30 blur-xl opacity-50"></div>
                                <img
                                    src={dev.image}
                                    alt={dev.name}
                                    style={dev.imgStyle || {}}
                                    className="relative w-full h-full object-cover"
                                />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                {dev.name}
                            </h3>

                            <a
                                href={dev.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-auto inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-white transition-all duration-300 border border-transparent hover:border-emerald-100 dark:hover:border-emerald-500/30 shadow-sm"
                            >
                                <Linkedin size={20} />
                            </a>
                        </div>
                    ))}
                </div>
            </section>

            {/* Mission Quote */}
            <section className="bg-slate-900 dark:bg-slate-950/80 rounded-[40px] p-12 lg:p-20 text-center relative overflow-hidden border border-white/5">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-slate-500 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2"></div>
                </div>
                <div className="relative z-10 max-w-3xl mx-auto">
                    <span className="text-emerald-400 font-bold uppercase tracking-[0.2em] text-xs mb-6 block">Our Vision</span>
                    <h2 className="text-3xl lg:text-4xl font-bold text-white mb-8 italic">
                        "Redefining the way the world moves, one journey at a time."
                    </h2>
                    <div className="w-20 h-1 bg-emerald-600 dark:bg-emerald-500 mx-auto rounded-full"></div>
                </div>
            </section>
        </div>
    );
};

const About = () => {
    return (
        <AppLayout>
            <div className="min-h-screen bg-transparent flex flex-col">
                <div className="flex-1 py-12">
                    <AboutContent />
                </div>
                <Footer />
            </div>
        </AppLayout>
    );
};

export default About;
