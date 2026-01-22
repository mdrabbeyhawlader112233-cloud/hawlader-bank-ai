
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, User, Bot, Sparkles, Building2, Phone, Mail, HelpCircle, Menu, X, ChevronRight, MessageCircle, Volume2, Square } from 'lucide-react';
import { Message } from './types';
import { streamMessageFromGemini } from './services/geminiService';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'হ্যালো! আমি Hawlader Bank-এর একজন AI অ্যাসিস্ট্যান্ট। আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeService, setActiveService] = useState('Support Agent');
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // TTS Logic
  const stopSpeech = useCallback(() => {
    window.speechSynthesis.cancel();
    setCurrentlySpeakingId(null);
  }, []);

  const speak = useCallback((messageId: string, text: string) => {
    if (currentlySpeakingId === messageId) {
      stopSpeech();
      return;
    }

    stopSpeech();

    const utterance = new SpeechSynthesisUtterance(text);
    const hasBengali = /[\u0980-\u09FF]/.test(text);
    const voices = window.speechSynthesis.getVoices();
    
    if (hasBengali) {
      utterance.lang = 'bn-BD';
      utterance.rate = 0.9;
      const selectedVoice = 
        voices.find(v => v.name.includes('Google বাংলা')) ||
        voices.find(v => v.lang === 'bn-BD') || 
        voices.find(v => v.lang === 'bn-IN') ||
        voices.find(v => v.name.toLowerCase().includes('google') && v.lang.startsWith('bn')) ||
        voices.find(v => v.lang.startsWith('bn'));
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    } else {
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      const enVoice = voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) ||
                      voices.find(v => v.lang === 'en-US') ||
                      voices.find(v => v.lang.startsWith('en'));
      if (enVoice) {
        utterance.voice = enVoice;
      }
    }
    
    utterance.onend = () => {
      setCurrentlySpeakingId(null);
    };

    utterance.onerror = (event) => {
      console.error('SpeechSynthesis error:', event);
      setCurrentlySpeakingId(null);
    };

    setCurrentlySpeakingId(messageId);
    window.speechSynthesis.speak(utterance);
  }, [currentlySpeakingId, stopSpeech]);

  useEffect(() => {
    const handleVoicesChanged = () => {
      console.debug('System voices updated');
    };
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    window.speechSynthesis.getVoices();
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      window.speechSynthesis.cancel();
    };
  }, []);

  const processMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(msg => ({
        role: (msg.role === 'assistant' ? 'model' : 'user') as 'model' | 'user',
        parts: [{ text: msg.content }]
      }));

      const stream = await streamMessageFromGemini(text, history);
      
      let assistantMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }]);

      let fullResponse = '';
      for await (const chunk of stream) {
        const textChunk = chunk.text || '';
        fullResponse += textChunk;
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId ? { ...msg, content: fullResponse } : msg
        ));
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an issue. Please try again or contact support at mdrabbipiash112233@gmail.com.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => processMessage(input);

  const handleSidebarAction = (label: string) => {
    setActiveService(label);
    if (window.innerWidth < 768) setIsSidebarOpen(false);

    if (label === 'Chat with Golpu') {
      processMessage("হ্যালো! আমি এখন আপনার সাথে গল্পু (Golpu) হিসেবে আড্ডা দিতে চাই। আমাকে আপনার বন্ধু ভাবুন।");
    } else if (label === 'Support Agent') {
      processMessage("হ্যালো, আমি এখন ব্যাংকিং সেবা সম্পর্কে জানতে চাই। প্রফেশনাল সাপোর্ট দিন।");
    } else if (label === 'General FAQ') {
      processMessage("Hawlader Bank-এর সাধারণ কিছু প্রশ্ন (General FAQ) ও তার উত্তর আমাকে জানান।");
    }
  };

  const handleQuickAction = (action: string) => {
    processMessage(action);
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0F172A] text-white transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3 border-b border-slate-700">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Hawlader</h1>
              <p className="text-xs text-slate-400 font-medium tracking-widest uppercase">Bank AI</p>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden ml-auto p-2 hover:bg-slate-800 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-6">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Services</p>
              <div className="space-y-1">
                {[
                  { icon: MessageCircle, label: 'Support Agent' },
                  { icon: Sparkles, label: 'Chat with Golpu' },
                  { icon: HelpCircle, label: 'General FAQ' },
                ].map((item, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleSidebarAction(item.label)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-200 ${activeService === item.label ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                  >
                    <item.icon className={`w-5 h-5 ${activeService === item.label ? 'text-white' : 'text-slate-500'}`} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Official Channel</p>
              <div className="space-y-4 px-3">
                <div className="flex items-center gap-3 text-sm text-slate-300 group cursor-pointer">
                  <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-blue-600/20 transition-colors">
                    <Mail className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="truncate group-hover:text-white transition-colors">mdrabbipiash112233@gmail.com</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-300 group cursor-pointer">
                  <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-blue-600/20 transition-colors">
                    <Phone className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="group-hover:text-white transition-colors">+88 01965012133</span>
                </div>
              </div>
            </div>
          </nav>

          <div className="p-4 border-t border-slate-700/50">
            <div className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-2xl backdrop-blur-sm border border-slate-700/30">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-inner">H</div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold truncate text-white">Guest Account</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Authorized Access</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-white md:rounded-l-[2.5rem] shadow-2xl overflow-hidden relative border-l border-slate-100">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-6 border-b border-slate-100 bg-white/80 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 md:hidden hover:bg-slate-100 rounded-xl transition-colors">
              <Menu className="w-6 h-6 text-slate-600" />
            </button>
            <div className="hidden md:flex items-center gap-2 text-slate-400">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold uppercase tracking-widest">Secure Portal</span>
              <ChevronRight className="w-4 h-4 opacity-50" />
              <span className="text-sm font-bold text-slate-900">Hawlader Bank AI - {activeService}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-tighter">Support Online</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                <span className="text-[10px] text-green-600 font-black uppercase tracking-widest">Active System</span>
              </div>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-8 scroll-smooth no-scrollbar">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
              <div className={`flex gap-4 max-w-[92%] sm:max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-blue-600'}`}>
                  {message.role === 'user' ? <User className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
                </div>
                <div className="group relative flex flex-col space-y-2">
                  <div className={`px-5 py-4 rounded-3xl text-[15px] leading-relaxed shadow-sm transition-all relative border ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none border-blue-500' 
                      : 'bg-slate-50 text-slate-800 rounded-tl-none border-slate-100 group-hover:bg-slate-100/80'
                  }`}>
                    {message.content || (isLoading && message.role === 'assistant' ? (
                      <div className="flex items-center gap-2 py-1">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                    ) : '')}
                    
                    {message.role === 'assistant' && message.content && (
                      <div className="flex justify-end mt-4 pt-2 border-t border-slate-200/50">
                        <button 
                          onClick={() => speak(message.id, message.content)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                            currentlySpeakingId === message.id 
                              ? 'bg-blue-600 text-white border-blue-700 animate-pulse shadow-blue-500/30' 
                              : 'bg-white text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:shadow-md'
                          }`}
                          title={currentlySpeakingId === message.id ? "Stop Speech" : "Play Natural Audio"}
                        >
                          {currentlySpeakingId === message.id ? (
                            <>
                              <Square className="w-3.5 h-3.5 fill-current" />
                              <span>Stop Audio</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Listen Aloud</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  <p className={`text-[10px] px-1 text-slate-400 font-bold uppercase tracking-tighter ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer Input Area */}
        <footer className="p-4 md:p-8 bg-white border-t border-slate-50">
          <div className="max-w-4xl mx-auto space-y-5">
            {/* Quick Actions */}
            {!isLoading && (
              <div className="flex flex-wrap gap-2 pb-2 overflow-x-auto no-scrollbar scroll-smooth">
                {[
                  { label: 'Open Account', icon: Building2, query: 'How do I open an account?' },
                  { label: 'Loan Info', icon: MessageCircle, query: 'কিভাবে লোন পাবো?' },
                  { label: 'Golpu Chat', icon: Sparkles, query: 'গল্পু, আমাকে একটা মজার জোকস বলো!' }
                ].map((action, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleQuickAction(action.query)} 
                    className="flex items-center gap-2 whitespace-nowrap px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-wider text-slate-600 hover:bg-white hover:border-blue-400 hover:text-blue-600 hover:shadow-xl hover:shadow-blue-500/10 transition-all"
                  >
                    <action.icon className="w-3.5 h-3.5 text-blue-500" />
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div className="relative group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask Hawlader Bank AI... (যেকোনো কিছু জিজ্ঞাসা করুন)"
                className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] py-5 pl-8 pr-16 text-[15px] focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 focus:bg-white transition-all shadow-xl shadow-slate-200/20 group-hover:shadow-blue-500/5 placeholder:text-slate-400 font-medium"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`absolute right-2.5 top-2.5 bottom-2.5 px-6 rounded-[1.5rem] flex items-center justify-center transition-all duration-300 ${
                  input.trim() && !isLoading 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/30' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                }`}
              >
                <Send className={`w-5 h-5 ${isLoading ? 'animate-pulse' : 'group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform'}`} />
              </button>
            </div>
            
            <p className="text-[10px] text-center text-slate-400 font-medium uppercase tracking-[0.2em]">
              Verified Banking Assistant • Support: <span className="text-blue-600 font-black decoration-blue-500/30 underline underline-offset-4">mdrabbipiash112233@gmail.com</span>
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
