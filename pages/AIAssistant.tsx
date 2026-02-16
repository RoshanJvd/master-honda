
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { askInventoryAssistant } from '../services/gemini';
import { Part } from '../types';

interface AIAssistantProps {
  inventory: Part[];
}

const AIAssistant: React.FC<AIAssistantProps> = ({ inventory }) => {
  const [messages, setMessages] = useState<{ role: 'ai' | 'user', text: string }[]>([
    { role: 'ai', text: 'Hello! I am your Honda Master Assistant. I have analyzed your inventory. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const response = await askInventoryAssistant(userMsg, inventory);
    setMessages(prev => [...prev, { role: 'ai', text: response }]);
    setLoading(false);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-honda-dark flex items-center gap-2">
            AI Operational Assistant
            <Sparkles className="text-amber-400" size={24} />
          </h1>
          <p className="text-gray-500">Ask about stock levels, ordering advice, or part details</p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' ? 'bg-honda-blue text-white' : 'bg-honda-red text-white'
                }`}>
                  {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-honda-blue text-white rounded-tr-none' 
                    : 'bg-gray-100 text-gray-800 rounded-tl-none'
                }`}>
                  {msg.text.split('\n').map((line, j) => <p key={j} className="mb-2 last:mb-0">{line}</p>)}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
               <div className="flex gap-3 max-w-[80%]">
                <div className="w-10 h-10 rounded-xl bg-honda-red text-white flex items-center justify-center animate-pulse">
                  <Bot size={20} />
                </div>
                <div className="p-4 rounded-2xl text-sm bg-gray-100 text-gray-400 italic">
                  Analyzing dealership data...
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-50 bg-gray-50/30">
          <div className="relative flex items-center gap-2 max-w-4xl mx-auto">
            <input 
              type="text"
              placeholder="Suggest parts I should restock this week..."
              className="w-full px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-honda-red/10 outline-none pr-14 shadow-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              disabled={loading}
              className="absolute right-2 p-2.5 bg-honda-red text-white rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
