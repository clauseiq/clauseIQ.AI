import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, X, Send, Sparkles, User, Bot, Loader2, ChevronDown } from 'lucide-react';
import { askContractQuestion, ChatMessage } from '../services/geminiService';

interface ContractChatProps {
  contractText: string;
}

export const ContractChat: React.FC<ContractChatProps> = ({ contractText }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hi! I\'m Clause IQ. I\'ve read the contract. Ask me anything about specific clauses, risks, or definitions.' }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100); // Small delay to allow rendering
    }
  }, [history, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    setHistory(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const apiHistory = history.filter(h => h.role === 'user' || h.role === 'model');
      const answer = await askContractQuestion(contractText, apiHistory, userMessage.text);
      setHistory(prev => [...prev, { role: 'model', text: answer }]);
    } catch (error) {
      console.error(error);
      setHistory(prev => [...prev, { role: 'model', text: "I'm sorry, I encountered an error trying to answer that. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Use Portal to escape any parent transforms/overflows (common in the dashboard layout)
  return createPortal(
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end pointer-events-none font-sans">
      {/* Chat Window */}
      <div 
        className={`
          pointer-events-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-[350px] md:w-[400px] mb-4 overflow-hidden transition-all duration-300 origin-bottom-right
          ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-10 pointer-events-none absolute bottom-0 right-0'}
        `}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex justify-between items-center text-white">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            <span className="font-bold">Ask Clause IQ</span>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="h-[400px] overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
          {history.map((msg, idx) => (
            <div key={idx} className={`flex items-start space-x-2 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center shrink-0 border
                ${msg.role === 'user' ? 'bg-blue-100 dark:bg-blue-900 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}
              `}>
                {msg.role === 'user' ? <User className="h-4 w-4 text-blue-600 dark:text-blue-400" /> : <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
              </div>
              <div className={`
                p-3 rounded-2xl text-sm max-w-[80%]
                ${msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none shadow-md' 
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-tl-none border border-slate-100 dark:border-slate-800 shadow-sm'}
              `}>
                 {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                <Loader2 className="h-4 w-4 text-purple-600 animate-spin" />
              </div>
              <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-800 shadow-sm text-sm text-slate-500">
                Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about risks, terms..." 
            className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 dark:text-white outline-none"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-xl transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* FAB */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`
          pointer-events-auto shadow-lg hover:shadow-xl transition-all duration-300 rounded-full p-4 flex items-center justify-center
          ${isOpen ? 'bg-slate-700 hover:bg-slate-800 text-white rotate-90' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:scale-105'}
        `}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>
    </div>,
    document.body
  );
};