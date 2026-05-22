import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, User, Loader2, Sparkles, Briefcase, Users, Zap } from 'lucide-react';
import { useChat } from '../hooks/useChat';

interface ChatProps {
  activeRole: 'cfo' | 'marketer' | 'hr';
  seedPrompt?: string;
  setSeedPrompt?: (prompt: string | undefined) => void;
}

export const Chat: React.FC<ChatProps> = ({ activeRole, seedPrompt, setSeedPrompt }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, sendMessage, isLoading } = useChat(activeRole);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-open and send seed prompt when triggered from ScenarioPlanner
  useEffect(() => {
    if (seedPrompt && !isLoading) {
      setIsOpen(true);
      // Short delay so the chat window renders before sending
      const timer = setTimeout(() => {
        sendMessage(seedPrompt);
        setSeedPrompt?.(undefined);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [seedPrompt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  const roleTitle = {
    cfo: "AI CFO Assistant",
    marketer: "AI CMO Growth Partner",
    hr: "AI CHRO People Advisor"
  };

  const roleWelcome = {
    cfo: "Hello! I'm your AI CFO. How can I help you manage your finances, expenses, or cashflow today?",
    marketer: "Hey there! I'm your AI CMO. Let's design some high-converting campaigns or brainstorm growth ideas!",
    hr: "Welcome! I'm your AI CHRO. I can assist you with HR policies, job descriptions, offer letters, or compliance questions."
  };

  const RoleIcon = () => {
    if (activeRole === 'marketer') return <Sparkles size={20} />;
    if (activeRole === 'hr') return <Users size={20} />;
    return <Briefcase size={20} />;
  };

  // Check if scenario is active for quick-prompt suggestions
  const hasActiveScenario = (() => {
    try {
      return localStorage.getItem('ai_cfo_scenario_active') === 'true' && activeRole === 'cfo';
    } catch {
      return false;
    }
  })();

  const quickPrompts = hasActiveScenario ? [
    "What are the risks in my current hiring scenario?",
    "How can I optimize my runway under this plan?",
    "Is my marketing spend justified by the projected ROAS?"
  ] : [];

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50">
      {/* Toggle Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary shadow-2xl shadow-primary/40 flex items-center justify-center text-white transition-all duration-300 hover:scale-110 active:scale-95 group cursor-pointer"
        >
          <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-secondary rounded-full border-2 border-background animate-bounce" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[calc(100vw-2rem)] sm:w-[400px] h-[calc(100vh-6rem)] sm:h-[600px] glass-card flex flex-col shadow-[0_32px_64px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-8 duration-300">
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center justify-between bg-white/5 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                <RoleIcon />
              </div>
              <div>
                <h3 className="font-bold">{roleTitle[activeRole]}</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-black">Online</span>
                  {hasActiveScenario && (
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-bold ml-1">
                      SCENARIO ACTIVE
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/30 hover:text-white transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
          >
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 px-4">
                <div className="text-primary/50">
                  <RoleIcon />
                </div>
                <p className="text-sm font-medium opacity-50">{roleWelcome[activeRole]}</p>

                {/* Scenario Quick-Prompts */}
                {quickPrompts.length > 0 && (
                  <div className="w-full space-y-2 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-1.5 justify-center mb-2">
                      <Zap size={12} className="text-emerald-400" />
                      <span className="text-[10px] uppercase tracking-widest font-black text-emerald-400">Scenario Quick Actions</span>
                    </div>
                    {quickPrompts.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          sendMessage(prompt);
                        }}
                        className="w-full text-left text-xs px-3 py-2.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-emerald-500/20 transition-all cursor-pointer text-white/60 hover:text-white"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-secondary/20 text-secondary' : 'bg-primary/20 text-primary'
                }`}>
                  {msg.role === 'user' ? <User size={16} /> : <RoleIcon />}
                </div>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed break-words whitespace-pre-wrap ${
                  msg.role === 'user' 
                    ? 'bg-secondary/10 text-white rounded-tr-none' 
                    : 'bg-white/5 text-white/90 rounded-tl-none border border-white/5'
                }`}>
                  {msg.parts[0].text}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                  <RoleIcon />
                </div>
                <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/5">
                  <Loader2 size={16} className="animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-border">
            <div className="relative">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="w-full bg-white/5 border border-border rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:border-primary/50 transition-all text-sm"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
              >
                <Send size={14} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
