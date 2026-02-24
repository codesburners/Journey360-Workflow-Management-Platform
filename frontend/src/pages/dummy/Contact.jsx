import React, { useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import Footer from '../../components/layout/Footer';
import { Mail, Phone, MapPin, Send, MessageSquare, ChevronDown, ChevronUp, CheckCircle, HelpCircle } from 'lucide-react';

const Contact = () => {
    const [formState, setFormState] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [activeFaq, setActiveFaq] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSending(true);
        // Simulate API call
        setTimeout(() => {
            setSending(false);
            setSent(true);
            setFormState({ name: '', email: '', subject: '', message: '' });
            setTimeout(() => setSent(false), 5000);
        }, 1500);
    };

    const handleChange = (e) => {
        setFormState({
            ...formState,
            [e.target.name]: e.target.value
        });
    };

    const faqs = [
        {
            q: "How does the AI itinerary generation work?",
            a: "Our advanced AI analyzes your destination, budget, and interests to build a day-by-day plan. It checks real-time availability for hotels and attractions to ensure accuracy."
        },
        {
            q: "Can I modify a trip after it's generated?",
            a: "Absolutely! You can use the 'Regenerate' button to give specific instructions (e.g., 'Make it more relaxing' or 'Add fewer museums') and the AI will adjust the plan instantly."
        },
        {
            q: "Are the prices accurate?",
            a: "We use real-time data from global travel partners to estimate costs. However, prices for flights and hotels can fluctuate, so we recommend booking through the provided links to lock in rates."
        },
        {
            q: "Is Journey360 free to use?",
            a: "Yes! The core itinerary generation features are free. We also offer premium safety alerts and offline maps for frequent travelers."
        }
    ];

    return (
        <AppLayout>
            <div className="bg-transparent min-h-screen font-sans flex flex-col">
                <div className="text-slate-900 dark:text-white pb-20 flex-1">
                    {/* Hero Section */}
                    <div className="bg-slate-900 py-16 sm:py-24 lg:py-20 relative overflow-hidden rounded-b-[40px] mb-20 shadow-xl">
                        {/* Background Image */}
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1549608276-5786777e6587?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
                        {/* Dark Overlay */}
                        <div className="absolute inset-0 bg-black/40"></div>

                        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
                            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-6 drop-shadow-lg">
                                We'd Love to Hear From You
                            </h1>
                            <p className="text-xl text-slate-200 max-w-2xl mx-auto drop-shadow-md">
                                Whether you have a question about features, pricing, or need support planning your next adventure, our team is ready to help.
                            </p>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto px-4 relative z-20">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                            {/* Contact Info Cards */}
                            <div className="lg:col-span-1 space-y-6">
                                {/* Card 1 */}
                                <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all duration-300">
                                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                                        <MessageSquare size={24} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Chat Support</h3>
                                    <p className="text-slate-500 dark:text-gray-400 text-sm mb-4">Our friendly team is here to help.</p>
                                    <a href="mailto:support@journey360.ai" className="text-emerald-600 dark:text-emerald-400 font-bold text-sm hover:underline">support@journey360.ai</a>
                                </div>

                                {/* Card 2 */}
                                <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all duration-300">
                                    <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/30 rounded-xl flex items-center justify-center text-teal-600 dark:text-teal-400 mb-4">
                                        <MapPin size={24} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Visit Us</h3>
                                    <p className="text-slate-500 dark:text-gray-400 text-sm mb-4">Come say hello at our HQ.</p>
                                    <p className="text-slate-900 dark:text-white font-medium text-sm">SJT,<br />VIT-Vellore, Vellore 632014</p>
                                </div>

                                {/* Card 3 */}
                                <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all duration-300">
                                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                                        <Phone size={24} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Call Us</h3>
                                    <p className="text-slate-500 dark:text-gray-400 text-sm mb-4">Mon-Fri from 10am to 2pm.</p>
                                    <p className="text-slate-900 dark:text-white font-bold text-sm">+91 6362337992</p>
                                    <p className="text-slate-900 dark:text-white font-bold text-sm">+91 7094953929</p>
                                </div>
                            </div>

                            {/* Contact Form */}
                            <div className="lg:col-span-2">
                                <div className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 overflow-hidden h-full flex flex-col">
                                    <div className="p-8 sm:p-10 flex-1">
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                            <Mail className="text-emerald-600 dark:text-emerald-400" /> Send us a message
                                        </h2>

                                        <form onSubmit={handleSubmit} className="space-y-6 text-left">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">First Name</label>
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        required
                                                        value={formState.name}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-400"
                                                        placeholder="Michelle Paul"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Email</label>
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        required
                                                        value={formState.email}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-400"
                                                        placeholder="Mike@example.com"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Subject</label>
                                                <input
                                                    type="text"
                                                    name="subject"
                                                    required
                                                    value={formState.subject}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-400"
                                                    placeholder="How can we help?"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Message</label>
                                                <textarea
                                                    name="message"
                                                    required
                                                    rows="5"
                                                    value={formState.message}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-400 resize-none"
                                                    placeholder="Tell us about your trip plans..."
                                                ></textarea>
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={sending || sent}
                                                className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg shadow-emerald-500/30 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 ${sent ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-emerald-600 hover:bg-emerald-700'
                                                    } ${sending ? 'opacity-80 cursor-wait' : ''}`}
                                            >
                                                {sending ? (
                                                    <>Sending...</>
                                                ) : sent ? (
                                                    <><CheckCircle size={20} /> Message Sent!</>
                                                ) : (
                                                    <><Send size={20} /> Send Message</>
                                                )}
                                            </button>
                                        </form>
                                    </div>
                                    <div className="bg-white/40 dark:bg-slate-900/40 p-6 border-t border-slate-100 dark:border-slate-700 text-center">
                                        <p className="text-sm text-slate-500 dark:text-gray-400">
                                            We usually respond within <span className="font-bold text-slate-700 dark:text-white">24 hours</span>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FAQ Section */}
                        <div className="mt-20 max-w-4xl mx-auto pb-12">
                            <div className="text-center mb-12">
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold tracking-wider text-sm uppercase bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-800/50">Support</span>
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mt-4 mb-4">Frequently Asked Questions</h2>
                                <p className="text-slate-600 dark:text-gray-400">Quick answers to common questions about Journey360.</p>
                            </div>

                            <div className="space-y-4">
                                {faqs.map((faq, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/20 dark:border-slate-700/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md"
                                    >
                                        <button
                                            onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                                            className="w-full text-left p-6 flex items-center justify-between"
                                        >
                                            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                                <HelpCircle className="text-slate-400 dark:text-gray-500 w-5 h-5" />
                                                {faq.q}
                                            </span>
                                            {activeFaq === idx ? (
                                                <ChevronUp className="text-emerald-600 dark:text-emerald-400 w-5 h-5" />
                                            ) : (
                                                <ChevronDown className="text-slate-400 dark:text-gray-500 w-5 h-5" />
                                            )}
                                        </button>
                                        <div
                                            className={`transition-all duration-300 ease-in-out overflow-hidden ${activeFaq === idx ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                                                }`}
                                        >
                                            <div className="p-6 pt-0 text-slate-600 dark:text-gray-300 leading-relaxed border-t border-slate-50 dark:border-slate-700/50">
                                                {faq.a}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        </AppLayout>

    );
};

export default Contact;
