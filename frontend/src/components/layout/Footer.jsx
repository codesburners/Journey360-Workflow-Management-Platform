import React from 'react';
import { Link } from 'react-router-dom';
import { Linkedin, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <Link to="/" className="text-2xl font-bold text-white tracking-tight flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center rotate-45">
                                <span className="block w-4 h-4 bg-white rotate-45"></span>
                            </div>
                            Journey360
                        </Link>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">
                            Your AI-powered travel companion. Discover, plan, and experience the world with confidence.
                        </p>
                        <div className="flex gap-4">
                            <a href="https://www.linkedin.com/in/aaron-alphons-thomas/" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all">
                                <Linkedin size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-sky-500 hover:text-white transition-all">
                                <Twitter size={18} />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-pink-600 hover:text-white transition-all">
                                <Instagram size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-white font-bold mb-6">Quick Links</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link to="/" className="hover:text-emerald-400 transition-colors">Home</Link></li>
                            <li><Link to="/about" className="hover:text-emerald-400 transition-colors">About Us</Link></li>
                            <li><Link to="/services" className="hover:text-emerald-400 transition-colors">Services</Link></li>
                            <li><Link to="/blog" className="hover:text-emerald-400 transition-colors">Blog</Link></li>
                            <li><Link to="/contact" className="hover:text-emerald-400 transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="text-white font-bold mb-6">Support</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link to="/tos" className="hover:text-emerald-400 transition-colors">Help Center</Link></li>
                            <li><Link to="/tos" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/tos" className="hover:text-emerald-600 transition-colors">Terms of Service</Link></li>
                            <li><Link to="/tos" className="hover:text-emerald-400 transition-colors">Safety Guide</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-white font-bold mb-6">Contact Us</h4>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-start gap-3">
                                <MapPin size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                                <span>SJT, VIT-Vellore, Vellore 632014</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={18} className="text-emerald-500 shrink-0" />
                                <span>+91 6362337992</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail size={18} className="text-emerald-500 shrink-0" />
                                <span>support@journey360.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
                    <p>© 2024 Journey360 AI. All rights reserved.</p>
                    <p>Made with ❤️ for travelers.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
