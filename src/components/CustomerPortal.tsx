import React, { useState, useEffect } from 'react';
import { 
  Building, 
  FileText, 
  Briefcase, 
  DollarSign, 
  Loader2, 
  LogOut, 
  ExternalLink, 
  ChevronRight, 
  Clock, 
  ShieldCheck, 
  CornerDownRight, 
  Plus, 
  HelpCircle,
  TrendingUp,
  FileSpreadsheet,
  Check,
  X,
  Eye,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Deal {
  id?: string;
  name: string;
  status: string;
  value: string;
  customerId: string;
  createdAt: string;
}

interface Quote {
  id: string;
  title?: string;
  amount?: string;
  quoteNumber?: string;
  status: string;
  customerId: string;
  createdAt: string;
  lineItems?: Array<{
    catalogItemId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discountPercent: number;
  }>;
  subtotal?: number;
  taxPercent?: number;
  taxAmount?: number;
  total?: number;
  notes?: string;
  validUntil?: string;
  sentAt?: string;
  respondedAt?: string;
  version?: number;
  isLatest?: boolean;
}

interface CustomerDoc {
  id?: string;
  companyName: string;
  customerId: string;
  domain: string;
}

export default function CustomerPortal() {
  const { user, customerId, signOut } = useAuth();
  
  const [customer, setCustomer] = useState<CustomerDoc | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'deals' | 'quotes'>('overview');

  const [newDealName, setNewDealName] = useState('');
  const [newDealValue, setNewDealValue] = useState('');
  const [showAddDeal, setShowAddDeal] = useState(false);

  const [selectedCustomerQuote, setSelectedCustomerQuote] = useState<Quote | null>(null);
  const [showQuoteDetail, setShowQuoteDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleCustomerResponse = async (quoteId: string, status: 'Accepted' | 'Rejected') => {
    setActionLoading(true);
    try {
      const quoteRef = doc(db, 'quotes', quoteId);
      const now = new Date().toISOString();
      await updateDoc(quoteRef, {
        status: status,
        respondedAt: now
      });

      // Update local state in quotes list
      setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, status, respondedAt: now } : q));
      // Update selected modal state
      if (selectedCustomerQuote && selectedCustomerQuote.id === quoteId) {
        setSelectedCustomerQuote(prev => prev ? { ...prev, status, respondedAt: now } : null);
      }
      alert(`Successfully marked proposal as ${status}!`);
    } catch (err) {
      console.error("Error updating quote decision:", err);
      alert("Failed to update status. Please make sure the quote is still in 'Sent' status.");
    } finally {
      setActionLoading(false);
    }
  };

  const fetchPortalData = async () => {
    if (!customerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch Company info from /customers matching customerId
      const customersRef = collection(db, 'customers');
      const customerQuery = query(customersRef, where('customerId', '==', customerId));
      const customerSnap = await getDocs(customerQuery);
      if (!customerSnap.empty) {
        const doc = customerSnap.docs[0];
        setCustomer({ id: doc.id, ...doc.data() } as CustomerDoc);
      } else {
        setCustomer(null);
      }

      // 2. Fetch Deals matching customerId
      const dealsRef = collection(db, 'deals');
      const dealsQuery = query(dealsRef, where('customerId', '==', customerId));
      const dealsSnap = await getDocs(dealsQuery);
      const dealsList = dealsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deal));
      setDeals(dealsList);

      // 3. Fetch Quotes matching customerId
      const quotesRef = collection(db, 'quotes');
      const quotesQuery = query(quotesRef, where('customerId', '==', customerId));
      const quotesSnap = await getDocs(quotesQuery);
      const quotesList = quotesSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Quote))
        .filter(q => q.isLatest !== false);
      setQuotes(quotesList);

    } catch (err) {
      console.error("Error loading secure client portal records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, [customerId]);

  const handleSeedData = async () => {
    if (!customerId) return;
    setSeeding(true);

    try {
      // Create Company if missing
      const customersRef = collection(db, 'customers');
      const customerQuery = query(customersRef, where('customerId', '==', customerId));
      const customerSnap = await getDocs(customerQuery);
      if (customerSnap.empty) {
        await addDoc(collection(db, 'customers'), {
          companyName: user?.displayName ? `${user.displayName.split(' ')[0]}'s Educational Trust` : 'Acme Global Academies',
          customerId,
          domain: 'education.ac.za',
          createdAt: new Date().toISOString()
        });
      }

      // Create initial deal
      await addDoc(collection(db, 'deals'), {
        name: 'Appulence Standard School Onboarding',
        status: 'In Deployment Phase',
        value: 'R145,000.00',
        customerId,
        createdAt: new Date().toISOString()
      });

      // Create initial quote
      await addDoc(collection(db, 'quotes'), {
        title: 'Custom LMS Core & Biometrics SLA',
        amount: 'R8,500.00 / month',
        status: 'Approved & Signed',
        customerId,
        createdAt: new Date().toISOString()
      });

      await fetchPortalData();
    } catch (err) {
      console.error("Error seeding secure data:", err);
    } finally {
      setSeeding(false);
    }
  };

  const handleAddDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealName.trim() || !newDealValue.trim() || !customerId) return;

    try {
      await addDoc(collection(db, 'deals'), {
        name: newDealName,
        status: 'Lead Scoped',
        value: `R${newDealValue}`,
        customerId,
        createdAt: new Date().toISOString()
      });
      setNewDealName('');
      setNewDealValue('');
      setShowAddDeal(false);
      await fetchPortalData();
    } catch (err) {
      console.error("Failed to add customer deal:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 gap-3">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">Entering Secure Client Node...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Top Bar Navigation */}
      <nav className="bg-white border-b border-slate-200/80 sticky top-0 z-40">
        <div className="max-w-[1280px] mx-auto px-4 md:px-12 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src="https://eudorawater.xyz/wp-content/uploads/2026/07/Unique_logo_for_Appulence_Tech_202606220852-1-scaled.jpeg" 
              alt="Appulence Logo" 
              className="w-9 h-9 rounded-lg object-cover border border-slate-100"
              referrerPolicy="no-referrer"
            />
            <div className="leading-none">
              <span className="text-sm font-black tracking-tighter text-slate-900 block uppercase">Appulence Portal</span>
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Client Terminal</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {customerId && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-[10px] uppercase font-black tracking-wider rounded-full border border-primary/10">
                <ShieldCheck className="w-3.5 h-3.5" /> ID Claim: {customerId}
              </span>
            )}
            <button 
              onClick={signOut}
              className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-wider text-slate-500 hover:text-red-600 transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-[1280px] mx-auto w-full px-4 md:px-12 py-10 space-y-8">
        
        {/* Welcome Block */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg border border-slate-800">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-4 relative z-10 max-w-2xl">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-400/20 rounded-full text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Client Profile Secured
            </span>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-none">
              Welcome, {user?.displayName || user?.email?.split('@')[0]}
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              This terminal is partition-secured. Through custom claims verification, your active contracts, budget allocations, and service levels are fetched in real-time.
            </p>
            {customer ? (
              <div className="pt-2 flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-200 uppercase">{customer.companyName}</span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">{customer.domain}</span>
              </div>
            ) : (
              <div className="pt-3 flex flex-wrap items-center gap-3">
                <p className="text-xs text-amber-300/90 font-medium">No company mapping initialized in Firestore customers collection yet.</p>
                <button
                  onClick={handleSeedData}
                  disabled={seeding}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-[10px] font-black uppercase tracking-wider rounded-xl active:scale-95 transition-all shadow flex items-center gap-1.5"
                >
                  {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Bootstrap Sample Data
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard Panels */}
        {customer && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm space-y-2">
              <span className="p-2 bg-emerald-50 text-emerald-700 rounded-lg inline-block">
                <Briefcase className="w-5 h-5" />
              </span>
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Solutions</div>
              <div className="text-xl font-black text-slate-900">{deals.length} Active System{deals.length > 1 ? 's' : ''}</div>
              <p className="text-[11px] text-slate-400">Deployed and managed systems in full integration.</p>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm space-y-2">
              <span className="p-2 bg-blue-50 text-blue-700 rounded-lg inline-block">
                <DollarSign className="w-5 h-5" />
              </span>
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Approved Quotes</div>
              <div className="text-xl font-black text-slate-900">{quotes.filter(q => q.status.includes('Approved')).length} Active contract{quotes.filter(q => q.status.includes('Approved')).length > 1 ? 's' : ''}</div>
              <p className="text-[11px] text-slate-400">Monthly support licenses and SLA compliance status.</p>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm space-y-2">
              <span className="p-2 bg-purple-50 text-purple-700 rounded-lg inline-block">
                <FileText className="w-5 h-5" />
              </span>
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest">SLA Priority Response</div>
              <div className="text-xl font-black text-slate-900">4 Hours</div>
              <p className="text-[11px] text-slate-400">Guaranteed uptime with instant failover cloud containers.</p>
            </div>
          </div>
        )}

        {/* Core Tab Sections */}
        {customer && (
          <div className="space-y-6">
            <div className="flex border-b border-slate-200/80 text-xs font-bold gap-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-3 border-b-2 transition-all cursor-pointer uppercase tracking-wider ${
                  activeTab === 'overview'
                    ? 'border-primary text-slate-900 font-black'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                At a Glance
              </button>
              <button
                onClick={() => setActiveTab('deals')}
                className={`py-3 border-b-2 transition-all cursor-pointer uppercase tracking-wider ${
                  activeTab === 'deals'
                    ? 'border-primary text-slate-900 font-black'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Systems & Deployments ({deals.length})
              </button>
              <button
                onClick={() => setActiveTab('quotes')}
                className={`py-3 border-b-2 transition-all cursor-pointer uppercase tracking-wider ${
                  activeTab === 'quotes'
                    ? 'border-primary text-slate-900 font-black'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Budget SLA & Quotes ({quotes.length})
              </button>
            </div>

            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* Active Pipelines */}
                <div className="bg-white border border-slate-200/80 p-6 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">System Deployment Timeline</h3>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Uptime Monitor</span>
                  </div>

                  {deals.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No deployments found. Select the deployments tab to configure one.</p>
                  ) : (
                    <div className="space-y-4">
                      {deals.map((deal) => (
                        <div key={deal.id} className="flex gap-3">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 animate-pulse" />
                          <div className="space-y-1">
                            <div className="text-xs font-bold text-slate-800">{deal.name}</div>
                            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Status: {deal.status} • Value: {deal.value}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Secure Documents */}
                <div className="bg-white border border-slate-200/80 p-6 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">Signed SLA Documents</h3>
                    <span className="text-[10px] text-primary font-black uppercase flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Checked
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="text-emerald-600 w-4 h-4" />
                        <div>
                          <div className="text-xs font-bold text-slate-800">Master Service Level SLA.pdf</div>
                          <div className="text-[9px] text-slate-400 uppercase font-black">Contract Terms • signed v2.4</div>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-slate-600" />
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="text-blue-600 w-4 h-4" />
                        <div>
                          <div className="text-xs font-bold text-slate-800">Custom Cloud Database Config.json</div>
                          <div className="text-[9px] text-slate-400 uppercase font-black">Server Specs • active partition</div>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-slate-600" />
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB: DEALS */}
            {activeTab === 'deals' && (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">Configured Systems</h3>
                    <p className="text-xs text-slate-400">Database node containers registered under your educational group partition.</p>
                  </div>
                  <button 
                    onClick={() => setShowAddDeal(!showAddDeal)}
                    className="px-4 py-2 border border-slate-200 hover:border-slate-300 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-slate-700"
                  >
                    <Plus className="w-4 h-4" /> Register New Deployment
                  </button>
                </div>

                {showAddDeal && (
                  <form onSubmit={handleAddDeal} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-4 animate-fade-in max-w-md">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Deploy New Component</h4>
                    
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Component / System Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Biometric Turnstile Server Module"
                        value={newDealName}
                        onChange={(e) => setNewDealName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Estimated Value (ZAR, numbers only)</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. 45,000.00"
                        value={newDealValue}
                        onChange={(e) => setNewDealValue(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-primary"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-[10px] font-black uppercase tracking-widest rounded-xl"
                    >
                      Initialize Deployment Node
                    </button>
                  </form>
                )}

                <div className="grid gap-3">
                  {deals.map((deal) => (
                    <div key={deal.id} className="p-4 bg-slate-50 hover:bg-slate-100/50 rounded-2xl border border-slate-100 flex justify-between items-center gap-4 transition-all">
                      <div className="space-y-1">
                        <div className="text-xs font-black text-slate-800 uppercase tracking-wide">{deal.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Value: {deal.value} • Configured: {deal.createdAt ? new Date(deal.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-700 text-[9px] font-black uppercase tracking-wider rounded-full">
                        {deal.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: QUOTES */}
            {activeTab === 'quotes' && (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">Custom System Quotes & SLAs</h3>
                  <p className="text-xs text-slate-400">Review pending budgets, line item breakdowns, and binding service level agreements.</p>
                </div>

                <div className="grid gap-4">
                  {quotes.map((quote) => {
                    const isStructured = !!quote.quoteNumber;
                    return (
                      <div 
                        key={quote.id} 
                        onClick={() => {
                          if (isStructured) {
                            setSelectedCustomerQuote(quote);
                            setShowQuoteDetail(true);
                          }
                        }}
                        className={`p-5 rounded-2xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${
                          isStructured ? 'bg-slate-50 hover:bg-slate-100/50 cursor-pointer shadow-sm' : 'bg-slate-50'
                        }`}
                      >
                        <div className="space-y-1.5 flex-grow text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                              {isStructured ? `${quote.quoteNumber} (Version V${quote.version || 1})` : quote.title}
                            </span>
                            {isStructured && (
                              <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-wider rounded-md">
                                Detailed SLA
                              </span>
                            )}
                          </div>
                          
                          <div className="text-[10px] text-slate-400 font-semibold flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span>
                              Cost: <strong className="text-slate-900 font-bold">{isStructured ? `R ${(quote.total || 0).toLocaleString('en-ZA')}` : quote.amount}</strong>
                            </span>
                            <span>•</span>
                            <span>Created: {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : 'N/A'}</span>
                            {isStructured && quote.validUntil && (
                              <>
                                <span>•</span>
                                <span className="text-slate-500 font-bold">Valid Until: {new Date(quote.validUntil).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0" onClick={(e) => e.stopPropagation()}>
                          <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-full border ${
                            quote.status === 'Accepted' || quote.status === 'Approved & Signed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            quote.status === 'Sent' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            quote.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                            'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {quote.status}
                          </span>

                          {isStructured && (
                            <button
                              onClick={() => {
                                setSelectedCustomerQuote(quote);
                                setShowQuoteDetail(true);
                              }}
                              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[9px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" /> View Details
                            </button>
                          )}

                          {isStructured && quote.status === 'Sent' && (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleCustomerResponse(quote.id, 'Accepted')}
                                disabled={actionLoading}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase tracking-wider rounded-lg flex items-center gap-0.5 transition-all cursor-pointer"
                                title="Accept proposal terms"
                              >
                                <Check className="w-3.5 h-3.5" /> Accept
                              </button>
                              <button
                                onClick={() => handleCustomerResponse(quote.id, 'Rejected')}
                                disabled={actionLoading}
                                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-black uppercase tracking-wider rounded-lg flex items-center gap-0.5 transition-all cursor-pointer"
                                title="Reject proposal terms"
                              >
                                <X className="w-3.5 h-3.5" /> Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Support Callout */}
        <div className="p-5 bg-slate-100 border border-slate-200/50 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-primary" /> Dedicated Portal Assistance
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Facing problems with your deployed biometric databases or custom client schemas? Reach out directly to your assigned Appulence Technical Account Manager.
            </p>
          </div>
          <button className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm shrink-0">
            Submit Priority Ticket
          </button>
        </div>

      </main>

      {/* CUSTOMER QUOTE DETAIL MODAL */}
      {showQuoteDetail && selectedCustomerQuote && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-3xl border border-outline-variant/15 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8 space-y-6 animate-scale-up text-slate-800">
            
            <div className="flex justify-between items-center border-b pb-4 text-left">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase text-primary tracking-widest bg-primary/5 border border-primary/10 px-2.5 py-1 rounded-full">
                  Detailed Commercial SLA
                </span>
                <h3 className="text-lg font-black text-slate-900 uppercase">
                  {selectedCustomerQuote.quoteNumber} <span className="text-xs text-slate-400 font-bold">V{selectedCustomerQuote.version}</span>
                </h3>
              </div>
              <button 
                onClick={() => setShowQuoteDetail(false)}
                className="p-1.5 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct Accept/Reject Banner */}
            {selectedCustomerQuote.status === 'Sent' && (
              <div className="p-4 bg-blue-50 border border-blue-100 text-blue-800 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs text-left">
                <div className="space-y-1">
                  <span className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-blue-600 animate-pulse" /> Decision Required
                  </span>
                  <p className="text-[11px] leading-relaxed text-blue-700">
                    Review the solution mappings, price breakdowns, and SLA terms below. Choose to Accept or Reject to update legal contract systems.
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleCustomerResponse(selectedCustomerQuote.id, 'Accepted')}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Accept Proposal
                  </button>
                  <button
                    onClick={() => handleCustomerResponse(selectedCustomerQuote.id, 'Rejected')}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            )}

            {/* If responded already */}
            {(selectedCustomerQuote.status === 'Accepted' || selectedCustomerQuote.status === 'Rejected') && (
              <div className={`p-4 rounded-2xl text-xs flex items-center gap-3 border text-left ${
                selectedCustomerQuote.status === 'Accepted' 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                  : 'bg-rose-50 border-rose-100 text-rose-800'
              }`}>
                <CheckCircle className="w-5 h-5 shrink-0 animate-pulse" />
                <div>
                  <span className="font-bold uppercase tracking-wider block text-[10px]">
                    Decision Logged • Status: {selectedCustomerQuote.status}
                  </span>
                  <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                    You responded to this proposal. Mapped systems and SLAs are synchronizing.
                  </p>
                </div>
              </div>
            )}

            {/* Document sheet */}
            <div className="border border-slate-100 rounded-2xl p-6 space-y-6 bg-slate-50/30 text-left">
              
              <div className="flex justify-between items-start border-b pb-4 text-xs text-slate-600">
                <div>
                  <span className="font-bold text-slate-900 block uppercase">Mapped Solutions SLA</span>
                  <p className="text-[10px] text-slate-400">Appulence Technology Group</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800">{customer?.companyName || 'Corporate Account'}</p>
                  <p className="text-slate-400 text-[10px]">{customer?.domain || ''}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Solution Details</span>
                <div className="border rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 border-b text-[9px] font-black uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="py-2 px-4">Description</th>
                        <th className="py-2 px-4 text-center">Qty</th>
                        <th className="py-2 px-4 text-right">Rate</th>
                        <th className="py-2 px-4 text-center">Disc</th>
                        <th className="py-2 px-4 text-right">Amount (ZAR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedCustomerQuote.lineItems?.map((item, idx) => {
                        const itemSub = item.quantity * item.unitPrice;
                        const disc = itemSub * (item.discountPercent / 100);
                        const itemTotal = itemSub - disc;
                        return (
                          <tr key={idx} className="text-slate-700">
                            <td className="py-2.5 px-4 font-bold">{item.description}</td>
                            <td className="py-2.5 px-4 text-center font-bold text-slate-500">{item.quantity}</td>
                            <td className="py-2.5 px-4 text-right">R {item.unitPrice.toLocaleString('en-ZA')}</td>
                            <td className="py-2.5 px-4 text-center text-rose-600 font-bold">{item.discountPercent}%</td>
                            <td className="py-2.5 px-4 text-right font-black text-slate-900">R {itemTotal.toLocaleString('en-ZA')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Price summary */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-xs font-semibold text-slate-500">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-bold text-slate-800">R {(selectedCustomerQuote.subtotal || 0).toLocaleString('en-ZA')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (VAT {selectedCustomerQuote.taxPercent}%):</span>
                    <span className="font-bold text-slate-800">R {(selectedCustomerQuote.taxAmount || 0).toLocaleString('en-ZA')}</span>
                  </div>
                  <div className="border-t border-slate-200 my-1 pt-2 flex justify-between items-center text-sm font-bold text-slate-900">
                    <span>Grand Total:</span>
                    <span className="font-black text-primary">R {(selectedCustomerQuote.total || 0).toLocaleString('en-ZA')}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedCustomerQuote.notes && (
                <div className="p-4 bg-white rounded-xl border border-slate-100 text-[11px] leading-relaxed text-slate-500 italic space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-400 not-italic block">Notes & Terms</span>
                  {selectedCustomerQuote.notes}
                </div>
              )}

            </div>

            {/* Footer dismiss */}
            <div className="flex justify-end border-t pt-4">
              <button
                onClick={() => setShowQuoteDetail(false)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px] rounded-xl cursor-pointer"
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
