import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, User, Loader2, Sparkles, Briefcase, Users, Zap, Package } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface ChatProps {
  activeRole: 'cfo' | 'marketer' | 'hr' | 'operations';
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
    hr: "AI CHRO People Advisor",
    operations: "AI COO Operations Director"
  };

  const roleWelcome = {
    cfo: "Hello! I'm your AI CFO. How can I help you manage your finances, expenses, or cashflow today?",
    marketer: "Hey there! I'm your AI CMO. Let's design some high-converting campaigns or brainstorm growth ideas!",
    hr: "Welcome! I'm your AI CHRO. I can assist you with HR policies, job descriptions, offer letters, or compliance questions.",
    operations: "Greetings! I'm your AI COO. Let's optimize our stock inventory levels, coordinate project tasks, or resolve client support issues."
  };

  const RoleIcon = () => {
    if (activeRole === 'marketer') return <Sparkles size={20} />;
    if (activeRole === 'hr') return <Users size={20} />;
    if (activeRole === 'operations') return <Package size={20} />;
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
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
      {/* Toggle Button */}
      {!isOpen && (
        <Button 
          onClick={() => setIsOpen(true)}
          aria-label="Open chat"
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary shadow-2xl flex items-center justify-center text-primary-foreground hover:scale-105 active:scale-95 group duration-300 relative border border-primary/20"
        >
          <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 group-hover:rotate-12 transition-transform" />
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-background animate-pulse" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[calc(100vw-2rem)] sm:w-[400px] h-[calc(100vh-6rem)] sm:h-[600px] border border-border bg-card shadow-2xl rounded-2xl flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-300 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between bg-black/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <RoleIcon />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">{roleTitle[activeRole]}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Online</span>
                  {hasActiveScenario && (
                    <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold ml-1">
                      SCENARIO ACTIVE
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground h-8 w-8 rounded-full hover:bg-accent/40"
            >
              <X size={16} />
            </Button>
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/5"
          >
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 px-4">
                <div className="text-primary/30 w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
                  <RoleIcon />
                </div>
                <p className="text-xs font-semibold text-muted-foreground max-w-[260px]">{roleWelcome[activeRole]}</p>

                {/* Scenario Quick-Prompts */}
                {quickPrompts.length > 0 && (
                  <div className="w-full space-y-1.5 pt-4 border-t border-border/60">
                    <div className="flex items-center gap-1.5 justify-center mb-1.5">
                      <Zap size={10} className="text-emerald-400" />
                      <span className="text-[9px] uppercase tracking-widest font-black text-emerald-400">Scenario Recommendations</span>
                    </div>
                    {quickPrompts.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(prompt)}
                        className="w-full text-left text-[11px] font-medium px-3 py-2 rounded-lg border border-border bg-black/20 hover:bg-accent/30 hover:border-primary/20 transition-all cursor-pointer text-muted-foreground hover:text-foreground"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 border ${
                  msg.role === 'user' 
                    ? 'bg-secondary/10 border-secondary/20 text-secondary' 
                    : 'bg-primary/10 border-primary/20 text-primary'
                }`}>
                  {msg.role === 'user' ? <User size={13} /> : <RoleIcon />}
                </div>
                <div className={`max-w-[80%] p-3 rounded-xl text-xs leading-relaxed break-words whitespace-pre-wrap ${
                  msg.role === 'user' 
                    ? 'bg-primary text-primary-foreground font-medium rounded-tr-none' 
                    : 'bg-card border border-border text-foreground/90 rounded-tl-none'
                }`}>
                  {msg.parts[0].text}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-md bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                  <RoleIcon />
                </div>
                <div className="bg-card border border-border p-3 rounded-xl rounded-tl-none flex items-center justify-center">
                  <Loader2 size={14} className="animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-border bg-card">
            <div className="relative flex items-center">
              <Input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="w-full pr-10 bg-black/10 border-border"
              />
              <Button 
                type="submit"
                disabled={!input.trim() || isLoading}
                size="icon"
                className="absolute right-1 w-8 h-8 rounded-md bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 active:scale-95"
              >
                <Send size={12} />
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
