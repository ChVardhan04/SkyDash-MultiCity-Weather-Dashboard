'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader2, Sparkles } from 'lucide-react';
import { aiAPI } from '@/lib/api';

const SUGGESTIONS = [
  'Which city is warmest right now?',
  'Do I need an umbrella anywhere?',
  'Any extreme weather alerts?',
  'Compare all my cities',
  'What should I wear today?',
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Props {
  cities: any[];
  weatherData: Record<string, any>;
  units: string;
}

export default function AIChat({ cities, weatherData, units }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! I'm SkyMind, your weather assistant 🌤️\n\nI can see weather for all your tracked cities. Ask me anything — outfit tips, travel recommendations, weather comparisons, or alerts!`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: msg, timestamp: new Date() }]);
    setLoading(true);

    try {
      const res = await aiAPI.chat(msg, units);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.data.reply, timestamp: new Date() },
      ]);
    } catch (err: any) {
      // Show the error in chat — never redirect to login
      const status = err?.response?.status;
      let errorMsg = 'Something went wrong. Please try again.';

      if (status === 503 || err?.response?.data?.error?.includes('not configured')) {
        errorMsg = "AI service isn't configured yet. Add an OpenAI API key to your backend .env file to enable GPT-powered responses. The built-in assistant should still work — try refreshing!";
      } else if (status === 429) {
        errorMsg = 'Too many requests. Please wait a moment and try again.';
      } else if (err?.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (!navigator.onLine) {
        errorMsg = 'No internet connection. Please check your network.';
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ ${errorMsg}`, timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="glass rounded-2xl overflow-hidden border border-purple-500/20">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-purple-500/5">
        <div className="p-2 bg-purple-500/20 rounded-xl">
          <Bot className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white flex items-center gap-1.5">
            SkyMind AI <Sparkles size={14} className="text-purple-400" />
          </h3>
          <p className="text-xs text-gray-400">
            {cities.length} cities in context
            {!process.env.NEXT_PUBLIC_API_URL?.includes('openai') && (
              <span className="ml-1 text-green-400">• Smart mode active</span>
            )}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-gray-400">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="h-72 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 animate-fade-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <Bot size={14} className="text-purple-400" />
              </div>
            )}
            <div
              className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-white/5 text-gray-200 rounded-bl-sm'
              }`}
            >
              {/* Render line breaks and bold (**text**) */}
              {msg.content.split('\n').map((line, j) => (
                <p key={j} className={j > 0 ? 'mt-1' : ''}>
                  {line.split(/\*\*(.*?)\*\*/g).map((part, k) =>
                    k % 2 === 1 ? <strong key={k} className="text-white font-semibold">{part}</strong> : part
                  )}
                </p>
              ))}
              <p className="text-xs opacity-40 mt-1.5">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs text-blue-300">U</span>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-7 h-7 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0">
              <Bot size={14} className="text-purple-400" />
            </div>
            <div className="bg-white/5 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 0.2, 0.4].map((delay, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick suggestions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
          {SUGGESTIONS.slice(0, 3).map((s, i) => (
            <button
              key={i}
              onClick={() => send(s)}
              className="shrink-0 text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 px-3 py-1.5 rounded-full transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-white/10 flex gap-3">
        <input
          type="text"
          className="input-field text-sm py-2.5"
          placeholder="Ask about weather, what to wear, best city to visit..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          maxLength={500}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || loading}
          className="btn-primary px-3 py-2.5 shrink-0"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}
