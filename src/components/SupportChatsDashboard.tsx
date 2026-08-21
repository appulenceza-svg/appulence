import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, addDoc, getDocs, setDoc } from 'firebase/firestore';
import { MessageSquare, User, Send, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

interface ChatMessage {
  id?: string;
  role: 'user' | 'model' | 'admin';
  text: string;
  timestamp: string;
  isRead?: boolean;
}

interface ChatSession {
  id: string;
  messages: ChatMessage[];
  lastUpdated: string;
  userEmail?: string;
  status: 'active' | 'resolved';
}

export default function SupportChatsDashboard({ onBack }: { onBack?: () => void }) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'support_chats'), orderBy('lastUpdated', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedSessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatSession[];
      setSessions(fetchedSessions);
      setLoading(false);
      
      if (activeSession) {
        const updated = fetchedSessions.find(s => s.id === activeSession.id);
        if (updated) setActiveSession(updated);
      }
    });

    return () => unsubscribe();
  }, [activeSession?.id]);

  useEffect(() => {
    if (activeSession) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeSession]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeSession) return;

    const newMessage: ChatMessage = {
      role: 'admin',
      text: replyText.trim(),
      timestamp: new Date().toISOString(),
    };

    try {
      const sessionRef = doc(db, 'support_chats', activeSession.id);
      await updateDoc(sessionRef, {
        messages: [...activeSession.messages, newMessage],
        lastUpdated: new Date().toISOString()
      });
      setReplyText('');
    } catch (error) {
      console.error("Error sending reply:", error);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await updateDoc(doc(db, 'support_chats', id), { status: 'resolved' });
    } catch (error) {
      console.error("Error resolving chat:", error);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 p-6 md:p-8 space-y-6 flex flex-col h-[calc(100vh-80px)]">
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" /> Support Chats
        </h1>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
        {/* Chat List */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700 flex justify-between items-center">
            Active Sessions
            <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
              {sessions.filter(s => s.status !== 'resolved').length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-slate-500 text-sm">Loading...</div>
            ) : sessions.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">No chat sessions found.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {sessions.map(session => (
                  <button
                    key={session.id}
                    onClick={() => setActiveSession(session)}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex flex-col gap-1 ${
                      activeSession?.id === session.id ? 'bg-primary/5 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-sm text-slate-800 truncate pr-2">
                        {session.userEmail || session.id.slice(0, 8)}
                      </span>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {format(new Date(session.lastUpdated), 'HH:mm')}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {session.messages[session.messages.length - 1]?.text}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat View */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
          {activeSession ? (
            <>
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-800">
                    {activeSession.userEmail || `Session ${activeSession.id.slice(0, 8)}`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Started {format(new Date(activeSession.messages[0]?.timestamp || activeSession.lastUpdated), 'MMM d, yyyy')}
                  </p>
                </div>
                {activeSession.status !== 'resolved' && (
                  <button
                    onClick={() => handleResolve(activeSession.id)}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" /> Resolve
                  </button>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeSession.messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-primary/10 text-primary'
                    }`}>
                      <User className="w-4 h-4" />
                    </div>
                    <div className={`flex flex-col ${msg.role === 'user' ? 'items-start' : 'items-end'}`}>
                      <div className={`p-3 rounded-2xl max-w-[85%] text-sm ${
                        msg.role === 'user' 
                          ? 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'
                          : 'bg-primary text-white rounded-tr-sm'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1">
                        {format(new Date(msg.timestamp), 'HH:mm')} • {msg.role === 'admin' ? 'Admin' : msg.role === 'model' ? 'AI' : 'User'}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50">
                <form onSubmit={handleReply} className="relative flex items-center">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply to the user..."
                    className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                  <button 
                    type="submit"
                    disabled={!replyText.trim()}
                    className="absolute right-2 p-1.5 bg-primary text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
              <p>Select a chat session from the list to view and reply to messages.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
