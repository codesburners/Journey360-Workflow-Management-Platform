import React, { useState } from 'react';
import { Send, Paperclip, Mic, Star } from 'lucide-react';
import { auth } from '../../services/firebase';
import runChat from '../../services/gemini';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ChatInterface = () => {
    // Mock user for avatar
    const user = auth.currentUser;
    const userAvatar = user?.email
        ? `https://ui-avatars.com/api/?name=${user.email.split('@')[0]}&background=random`
        : "https://ui-avatars.com/api/?name=User&background=random";

    // Clean initial state - no dummy chats
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'ai',
            type: 'text',
            content: "Hello! I'm your AI travel assistant. How can I help you plan your customized trip today?"
        }
    ]);

    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(false);

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
            const response = await runChat(userMsgContent);

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
                content: "Sorry, I encountered an error connecting to the AI. Please try again."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-8 pr-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>

                        {/* AI Avatar */}
                        {msg.sender === 'ai' && (
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4 flex-shrink-0">
                                <span className="text-xl">🤖</span>
                            </div>
                        )}

                        <div className={`max-w-[80%]`}>
                            {/* Sender Name */}
                            <p className={`text-xs text-gray-400 mb-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                {msg.sender === 'ai' ? 'Journey360 AI' : 'You'}
                            </p>

                            {/* Message Bubble */}
                            {msg.type === 'text' && (
                                <div className={`p-5 rounded-2xl shadow-sm leading-relaxed ${msg.sender === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-white border border-gray-100 text-gray-700 rounded-bl-none'
                                    }`}>
                                    {msg.sender === 'user' ? (
                                        msg.content
                                    ) : (
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                strong: ({ node, ...props }) => <span className="font-bold text-gray-900" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="list-disc ml-4 space-y-1 mt-2 mb-2" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal ml-4 space-y-1 mt-2 mb-2" {...props} />,
                                                li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                a: ({ node, ...props }) => <a className="text-blue-500 hover:underline" {...props} />,
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    )}
                                </div>
                            )}

                            {/* Recommendations Cards Carousel */}
                            {msg.type === 'card_carousel' && (
                                <div className="flex gap-4 overflow-x-auto pb-4 pt-2">
                                    {msg.cards.map((card, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm w-64 flex-shrink-0 hover:shadow-md transition-shadow cursor-pointer">
                                            <img src={card.image} alt={card.title} className="w-full h-32 object-cover rounded-xl mb-3" />
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-gray-900">{card.title}</h4>
                                                <div className="flex items-center gap-1 text-orange-400 text-xs font-bold">
                                                    <Star size={12} fill="currentColor" />
                                                    <span>{card.rating}</span>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 mb-3">{card.tags}</p>
                                            <button className="w-full py-2 border border-blue-100 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors">
                                                Details
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* User Avatar */}
                        {msg.sender === 'user' && (
                            <img src={userAvatar} alt="User" className="w-10 h-10 rounded-full ml-4 flex-shrink-0" />
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-4 flex-shrink-0 animate-pulse">
                            <span className="text-xl">🤖</span>
                        </div>
                        <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-none shadow-sm flex gap-2 items-center">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="mt-6 pt-6 border-t border-gray-100">
                {/* Quick Suggestion Chips */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {['Show way to hotel', 'Safety tips for Shinjuku', 'Next train to Shibuya', "Tomorrow's weather"].map((chip) => (
                        <button
                            key={chip}
                            onClick={() => {
                                setInputText(chip);
                            }}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2"
                        >
                            {chip === 'Show way to hotel' && <span className="text-red-500">📍</span>}
                            {chip === 'Safety tips for Shinjuku' && <span className="text-blue-500">🛡️</span>}
                            {chip === 'Next train to Shibuya' && <span className="text-gray-500">🚆</span>}
                            {chip === "Tomorrow's weather" && <span className="text-yellow-500">⛅</span>}
                            <span>{chip}</span>
                        </button>
                    ))}
                </div>

                {/* Text Input */}
                <div className="bg-gray-50 p-2 rounded-2xl flex items-center gap-2 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                        <Paperclip size={20} />
                    </button>
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask anything about your trip..."
                        className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-sm py-3 text-gray-900 placeholder:text-gray-400"
                    />
                    <button
                        onClick={handleSend}
                        className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md transition-all active:scale-95"
                        disabled={isLoading}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
