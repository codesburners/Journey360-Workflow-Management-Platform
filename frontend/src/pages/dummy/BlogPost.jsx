import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, User, Share2, Facebook, Twitter, Linkedin } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

const BLOG_DATA = {
    'hidden-gems-japan': {
        title: "10 Hidden Gems in Japan to Visit in 2024",
        image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2070&auto=format&fit=crop",
        category: "Destinations",
        date: "Jan 15, 2024",
        author: "Sarah Jenkins",
        readTime: "5 min read",
        content: `
            <p class="mb-6 text-lg leading-relaxed text-gray-700">Japan is a country that perfectly blends ancient traditions with futuristic technology. While Tokyo, Kyoto, and Osaka are must-visit destinations, the true magic of Japan often lies off the beaten path.</p>
            
            <h3 class="text-2xl font-bold text-gray-900 mb-4">1. Kanazawa</h3>
            <p class="mb-6 text-gray-700 leading-relaxed">Known as "Little Kyoto," Kanazawa offers beautifully preserved samurai and geisha districts without the massive crowds. The Kenroku-en Garden is considered one of the top three landscape gardens in Japan.</p>
            
            <h3 class="text-2xl font-bold text-gray-900 mb-4">2. Takayama</h3>
            <p class="mb-6 text-gray-700 leading-relaxed">Nestled in the Japanese Alps, Takayama is famous for its well-preserved Edo-period streets and the biannual Takayama Festival, which features ornate floats.</p>
            
            <h3 class="text-2xl font-bold text-gray-900 mb-4">3. Naoshima Art Island</h3>
            <p class="mb-6 text-gray-700 leading-relaxed">For art lovers, Naoshima is a paradise. This island in the Seto Inland Sea is home to modern art museums, architecture, and sculptures, including Yayoi Kusama's famous yellow pumpkin.</p>
            
            <p class="mb-6 text-gray-700 leading-relaxed">Whether you're looking for history, nature, or contemporary culture, these hidden gems provide a deeper, more intimate look at Japanese culture.</p>
        `
    },
    'ai-travel-planning': {
        title: "How AI is Changing the Way We Plan Trips",
        image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop",
        category: "Technology",
        date: "Jan 10, 2024",
        author: "David Chen",
        readTime: "8 min read",
        content: `
            <p class="mb-6 text-lg leading-relaxed text-gray-700">Gone are the days of spending weeks researching hotels, flights, and activities. Artificial Intelligence is revolutionizing the travel industry, making trip planning faster, smarter, and more personalized.</p>
            
            <h3 class="text-2xl font-bold text-gray-900 mb-4">Hyper-Personalization</h3>
            <p class="mb-6 text-gray-700 leading-relaxed">AI algorithms analyze your preferences, past trips, and even social media behavior to suggest destinations and activities tailored specifically to your tastes.</p>
            
            <h3 class="text-2xl font-bold text-gray-900 mb-4">Real-Time Adaptability</h3>
            <p class="mb-6 text-gray-700 leading-relaxed">Imagine your flight gets cancelled or it starts raining during your beach day. AI-powered travel assistants can instantly re-route your itinerary, suggesting indoor alternatives or new transport options in seconds.</p>
            
            <p class="mb-6 text-gray-700 leading-relaxed">At Journey360, we are at the forefront of this revolution, using advanced LLMs to create comprehensive day-by-day plans that would normally take a human travel agent hours to compile.</p>
        `
    },
    'safe-solo-travel': {
        title: "Safe Solo Travel: A Complete Guide for 2024",
        image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=2070&auto=format&fit=crop",
        category: "Safety",
        date: "Jan 05, 2024",
        author: "Emma Wilson",
        readTime: "6 min read",
        content: `
            <p class="mb-6 text-lg leading-relaxed text-gray-700">Solo travel is one of the most liberating experiences you can have, but safety is often a primary concern. With the right preparation and tools, you can explore the world with confidence.</p>
            
            <h3 class="text-2xl font-bold text-gray-900 mb-4">Share Your Itinerary</h3>
            <p class="mb-6 text-gray-700 leading-relaxed">Always make sure someone back home knows where you are. Apps like Journey360 allow you to share your live location and itinerary with trusted contacts.</p>
            
            <h3 class="text-2xl font-bold text-gray-900 mb-4">Trust Your Instincts</h3>
            <p class="mb-6 text-gray-700 leading-relaxed">If a situation feels off, remove yourself immediately. Being polite is less important than being safe.</p>
            
            <h3 class="text-2xl font-bold text-gray-900 mb-4">Digitize Your Documents</h3>
            <p class="mb-6 text-gray-700 leading-relaxed">Keep digital copies of your passport, insurance, and emergency contacts in a secure cloud storage. This can be a lifesaver if your physical belongings are lost or stolen.</p>
        `
    }
};

const BlogPost = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const post = BLOG_DATA[id];

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    if (!post) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Article Not Found</h2>
                    <button onClick={() => navigate('/about')} className="text-emerald-600 hover:underline">Return to Blog</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-sans">
            {/* Reusing Public Navbar logic from App.jsx implicit rendering, but ensuring we have spacing */}

            <article>
                {/* Hero */}
                <div className="relative h-[60vh] min-h-[400px]">
                    <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 text-white max-w-5xl mx-auto">
                        <button
                            onClick={() => navigate('/about')}
                            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors text-sm font-bold uppercase tracking-wider"
                        >
                            <ArrowLeft size={16} /> Back to Insights
                        </button>
                        <div className="flex items-center gap-4 mb-4">
                            <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                {post.category}
                            </span>
                            <span className="flex items-center gap-2 text-sm text-gray-300">
                                <Clock size={16} /> {post.readTime}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-6">
                            {post.title}
                        </h1>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                                {post.author.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold">{post.author}</p>
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                    <Calendar size={12} /> {post.date}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-3xl mx-auto px-6 py-12">
                    <div className="flex justify-between items-center mb-8 pb-8 border-b border-gray-100">
                        <div className="flex gap-4">
                            <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                                <Share2 size={18} />
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-[#1877F2] hover:text-white transition-colors">
                                <Facebook size={18} />
                            </button>
                            <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-[#1DA1F2] hover:text-white transition-colors">
                                <Twitter size={18} />
                            </button>
                            <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-[#0A66C2] hover:text-white transition-colors">
                                <Linkedin size={18} />
                            </button>
                        </div>
                    </div>

                    <div
                        className="prose prose-lg prose-blue max-w-none"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />

                    <div className="mt-12 p-8 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Enjoyed this article?</h3>
                        <p className="text-gray-600 mb-6">Join Journey360 today to experience travel reimagined.</p>
                        <button
                            onClick={() => navigate('/signup')}
                            className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30"
                        >
                            Start Your Journey Free
                        </button>
                    </div>
                </div>
            </article>
            <Footer />
        </div>
    );
};

export default BlogPost;
