import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { PhoneCall, Calendar, User, Phone, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface AILead {
  id: string;
  name: string;
  schoolName: string;
  contactInfo: string;
  requirements: string;
  createdAt: string;
  status: 'new' | 'contacted' | 'qualified';
}

export default function AILogsDashboard({ onBack }: { onBack: () => void }) {
  const [leads, setLeads] = useState<AILead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'ai_leads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLeads = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AILead[];
      setLeads(fetchedLeads);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'ai_leads', id), { status: newStatus });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <PhoneCall className="w-6 h-6 text-primary" /> AI Voice Leads
          </h1>
          <p className="text-sm text-slate-500 font-medium">Manage leads captured by the Appulence Champion.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
            <Clock className="w-4 h-4 text-amber-500" /> New Leads
          </div>
          <div className="text-3xl font-black text-slate-800">{leads.filter(l => l.status === 'new').length}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
            <Phone className="w-4 h-4 text-blue-500" /> Contacted
          </div>
          <div className="text-3xl font-black text-slate-800">{leads.filter(l => l.status === 'contacted').length}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
            <CheckCircle className="w-4 h-4 text-emerald-500" /> Qualified
          </div>
          <div className="text-3xl font-black text-slate-800">{leads.filter(l => l.status === 'qualified').length}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="p-4">Contact</th>
                <th className="p-4">School</th>
                <th className="p-4">Requirements</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="p-4 text-center text-slate-400">Loading leads...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center text-slate-400">No leads captured yet.</td></tr>
              ) : (
                leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-800 text-sm">{lead.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {lead.contactInfo}
                      </div>
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-700">{lead.schoolName}</td>
                    <td className="p-4 text-xs text-slate-600 max-w-xs truncate">{lead.requirements}</td>
                    <td className="p-4 text-xs text-slate-500 whitespace-nowrap">
                      {format(new Date(lead.createdAt), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="p-4">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className={`text-xs font-bold uppercase px-2 py-1 rounded-full outline-none border cursor-pointer
                          ${lead.status === 'new' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                            lead.status === 'contacted' ? 'bg-blue-50 text-blue-600 border-blue-200' : 
                            'bg-emerald-50 text-emerald-600 border-emerald-200'}
                        `}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
