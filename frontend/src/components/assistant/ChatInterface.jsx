import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Zap, Globe, TrendingUp } from 'lucide-react';
import { auth } from '../../services/firebase';
import { apiService } from '../../services/apiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ChatInterface = () => {
    const user = auth.currentUser;
    const messagesEndRef = useRef(null);

    const userAvatar = user?.photoURL || (user?.email
        ? `https://ui-avatars.com/api/?name=${user.email.split('@')[0]}&background=random`
        : "https://ui-avatars.com/api/?name=User&background=random");

    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'ai',
            type: 'text',
            content: "Hello! 👋 I'm your AI travel assistant powered by advanced AI. How can I help you plan your perfect trip today? I can assist with:\n\n✈️ **Personalized Itineraries**\n🛡️ **Safety Tips & Alerts**\n💰 **Budget Estimates in ₹ (INR)**\n🗺️ **Route Planning**\n🌤️ **Weather Forecasts**"
        }
    ]);

    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userMsgContent = inputText;
        const newMsg = {
            id: Date.now(),
            sender: 'user',
            type: 'text',
            content: userMsgContent
        };

        setMessages(prev => [...prev, newMsg]);
        setInputText("");
        setIsLoading(true);

        try {
            const data = await apiService.chat(auth, userMsgContent);
            const response = data.reply || data.text || data.response || data;

            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'ai',
                type: 'text',
                content: response
            }]);
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                sender: 'ai',
                type: 'text',
                content: "⚠️ Sorry, I encountered an error connecting to the AI service. Please try again in a moment."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const quickSuggestions = [
        { text: 'Plan a 3-day trip to Paris', icon: '🗼', color: 'from-pink-500 to-rose-500' },
        { text: 'Safety tips for Tokyo', icon: '🛡️', color: 'from-emerald-500 to-teal-500' },
        { text: 'Budget for Bali vacation', icon: '💰', color: 'from-amber-500 to-orange-500' },
        { text: 'Best time to visit Iceland', icon: '🌍', color: 'from-blue-500 to-cyan-500' }
    ];

    return (
        <div className="flex flex-col h-full">
            {/* Messages Area with Custom Scrollbar */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>

                        {/* AI Avatar with Gradient */}
                        {msg.sender === 'ai' && (
                            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mr-3 flex-shrink-0 shadow-lg shadow-emerald-500/30">
                                <Sparkles className="text-white" size={20} />
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></div>
                            </div>
                        )}

                        <div className={`max-w-[75%] ${msg.sender === 'user' ? 'order-1' : ''}`}>
                            {/* Sender Name with Timestamp */}
                            <div className={`flex items-center gap-2 mb-1.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    {msg.sender === 'ai' ? 'Journey360 AI' : 'You'}
                                </p>
                                <span className="text-[10px] text-gray-400">•</span>
                                <span className="text-[10px] text-gray-400">Just now</span>
                            </div>

                            {/* Message Bubble with Enhanced Styling */}
                            {msg.type === 'text' && (
                                <div className={`group relative p-4 rounded-2xl shadow-sm leading-relaxed transition-all hover:shadow-md ${msg.content.includes("System Alert") || msg.content.includes("⚠️")
                                        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-bl-sm'
                                        : msg.sender === 'user'
                                            ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-br-sm'
                                            : 'bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-gray-700 dark:text-gray-200 rounded-bl-sm'
                                    }`}>
                                    {msg.sender === 'user' ? (
                                        <p className="text-sm">{msg.content}</p>
                                    ) : (
                                        <div className="text-sm prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                                            {msg.content.includes("System Alert") ? (
                                                <div className="flex items-start gap-2">
                                                    <span className="text-lg">⚠️</span>
                                                    <div>
                                                        <strong className="block mb-1">System Alert</strong>
                                                        {msg.content.replace("⚠️ System Alert:", "").replace("System Alert:", "").trim()}
                                                    </div>
                                                </div>
                                            ) : (
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        strong: ({ children }) => <span className="font-bold text-gray-900 dark:text-white">{children}</span>,
                                                        ul: ({ children }) => <ul className="list-disc ml-4 space-y-1.5 my-3">{children}</ul>,
                                                        ol: ({ children }) => <ol className="list-decimal ml-4 space-y-1.5 my-3">{children}</ol>,
                                                        li: ({ children }) => <li className="pl-1">{children}</li>,
                                                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                                        a: ({ children, href }) => <a href={href} className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium">{children}</a>,
                                                        h3: ({ children }) => <h3 className="font-bold text-lg text-gray-900 dark:text-white mt-3 mb-2">{children}</h3>,
                                                        code: ({ inline, children }) =>
                                                            inline
                                                                ? <code className="bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
                                                                : <code className="block bg-gray-100 dark:bg-slate-700 p-3 rounded-lg text-xs font-mono overflow-x-auto my-2">{children}</code>
                                                    }}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* User Avatar */}
                        {msg.sender === 'user' && (
                            <img
                                src={userAvatar}
                                alt="User"
                                className="w-11 h-11 rounded-2xl ml-3 flex-shrink-0 border-2 border-emerald-100 dark:border-emerald-900/30 shadow-md"
                            />
                        )}
                    </div>
                ))}

                {/* Loading Animation */}
                {isLoading && (
                    <div className="flex justify-start animate-fadeIn">
                        <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mr-3 flex-shrink-0 shadow-lg shadow-emerald-500/30">
                            <Sparkles className="text-white animate-pulse" size={20} />
                        </div>
                        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-4 rounded-2xl rounded-bl-sm shadow-sm flex gap-2 items-center">
                            <div className="flex gap-1.5">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">AI is thinking...</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area with Enhanced Design */}
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-800">
                {/* Quick Suggestion Chips with Icons */}
                <div className="flex flex-wrap gap-2 mb-5 justify-center">
                    {quickSuggestions.map((chip) => (
                        <button
                            key={chip.text}
                            onClick={() => setInputText(chip.text)}
                            className="group px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md hover:shadow-emerald-500/10 transition-all flex items-center gap-2 hover:scale-105"
                        >
                            <span className="text-base">{chip.icon}</span>
                            <span>{chip.text}</span>
                        </button>
                    ))}
                </div>

                {/* Text Input with Gradient Border */}
                <div className="max-w-4xl mx-auto">
                    <div className="relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl opacity-20 blur group-focus-within:opacity-40 transition-opacity"></div>
                        <div className="relative bg-white dark:bg-slate-800 p-2 rounded-2xl flex items-center gap-2 focus-within:ring-2 focus-within:ring-emerald-500/50 transition-all shadow-lg border border-gray-100 dark:border-slate-700">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                placeholder="Ask me anything about your travel plans..."
                                className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-sm py-3 px-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSend}
                                className="p-3 bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                                disabled={isLoading || !inputText.trim()}
                            >
                                <Send size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* Powered By Badge */}
                    <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-400 dark:text-gray-500">
                        <Zap size={12} className="text-emerald-500" />
                        <span>Powered by Advanced AI • Real-time Responses</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
