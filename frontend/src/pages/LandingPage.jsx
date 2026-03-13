import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Map, Globe, Shield, Star, CheckCircle2, ArrowRight, Compass, Zap, Eye, MessageCircle } from 'lucide-react';
import Footer from '../components/layout/Footer';

// Animated counter hook
const useCountUp = (target, duration = 2000) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const counted = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !counted.current) {
                    counted.current = true;
                    const start = Date.now();
                    const animate = () => {
                        const elapsed = Date.now() - start;
                        const progress = Math.min(elapsed / duration, 1);
                        const eased = 1 - Math.pow(1 - progress, 3);
                        setCount(Math.floor(eased * target));
                        if (progress < 1) requestAnimationFrame(animate);
                    };
                    animate();
                }
            },
            { threshold: 0.5 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [target, duration]);

    return { count, ref };
};

const LandingPage = () => {
    const navigate = useNavigate();

    const stat1 = useCountUp(10000);
    const stat2 = useCountUp(50);
    const stat3 = useCountUp(98);
    const stat4 = useCountUp(24);

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            {/* Hero Section */}
            <header className="relative h-[92vh] min-h-[640px] flex items-center justify-center overflow-hidden">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2021&q=80"
                        alt="Travel Background"
                        className="w-full h-full object-cover"
                        loading="eager"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-white"></div>
                </div>

                <div className="relative z-10 container mx-auto px-6 text-center text-white">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8" style={{ animation: 'fadeInUp 0.6s ease-out' }}>
                        <Sparkles className="w-4 h-4 text-yellow-300" />
                        <span className="text-sm font-medium tracking-wide">Powered by Google Gemini AI</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight drop-shadow-lg" style={{ animation: 'fadeInUp 0.8s ease-out' }}>
                        Your Journey, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-violet-300 to-cyan-300">Perfectly Planned.</span>
                    </h1>

                    <p className="text-lg md:text-2xl text-slate-200 mb-10 max-w-2xl mx-auto leading-relaxed font-light" style={{ animation: 'fadeInUp 1s ease-out' }}>
                        Generate personalized itineraries, navigate with AR, and travel safer — all in one platform.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center" style={{ animation: 'fadeInUp 1.2s ease-out' }}>
                        <button
                            onClick={() => navigate('/signup')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold py-4 px-10 rounded-full shadow-xl shadow-indigo-500/30 hover:shadow-2xl transition-all transform hover:-translate-y-1 flex items-center gap-2"
                        >
                            Start Planning Free
                            <ArrowRight className="w-5 h-5" />
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

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
                    <div className="w-6 h-10 rounded-full border-2 border-white/40 flex justify-center pt-2">
                        <div className="w-1 h-2 bg-white/60 rounded-full"></div>
                    </div>
                </div>
            </header>

            {/* Animated Stats Bar */}
            <section className="py-12 bg-slate-50 border-y border-slate-200/60">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { value: stat1.count, ref: stat1.ref, suffix: '+', label: 'Happy Travelers', icon: '🌍' },
                            { value: stat2.count, ref: stat2.ref, suffix: '+', label: 'Countries Covered', icon: '🗺️' },
                            { value: stat3.count, ref: stat3.ref, suffix: '%', label: 'Satisfaction Rate', icon: '⭐' },
                            { value: stat4.count, ref: stat4.ref, suffix: '/7', label: 'AI Availability', icon: '🤖' },
                        ].map((stat, i) => (
                            <div key={i} ref={stat.ref} className="group">
                                <div className="text-3xl mb-1">{stat.icon}</div>
                                <div className="text-3xl md:text-4xl font-black text-slate-900">
                                    {stat.value.toLocaleString()}{stat.suffix}
                                </div>
                                <p className="text-sm text-slate-500 font-medium mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-white">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-20">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-sm font-semibold mb-4">
                            <Zap className="w-4 h-4" />
                            Core Features
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
                            Everything you need to <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">travel smarter</span>
                        </h2>
                        <p className="text-slate-500 max-w-xl mx-auto text-lg">
                            AI-powered planning meets real-time safety and AR navigation — all in one platform.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Sparkles className="w-7 h-7" />,
                                title: "AI Itineraries",
                                desc: "Tell us where and when, and get a complete day-by-day plan instantly — powered by Gemini AI.",
                                color: 'from-indigo-500 to-indigo-600',
                                bgLight: 'bg-indigo-50',
                                textColor: 'text-indigo-600'
                            },
                            {
                                icon: <Globe className="w-7 h-7" />,
                                title: "Smart Budgeting",
                                desc: "Real-time cost estimates in your local currency so you never overspend.",
                                color: 'from-emerald-500 to-emerald-600',
                                bgLight: 'bg-emerald-50',
                                textColor: 'text-emerald-600'
                            },
                            {
                                icon: <Map className="w-7 h-7" />,
                                title: "Interactive Maps",
                                desc: "Visualize your route with integrated maps for hotels, food, and attractions.",
                                color: 'from-cyan-500 to-cyan-600',
                                bgLight: 'bg-cyan-50',
                                textColor: 'text-cyan-600'
                            },
                            {
                                icon: <Eye className="w-7 h-7" />,
                                title: "AR Navigation",
                                desc: "Navigate in the real world with augmented reality arrows and markers on your phone.",
                                color: 'from-violet-500 to-violet-600',
                                bgLight: 'bg-violet-50',
                                textColor: 'text-violet-600'
                            },
                            {
                                icon: <Shield className="w-7 h-7" />,
                                title: "Safety Engine",
                                desc: "Live risk assessment from global news, travel advisories, and local reports.",
                                color: 'from-rose-500 to-rose-600',
                                bgLight: 'bg-rose-50',
                                textColor: 'text-rose-600'
                            },
                            {
                                icon: <MessageCircle className="w-7 h-7" />,
                                title: "Travel Assistant",
                                desc: "24/7 AI chatbot to answer trip questions, suggest local gems, and modify plans.",
                                color: 'from-amber-500 to-amber-600',
                                bgLight: 'bg-amber-50',
                                textColor: 'text-amber-600'
                            }
                        ].map((feature, i) => (
                            <div key={i} className="p-8 rounded-2xl bg-white border border-slate-200/80 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                                <div className={`w-14 h-14 rounded-xl ${feature.bgLight} flex items-center justify-center mb-5 ${feature.textColor} group-hover:scale-110 transition-transform duration-300`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-slate-900">{feature.title}</h3>
                                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trust Badges */}
            <section className="py-12 bg-slate-50/80 border-y border-slate-200/40">
                <div className="container mx-auto px-6">
                    <p className="text-center text-sm font-medium text-slate-400 mb-6">Built with industry-leading technology</p>
                    <div className="flex items-center justify-center gap-8 md:gap-14 flex-wrap opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                        {['Google Gemini', 'Firebase', 'MongoDB', 'Three.js', 'Leaflet', 'OpenRouteService'].map((tech) => (
                            <div key={tech} className="text-sm md:text-base font-bold text-slate-600 tracking-wide">
                                {tech}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Social Proof / Testimonial */}
            <section className="py-20 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600 blur-[100px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600 blur-[100px]"></div>
                </div>

                <div className="container mx-auto px-6 relative z-10">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-indigo-300 mb-6">
                                <Star className="w-3.5 h-3.5 fill-indigo-400 text-indigo-400" />
                                Trusted by travelers worldwide
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                                Join <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">10,000+</span> <br />
                                happy travelers.
                            </h2>
                            <p className="text-slate-400 text-lg mb-8">
                                From weekend getaways to month-long expeditions, Journey360 is the trusted companion for modern explorers.
                            </p>
                            <div className="space-y-4">
                                {["Free optimized routes", "No hidden fees", "Save 10+ hours of planning", "Real-time safety alerts"].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                                        <span className="font-medium">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Testimonials Column */}
                        <div className="space-y-4">
                            {[
                                {
                                    text: "I usually stress about planning trips, but Journey360 made it fun. The AI suggestions were spot on!",
                                    name: "Sarah Jenkins",
                                    dest: "Traveled to Japan",
                                    initial: "S",
                                    gradient: "from-indigo-400 to-violet-600"
                                },
                                {
                                    text: "The AR navigation blew my mind. Walking through Rome with arrows guiding me was surreal.",
                                    name: "Marco Rossi",
                                    dest: "Traveled to Italy",
                                    initial: "M",
                                    gradient: "from-cyan-400 to-indigo-600"
                                }
                            ].map((testimonial, i) => (
                                <div key={i} className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-colors">
                                    <div className="flex gap-1 mb-3">
                                        {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                                    </div>
                                    <p className="text-sm text-slate-200 mb-4 leading-relaxed italic">
                                        "{testimonial.text}"
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center font-bold text-sm`}>
                                            {testimonial.initial}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{testimonial.name}</p>
                                            <p className="text-xs text-slate-400">{testimonial.dest}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-white text-center relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-100/40 rounded-full blur-3xl"></div>
                </div>
                <div className="container mx-auto px-6 max-w-4xl relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-sm font-semibold mb-6">
                        <Compass className="w-4 h-4" />
                        Get Started Today
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Ready to start your adventure?</h2>
                    <p className="text-lg text-slate-500 mb-10 max-w-xl mx-auto">
                        Join thousands of travelers planning smarter, not harder. It's free to get started.
                    </p>
                    <button
                        onClick={() => navigate('/signup')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xl font-bold py-4 px-12 rounded-full shadow-xl shadow-indigo-500/25 hover:shadow-2xl transition-all transform hover:-translate-y-1 inline-flex items-center gap-2"
                    >
                        Create My Itinerary
                        <ArrowRight className="w-5 h-5" />
                    </button>
                    <p className="mt-6 text-sm text-slate-400">No credit card required • Instant access</p>
                </div>
            </section>

            <Footer />

            {/* Global animation keyframes */}
            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(24px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default LandingPage;
