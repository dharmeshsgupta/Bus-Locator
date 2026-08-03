import React, { useState, useEffect, useRef } from 'react';
import { agenticClient } from '../../services/api/axios';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface AIChatDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AIChatDrawer({ isOpen, onClose }: AIChatDrawerProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "Hello! I am your BusLocator AI Assistant. Ask me anything about: \n- 🚌 Live bus telemetry and locations\n- ⏰ Shuttle route schedules\n- 💰 Billing installments and fees\n- 📜 Transit refund and cancellation policies"
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of conversation
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            // 1. Post request using our authenticated agenticClient
            const response = await agenticClient.post('/chat', { question: userMessage });
            const botAnswer = response.data.answer;

            setMessages(prev => [...prev, { role: 'assistant', content: botAnswer }]);
        } catch (error: any) {
            console.error('Error fetching chat response:', error);
            const errorMsg = error.response?.data?.detail || "Sorry, I am having trouble connecting to the transit AI service. Please try again later.";
            setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to format basic bold and bullet lists in UI
    const formatMessageText = (text: string) => {
        return text.split('\n').map((line, index) => {
            let content = line;
            // Bold formatter: replace **text** with <strong>text</strong>
            const boldRegex = /\*\*(.*?)\*\*/g;
            const parts = [];
            let lastIndex = 0;
            let match;

            while ((match = boldRegex.exec(line)) !== null) {
                if (match.index > lastIndex) {
                    parts.push(line.substring(lastIndex, match.index));
                }
                parts.push(<strong key={match.index} className="font-bold text-slate-100">{match[1]}</strong>);
                lastIndex = boldRegex.lastIndex;
            }
            if (lastIndex < line.length) {
                parts.push(line.substring(lastIndex));
            }

            const formattedLine = parts.length > 0 ? parts : content;

            if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                return (
                    <li key={index} className="ml-4 list-disc text-body-md my-1 text-slate-300">
                        {line.trim().substring(2)}
                    </li>
                );
            }
            return (
                <p key={index} className="text-body-md my-1 text-slate-200 min-h-[1em]">
                    {formattedLine}
                </p>
            );
        });
    };

    return (
        <>
            {/* Translucent Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            {/* Drawer Container */}
            <div
                className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-slate-900/95 border-l border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="px-lg py-md border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
                    <div className="flex items-center gap-sm">
                        <div className="w-9 h-9 rounded-lg bg-primary/20 border border-primary flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined filled">support_agent</span>
                        </div>
                        <div>
                            <h2 className="text-body-lg font-bold text-slate-100">Transit AI Assistant</h2>
                            <div className="flex items-center gap-xs">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-label-sm text-slate-400">Online & Ready</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-xs hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-colors flex items-center justify-center border border-slate-800 cursor-pointer"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* Message Logs */}
                <div className="flex-1 overflow-y-auto p-lg space-y-md bg-gradient-to-b from-slate-900 to-slate-950">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                                }`}
                        >
                            <div
                                className={`px-md py-sm rounded-2xl ${msg.role === 'user'
                                        ? 'bg-primary text-on-primary rounded-tr-xs shadow-md'
                                        : 'bg-slate-800 text-slate-200 border border-slate-700/60 rounded-tl-xs shadow-xs'
                                    }`}
                            >
                                {msg.role === 'user' ? (
                                    <p className="text-body-md whitespace-pre-wrap">{msg.content}</p>
                                ) : (
                                    <div className="space-y-1">{formatMessageText(msg.content)}</div>
                                )}
                            </div>
                            <span className="text-label-sm text-slate-500 mt-xs px-xs">
                                {msg.role === 'user' ? 'You' : 'Transit AI'}
                            </span>
                        </div>
                    ))}

                    {/* Bouncing Thinking Indicator */}
                    {isLoading && (
                        <div className="flex flex-col mr-auto max-w-[80%] items-start">
                            <div className="px-md py-md rounded-2xl bg-slate-800 border border-slate-700/60 rounded-tl-xs flex items-center gap-xs">
                                <span className="w-2.5 h-2.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-2.5 h-2.5 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-2.5 h-2.5 rounded-full bg-slate-500 animate-bounce" />
                            </div>
                            <span className="text-label-sm text-slate-500 mt-xs px-xs">Thinking...</span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Footer Input Bar */}
                <form onSubmit={handleSend} className="p-md border-t border-slate-800 bg-slate-950/80 flex items-center gap-sm">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about buses, schedules, refunds..."
                        disabled={isLoading}
                        className="flex-1 bg-slate-900 hover:bg-slate-900/80 focus:bg-slate-900 border border-slate-800 focus:border-primary rounded-xl px-md py-sm text-body-md text-slate-100 placeholder-slate-500 outline-none transition-all disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="w-10 h-10 rounded-xl bg-primary hover:bg-primary/95 active:bg-primary/90 text-on-primary flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer shadow-md"
                    >
                        <span className="material-symbols-outlined text-[20px] filled">send</span>
                    </button>
                </form>
            </div>
        </>
    );
}
