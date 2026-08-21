import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'admin';
  text: string;
  timestamp?: string;
}

export default function Chatbot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  
  useEffect(() => {
    let sid = sessionStorage.getItem('chatSessionId');
    if (user?.uid) {
      sid = user.uid;
    } else if (!sid) {
      sid = 'session_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('chatSessionId', sid);
    }
    setSessionId(sid);
  }, [user]);

  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: '1',
    role: 'model',
    text: "Hello! I'm your Appulence Tech assistant. How can I help you today?",
    timestamp: new Date().toISOString()
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (!sessionId) return;
    const docRef = doc(db, 'support_chats', sessionId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.messages && data.messages.length > 0) {
          // Merge initial message with firestore messages
          setMessages([
            { id: '1', role: 'model', text: "Hello! I'm your Appulence Tech assistant. How can I help you today?", timestamp: data.messages[0]?.timestamp },
            ...data.messages.map((m: any, i: number) => ({ id: `fs_${i}`, ...m }))
          ]);
        }
      }
    });
    return () => unsubscribe();
  }, [sessionId]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    
    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: userText,
      timestamp: new Date().toISOString()
    };
    
    setIsLoading(true);

    try {
      // 1. Save to Firestore immediately
      const docRef = doc(db, 'support_chats', sessionId);
      const fsMessages = messages.slice(1).map(m => ({ role: m.role, text: m.text, timestamp: m.timestamp || new Date().toISOString() }));
      await setDoc(docRef, {
        messages: [...fsMessages, { role: newUserMsg.role, text: newUserMsg.text, timestamp: newUserMsg.timestamp }],
        lastUpdated: new Date().toISOString(),
        userEmail: user?.email || 'Anonymous Visitor',
        status: 'active'
      }, { merge: true });

      // 2. Call Gemini
      const historyPayload = messages.map(m => ({
        role: m.role === 'admin' ? 'model' : m.role,
        text: m.text
      }));

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, history: historyPayload })
      });

      if (!res.ok) {
        throw new Error('Failed to fetch response');
      }

      const data = await res.json();
      
      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: data.response,
        timestamp: new Date().toISOString()
      };
      
      // 3. Update Firestore with AI response
      await updateDoc(docRef, {
        messages: [...fsMessages, { role: newUserMsg.role, text: newUserMsg.text, timestamp: newUserMsg.timestamp }, { role: modelMsg.role, text: modelMsg.text, timestamp: modelMsg.timestamp }],
        lastUpdated: new Date().toISOString()
      });

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-primary text-white shadow-xl hover:scale-105 active:scale-95 transition-all z-50 animate-bounce group"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="absolute right-full mr-4 bg-slate-800 text-white text-xs whitespace-nowrap px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Talk to our Appulence Assistant
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[350px] max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 flex flex-col h-[500px] max-h-[80vh]">
      <div className="bg-primary p-4 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <h3 className="font-bold text-sm">Appulence Assistant</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-primary/10 text-primary'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`p-3 rounded-2xl max-w-[200px] text-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-sm' : msg.role === 'admin' ? 'bg-slate-800 text-white rounded-tl-sm shadow-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'}`}>
                {msg.text}
              </div>
              <span className="text-[10px] text-slate-400 mt-1">
                {msg.role === 'admin' ? 'Admin' : ''}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 flex-row">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary/10 text-primary">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-500 rounded-tl-sm shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 bg-white border-t border-slate-100 shrink-0">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
            disabled={isLoading}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-1.5 bg-primary text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
