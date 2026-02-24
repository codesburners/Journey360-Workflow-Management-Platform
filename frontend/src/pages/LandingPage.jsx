import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Map, Globe, Shield, Star, ChevronRight, CheckCircle2 } from 'lucide-react';
import Footer from '../components/layout/Footer'; // We'll create this later or mock it inline for now

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            {/* Hero Section */}
            <header className="relative h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2021&q=80"
                        alt="Travel Background"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-white"></div>
                </div>

                <div className="relative z-10 container mx-auto px-6 text-center text-white">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8 animate-fade-in-up">
                        <Sparkles className="w-4 h-4 text-yellow-300" />
                        <span className="text-sm font-medium tracking-wide">AI-Powered Travel Planning</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight drop-shadow-lg">
                        Your Journey, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300">Perfectly Planned.</span>
                    </h1>

                    <p className="text-lg md:text-2xl text-slate-200 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
                        Generate personalized itineraries, estimate budgets, and discover hidden gems in seconds with Journey360 AI.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button
                            onClick={() => navigate('/signup')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-bold py-4 px-10 rounded-full shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1"
                        >
                            Start Planning Free
                        </button>
                        <button
                            onClick={() => {
                                const element = document.getElementById('features');
                                element?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/30 text-lg font-bold py-4 px-10 rounded-full transition-all"
                        >
                            How it Works
                        </button>
                    </div>
                </div>
            </header>

            {/* Features Section */}
            <section id="features" className="py-24 bg-white">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 mb-4">
                            Why Travelers Love Journey360
                        </h2>
                        <p className="text-slate-500 max-w-xl mx-auto text-lg">
                            We solve the chaos of travel planning by combining smart AI with real-time data.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12">
                        {[
                            {
                                icon: <Sparkles className="w-8 h-8 text-teal-600" />,
                                title: "AI Itineraries",
                                desc: "Tell us where and when, and get a complete day-by-day plan instantly."
                            },
                            {
                                icon: <Globe className="w-8 h-8 text-emerald-600" />,
                                title: "Smart Budgeting",
                                desc: "Real-time cost estimates in your local currency so you never overspend."
                            },
                            {
                                icon: <Map className="w-8 h-8 text-teal-600" />,
                                title: "Interactive Maps",
                                desc: "Visualize your route with integrated maps for hotels, food, and attractions."
                            }
                        ].map((feature, i) => (
                            <div key={i} className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl transition-all duration-300 group">
                                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-slate-900">{feature.title}</h3>
                                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Social Proof / Stats */}
            <section className="py-20 bg-slate-900 text-white overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-600 blur-[100px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-teal-600 blur-[100px]"></div>
                </div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                                Joined by <span className="text-emerald-400">10,000+</span> <br />
                                happy travelers.
                            </h2>
                            <p className="text-slate-400 text-lg mb-8">
                                From weekend getaways to month-long expeditions, Journey360 is the trusted companion for modern explorers.
                            </p>
                            <div className="space-y-4">
                                {["Free optimized routes", "No hidden fees", "Save 10+ hours of planning"].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                        <span className="font-medium">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10">
                            <div className="flex gap-1 mb-4">
                                {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-5 h-5 text-amber-400 fill-amber-400" />)}
                            </div>
                            <p className="text-lg italic text-slate-200 mb-6">
                                "I usually stress about planning trips, but Journey360 made it fun. The AI suggestions were spot on, and the budget tool saved me tons of money!"
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center font-bold text-lg">
                                    S
                                </div>
                                <div>
                                    <p className="font-bold">Sarah Jenkins</p>
                                    <p className="text-xs text-slate-400">Traveled to Japan</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-white text-center">
                <div className="container mx-auto px-6 max-w-4xl">
                    <h2 className="text-4xl font-bold text-slate-900 mb-6">Ready to start your adventure?</h2>
                    <p className="text-lg text-slate-500 mb-10">
                        Join thousands of travelers planning smarter, not harder. It's free to get started.
                    </p>
                    <button
                        onClick={() => navigate('/signup')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xl font-bold py-4 px-12 rounded-full shadow-xl hover:shadow-emerald-500/25 transition-all transform hover:-translate-y-1"
                    >
                        Create My Itinerary
                    </button>
                    <p className="mt-6 text-sm text-slate-400">No credit card required • Instant access</p>
                </div>
            </section>
            <Footer />
        </div>
    );
};

export default LandingPage;
