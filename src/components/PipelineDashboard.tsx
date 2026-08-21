import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Briefcase, 
  Plus, 
  Filter, 
  Search, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  User, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Layers, 
  Loader2, 
  ChevronRight, 
  UserPlus, 
  ArrowUpRight, 
  Phone, 
  Mail, 
  Globe, 
  Building, 
  Tag, 
  MessageSquare,
  AlertCircle,
  HelpCircle,
  FolderMinus,
  CalendarDays,
  Sparkles,
  Award,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  getDocs, 
  onSnapshot,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Deal, DealActivity, DealStage, Customer } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface PipelineDashboardProps {
  onBack: () => void;
}

const STAGES: { stage: DealStage; color: string; bg: string; border: string; text: string }[] = [
  { stage: 'Lead', color: 'bg-slate-500', bg: 'bg-slate-50/50', border: 'border-slate-200/60', text: 'text-slate-700' },
  { stage: 'Qualified', color: 'bg-blue-500', bg: 'bg-blue-50/20', border: 'border-blue-100', text: 'text-blue-700' },
  { stage: 'Proposal Sent', color: 'bg-purple-500', bg: 'bg-purple-50/20', border: 'border-purple-100', text: 'text-purple-700' },
  { stage: 'Negotiation', color: 'bg-amber-500', bg: 'bg-amber-50/20', border: 'border-amber-100', text: 'text-amber-700' },
  { stage: 'Won', color: 'bg-emerald-500', bg: 'bg-emerald-50/30', border: 'border-emerald-100', text: 'text-emerald-700' },
  { stage: 'Lost', color: 'bg-rose-500', bg: 'bg-rose-50/20', border: 'border-rose-100', text: 'text-rose-700' }
];

export default function PipelineDashboard({ onBack }: PipelineDashboardProps) {
  const { user, role } = useAuth();
  const isAdmin = role === 'admin';
  const isSalesRep = role === 'sales_rep';

  // Data State
  const [deals, setDeals] = useState<Deal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesReps, setSalesReps] = useState<{ uid: string; email: string; name?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [ownerFilter, setOwnerFilter] = useState<string>('all'); // 'all', 'mine', or specific UID
  const [searchQuery, setSearchQuery] = useState('');

  // Deal detail panel
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [activities, setActivities] = useState<DealActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Add Activity inside Details
  const [newActivityType, setNewActivityType] = useState<'call' | 'email' | 'meeting' | 'task'>('call');
  const [newActivityNotes, setNewActivityNotes] = useState('');
  const [newActivityDueDate, setNewActivityDueDate] = useState('');

  // Customer inline detail modal
  const [focusedCustomer, setFocusedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Deal Forms State (New / Edit)
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Individual Form Fields
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formStage, setFormStage] = useState<DealStage>('Lead');
  const [formValue, setFormValue] = useState('');
  const [formProbability, setFormProbability] = useState('20');
  const [formOwnerId, setFormOwnerId] = useState('');
  const [formExpectedCloseDate, setFormExpectedCloseDate] = useState('');
  const [formLostReason, setFormLostReason] = useState('');

  // Drag and drop helper state for prompting Lost Reason
  const [showLostReasonModal, setShowLostReasonModal] = useState(false);
  const [lostReasonTargetDealId, setLostReasonTargetDealId] = useState<string | null>(null);
  const [dragLostReasonText, setDragLostReasonText] = useState('');

  // Set default Owner filter based on role
  useEffect(() => {
    if (isSalesRep && user) {
      setOwnerFilter('mine');
    } else {
      setOwnerFilter('all');
    }
  }, [user, role]);

  // Sync Users lists (Admins only)
  useEffect(() => {
    if (!isAdmin) return;
    const fetchUsers = async () => {
      try {
        const idToken = await user?.getIdToken();
        const response = await fetch('/api/users', {
          headers: { 'Authorization': `Bearer ${idToken}` }
        });
        if (response.ok) {
          const data = await response.json();
          const list = (data.users || []).map((u: any) => ({
            uid: u.uid,
            email: u.email,
            name: u.name || u.email.split('@')[0]
          }));
          setSalesReps(list);
        }
      } catch (err) {
        console.error("Error loading team list: ", err);
      }
    };
    fetchUsers();
  }, [user, isAdmin]);

  // Sync /customers collection for selects
  useEffect(() => {
    if (!user) return;
    const customersRef = collection(db, 'customers');
    let q = query(customersRef);
    if (isSalesRep) {
      q = query(customersRef, where('ownerId', '==', user.uid));
    }
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Customer[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Customer);
      });
      setCustomers(list);
    }, (err) => {
      console.error(err);
    });
    return () => unsubscribe();
  }, [user, isSalesRep]);

  // Sync /deals collection
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const dealsRef = collection(db, 'deals');
    const q = query(dealsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Deal[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Deal);
      });
      setDeals(list);
      setLoading(false);
    }, (error) => {
      console.error("Error syncing pipeline deals: ", error);
      handleFirestoreError(error, OperationType.GET, 'deals');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Sync activities of selected deal
  useEffect(() => {
    if (!selectedDeal || !showDetailModal) {
      setActivities([]);
      return;
    }
    setActivitiesLoading(true);
    const activitiesRef = collection(db, 'deals', selectedDeal.id, 'activities');
    const q = query(activitiesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: DealActivity[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as DealActivity);
      });
      setActivities(list);
      setActivitiesLoading(false);
    }, (error) => {
      console.error("Activities load error: ", error);
      setActivitiesLoading(false);
    });

    return () => unsubscribe();
  }, [selectedDeal, showDetailModal]);

  // Filter Deals based on choices
  const filteredDeals = deals.filter(deal => {
    // Owner Filter
    if (ownerFilter === 'mine') {
      if (deal.ownerId !== user?.uid) return false;
    } else if (ownerFilter !== 'all') {
      if (deal.ownerId !== ownerFilter) return false;
    }

    // Search Query
    if (searchQuery.trim()) {
      const queryLower = searchQuery.toLowerCase();
      const customer = customers.find(c => c.id === deal.customerId);
      const matchesTitle = deal.title.toLowerCase().includes(queryLower);
      const matchesCustomer = customer ? customer.name.toLowerCase().includes(queryLower) : false;
      const matchesOwner = deal.ownerName ? deal.ownerName.toLowerCase().includes(queryLower) : false;
      return matchesTitle || matchesCustomer || matchesOwner;
    }

    return true;
  });

  // Calculate high-level pipeline metrics
  const totalPipelineValue = filteredDeals.reduce((sum, deal) => {
    if (deal.stage !== 'Lost') {
      return sum + deal.value;
    }
    return sum;
  }, 0);

  const wonDealsCount = filteredDeals.filter(d => d.stage === 'Won').length;
  const wonDealsValue = filteredDeals.filter(d => d.stage === 'Won').reduce((sum, d) => sum + d.value, 0);

  // Form Initializations
  const openNewDealForm = () => {
    setEditingDeal(null);
    setFormCustomerId('');
    setFormTitle('');
    setFormStage('Lead');
    setFormValue('');
    setFormProbability('20');
    setFormOwnerId(user?.uid || '');
    setFormExpectedCloseDate('');
    setFormLostReason('');
    setFormError(null);
    setShowFormModal(true);
  };

  const openEditDealForm = (deal: Deal) => {
    // Only admins or owner of the deal can edit
    if (!isAdmin && deal.ownerId !== user?.uid) {
      alert("You do not have permission to edit this deal.");
      return;
    }
    setEditingDeal(deal);
    setFormCustomerId(deal.customerId);
    setFormTitle(deal.title);
    setFormStage(deal.stage);
    setFormValue(deal.value.toString());
    setFormProbability(deal.probability.toString());
    setFormOwnerId(deal.ownerId);
    setFormExpectedCloseDate(deal.expectedCloseDate);
    setFormLostReason(deal.lostReason || '');
    setFormError(null);
    setShowFormModal(true);
  };

  // Submit deal handler
  const handleDealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formCustomerId) {
      setFormError("Please select a linked customer.");
      return;
    }
    if (!formTitle.trim()) {
      setFormError("A descriptive deal title is required.");
      return;
    }
    const parsedVal = parseFloat(formValue);
    if (isNaN(parsedVal) || parsedVal < 0) {
      setFormError("Please enter a valid deal value (positive amount).");
      return;
    }

    const probVal = parseInt(formProbability);
    if (isNaN(probVal) || probVal < 0 || probVal > 100) {
      setFormError("Probability percentage must be between 0 and 100.");
      return;
    }

    if (!formExpectedCloseDate) {
      setFormError("Expected close date is required.");
      return;
    }

    if (formStage === 'Lost' && !formLostReason.trim()) {
      setFormError("A descriptive lost reason must be provided when flagging a deal as Lost.");
      return;
    }

    // Resolve owner details
    let resolvedOwnerName = user?.displayName || user?.email?.split('@')[0] || '';
    let resolvedOwnerEmail = user?.email || '';

    if (isAdmin && formOwnerId !== user?.uid) {
      const rep = salesReps.find(r => r.uid === formOwnerId);
      if (rep) {
        resolvedOwnerName = rep.name || rep.email.split('@')[0];
        resolvedOwnerEmail = rep.email;
      }
    }

    try {
      const now = new Date().toISOString();
      const payload: Omit<Deal, 'id'> = {
        customerId: formCustomerId,
        title: formTitle.trim(),
        stage: formStage,
        value: parsedVal,
        probability: probVal,
        ownerId: formOwnerId || user?.uid || '',
        ownerName: resolvedOwnerName,
        ownerEmail: resolvedOwnerEmail,
        expectedCloseDate: formExpectedCloseDate,
        updatedAt: now,
        lostReason: formStage === 'Lost' ? formLostReason.trim() : undefined,
        createdAt: editingDeal ? editingDeal.createdAt : now
      };

      if (editingDeal) {
        const docRef = doc(db, 'deals', editingDeal.id);
        await updateDoc(docRef, { ...payload });
        // If this deal is currently being viewed, update details
        if (selectedDeal?.id === editingDeal.id) {
          setSelectedDeal({ id: editingDeal.id, ...payload });
        }
      } else {
        const collectionRef = collection(db, 'deals');
        await addDoc(collectionRef, { ...payload });
      }

      setShowFormModal(false);
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, editingDeal ? OperationType.UPDATE : OperationType.CREATE, editingDeal ? `deals/${editingDeal.id}` : 'deals');
      setFormError("Failed to store deal in cloud datastore.");
    }
  };

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('text/plain', dealId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStage: DealStage) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('text/plain');
    if (!dealId) return;

    const deal = deals.find(d => d.id === dealId);
    if (!deal) return;

    // Check write rules
    if (!isAdmin && deal.ownerId !== user?.uid) {
      alert("You do not have permission to modify this deal.");
      return;
    }

    if (targetStage === 'Lost') {
      setLostReasonTargetDealId(dealId);
      setDragLostReasonText('');
      setShowLostReasonModal(true);
    } else {
      try {
        const dealRef = doc(db, 'deals', dealId);
        await updateDoc(dealRef, {
          stage: targetStage,
          lostReason: null, // Clear lost reason if reactivated
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error(err);
        handleFirestoreError(err, OperationType.UPDATE, `deals/${dealId}`);
      }
    }
  };

  // Submit lost reason for drag & drop
  const handleDragLostReasonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dragLostReasonText.trim()) {
      alert("Please provide a reason.");
      return;
    }
    if (!lostReasonTargetDealId) return;

    try {
      const dealRef = doc(db, 'deals', lostReasonTargetDealId);
      await updateDoc(dealRef, {
        stage: 'Lost',
        lostReason: dragLostReasonText.trim(),
        updatedAt: new Date().toISOString()
      });
      setShowLostReasonModal(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    }
  };

  // Create Activity Handler
  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeal || !newActivityNotes.trim()) return;

    try {
      const activitiesRef = collection(db, 'deals', selectedDeal.id, 'activities');
      await addDoc(activitiesRef, {
        type: newActivityType,
        notes: newActivityNotes.trim(),
        dueDate: newActivityDueDate || undefined,
        completed: false,
        createdBy: user?.uid || '',
        createdByEmail: user?.email || '',
        createdAt: new Date().toISOString()
      });

      // Clear input fields
      setNewActivityNotes('');
      setNewActivityDueDate('');
    } catch (err) {
      console.error(err);
      alert("Could not append activity task.");
    }
  };

  // Complete Activity Handler
  const handleToggleActivityComplete = async (activity: DealActivity) => {
    if (!selectedDeal) return;
    try {
      const actRef = doc(db, 'deals', selectedDeal.id, 'activities', activity.id);
      await updateDoc(actRef, {
        completed: !activity.completed
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Deal Handler
  const handleDeleteDeal = async (dealId: string) => {
    if (!isAdmin) {
      alert("Only administrative roles can delete high-priority pipeline assets.");
      return;
    }
    if (confirm("Are you absolutely sure you want to permanently delete this sales deal? This action is irreversible.")) {
      try {
        await deleteDoc(doc(db, 'deals', dealId));
        setShowDetailModal(false);
      } catch (err) {
        console.error(err);
        handleFirestoreError(err, OperationType.DELETE, `deals/${dealId}`);
      }
    }
  };

  // View Customer detail handler
  const handleViewCustomerDetail = (customerId: string) => {
    const cust = customers.find(c => c.id === customerId);
    if (cust) {
      setFocusedCustomer(cust);
      setShowCustomerModal(true);
    } else {
      alert("Customer info could not be found.");
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-12 py-10 space-y-8 animate-fade-in relative">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/15 pb-6">
        <div className="space-y-1">
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider hover:opacity-80 transition-all mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Workspace
          </button>
          <h2 className="font-headline-md text-3xl font-black text-on-surface uppercase tracking-tight flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-primary" /> Corporate Sales Pipeline
          </h2>
          <p className="text-sm text-on-surface-variant">
            Manage corporate leads, qualification matrices, contract proposals, and win ratios.
          </p>
        </div>

        {/* Add Deal Trigger */}
        <div>
          <button
            onClick={openNewDealForm}
            className="px-6 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-full shadow-md hover:shadow-lg hover:scale-103 active:scale-97 transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4.5 h-4.5" /> Add Sales Deal
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-outline-variant/15 rounded-3xl p-6 flex items-center gap-5 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center border border-primary/10">
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Active Pipeline Value</span>
            <div className="text-xl font-black text-slate-800">
              R {totalPipelineValue.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-outline-variant/15 rounded-3xl p-6 flex items-center gap-5 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <Award className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Contracts Won</span>
            <div className="text-xl font-black text-emerald-700">
              {wonDealsCount} ({wonDealsValue > 0 ? `R ${wonDealsValue.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}` : '0.00'})
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-outline-variant/15 rounded-3xl p-6 flex items-center gap-5 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <Layers className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Active Engagements</span>
            <div className="text-xl font-black text-purple-700">
              {filteredDeals.filter(d => d.stage !== 'Won' && d.stage !== 'Lost').length} Projects
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-outline-variant/15 rounded-3xl p-6 flex items-center gap-5 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-100">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Conversion Ratio</span>
            <div className="text-xl font-black text-slate-700">
              {filteredDeals.length > 0 
                ? `${Math.round((filteredDeals.filter(d => d.stage === 'Won').length / filteredDeals.length) * 100)}% Win Rate`
                : '0%'}
            </div>
          </div>
        </div>
      </div>

      {/* Searching & Filter Panel */}
      <div className="bg-white rounded-3xl border border-outline-variant/15 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search bar */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-on-surface-variant/50" />
            <input 
              type="text" 
              placeholder="Search deals, customers, or owners..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-outline-variant/15 rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* owner query dropdown */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Filter className="w-4 h-4 text-on-surface-variant shrink-0" />
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="w-full md:w-64 px-3 py-2.5 bg-slate-50 border border-outline-variant/15 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary/50"
            >
              {isAdmin ? (
                <>
                  <option value="all">Display All Owner Pipelines</option>
                  <option value="mine">Show Only My Deals</option>
                  {salesReps.map(rep => (
                    <option key={rep.uid} value={rep.uid}>Owner: {rep.name || rep.email}</option>
                  ))}
                </>
              ) : (
                <>
                  <option value="mine">Show Only My Deals</option>
                  <option value="all">Toggle Whole Team's Pipeline</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* KANBAN BOARD */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Synchronizing real-time sales pipelines...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-6">
          {STAGES.map(({ stage, color, bg, border, text }) => {
            const stageDeals = filteredDeals.filter(d => d.stage === stage);
            const totalStageValue = stageDeals.reduce((sum, d) => sum + d.value, 0);

            return (
              <div 
                key={stage}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage)}
                className={`flex flex-col min-h-[500px] rounded-3xl border ${border} ${bg} p-4 space-y-4`}
              >
                {/* Column Header */}
                <div className="flex justify-between items-start border-b border-outline-variant/10 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                      <h3 className="font-black uppercase text-[11px] tracking-wider text-slate-800">
                        {stage}
                      </h3>
                    </div>
                    <span className="text-[10px] text-on-surface-variant font-bold">
                      {stageDeals.length} {stageDeals.length === 1 ? 'deal' : 'deals'}
                    </span>
                  </div>
                  
                  {/* Total Amount Badge */}
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black tracking-wide ${text} bg-white/80 shadow-sm border border-outline-variant/5`}>
                    R {totalStageValue >= 1000 ? `${Math.round(totalStageValue / 1000)}k` : totalStageValue}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-grow space-y-3 overflow-y-auto max-h-[600px] pr-1">
                  {stageDeals.length === 0 ? (
                    <div className="h-28 border-2 border-dashed border-outline-variant/5 rounded-2xl flex items-center justify-center text-center p-3">
                      <span className="text-[10px] text-on-surface-variant/40 italic">Drag deals here</span>
                    </div>
                  ) : (
                    stageDeals.map((deal) => {
                      const linkedCustomer = customers.find(c => c.id === deal.customerId);
                      return (
                        <div
                          key={deal.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, deal.id)}
                          onClick={() => {
                            setSelectedDeal(deal);
                            setShowDetailModal(true);
                          }}
                          className="bg-white p-4 rounded-2xl border border-outline-variant/10 shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group space-y-3 relative overflow-hidden"
                        >
                          {/* Active Hover Glow */}
                          <div className={`absolute top-0 left-0 w-1 h-full ${color}`} />

                          {/* Top row */}
                          <div className="space-y-1">
                            {linkedCustomer && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewCustomerDetail(deal.customerId);
                                }}
                                className="text-[10px] font-black uppercase text-primary tracking-wider hover:underline flex items-center gap-1"
                              >
                                <Building className="w-3 h-3 text-primary" /> {linkedCustomer.name}
                              </button>
                            )}
                            <h4 className="text-xs font-black text-slate-800 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                              {deal.title}
                            </h4>
                          </div>

                          {/* Divider */}
                          <div className="border-t border-slate-100" />

                          {/* Price & Probability */}
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-700">
                              R {deal.value.toLocaleString('en-ZA')}
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                              {deal.probability}% Probability
                            </span>
                          </div>

                          {/* Bottom info */}
                          <div className="flex justify-between items-center text-[10px] text-on-surface-variant">
                            <span className="flex items-center gap-1 max-w-[100px] truncate" title={deal.ownerName}>
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{deal.ownerName || 'No owner'}</span>
                            </span>
                            <span className="flex items-center gap-1 font-semibold text-slate-500">
                              <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                              {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>

                          {/* Quick Transfer control for mobile fallback */}
                          <div className="flex lg:hidden justify-end pt-1 gap-1">
                            <select
                              value={deal.stage}
                              onChange={async (e) => {
                                e.stopPropagation();
                                const nextStage = e.target.value as DealStage;
                                if (nextStage === 'Lost') {
                                  setLostReasonTargetDealId(deal.id);
                                  setDragLostReasonText('');
                                  setShowLostReasonModal(true);
                                } else {
                                  try {
                                    const dealRef = doc(db, 'deals', deal.id);
                                    await updateDoc(dealRef, { stage: nextStage, updatedAt: new Date().toISOString() });
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }
                              }}
                              className="text-[9px] bg-slate-50 border rounded p-1"
                            >
                              {STAGES.map(s => (
                                <option key={s.stage} value={s.stage}>{s.stage}</option>
                              ))}
                            </select>
                          </div>

                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DEAL DETAIL MODAL */}
      {showDetailModal && selectedDeal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-3xl border border-outline-variant/15 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8 space-y-6 animate-scale-up">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-outline-variant/10 pb-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase text-primary tracking-widest bg-primary/5 border border-primary/10 px-2.5 py-1 rounded-full">
                  Pipeline Deal Detail
                </span>
                <h3 className="text-xl font-black text-on-surface uppercase tracking-tight">
                  {selectedDeal.title}
                </h3>
                <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
                  Expected Close: <span className="font-bold text-slate-700">{selectedDeal.expectedCloseDate ? new Date(selectedDeal.expectedCloseDate).toLocaleDateString() : 'N/A'}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {(isAdmin || selectedDeal.ownerId === user?.uid) && (
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      openEditDealForm(selectedDeal);
                    }}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 text-primary hover:bg-primary/5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit className="w-4 h-4" /> Edit Deal
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteDeal(selectedDeal.id)}
                    className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete sales deal"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                )}
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-slate-50 rounded-xl text-on-surface-variant transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Grid Layout: Left Column = Info, Right Column = Activities Checklist */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left detail card */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Linked Customer Details */}
                <div className="bg-slate-50 rounded-2xl border border-outline-variant/10 p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-outline-variant/10 pb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Account Client</h4>
                    <span className="text-[10px] font-bold text-primary">Connected Profile</span>
                  </div>
                  {(() => {
                    const client = customers.find(c => c.id === selectedDeal.customerId);
                    if (!client) {
                      return <p className="text-xs italic text-slate-400">Loading client information...</p>;
                    }
                    return (
                      <div className="space-y-3 text-xs">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-slate-400" />
                          <span className="font-bold text-slate-800 text-sm">{client.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{client.address}</p>
                        
                        <div className="border-t border-slate-200/50 my-2 pt-2 space-y-2">
                          <div className="flex items-center gap-2 text-on-surface-variant">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <a href={`mailto:${client.email}`} className="hover:underline">{client.email}</a>
                          </div>
                          {client.phone && (
                            <div className="flex items-center gap-2 text-on-surface-variant">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{client.phone}</span>
                            </div>
                          )}
                          {client.website && (
                            <div className="flex items-center gap-2 text-primary">
                              <Globe className="w-3.5 h-3.5 text-primary/70" />
                              <a href={client.website} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                                Visit Portal <ArrowUpRight className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleViewCustomerDetail(client.id)}
                          className="w-full mt-2 py-2 text-center bg-white border border-primary/20 text-primary hover:bg-primary/5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                        >
                          View Full CRM Account
                        </button>
                      </div>
                    );
                  })()}
                </div>

                {/* Deal Status Cards */}
                <div className="border border-outline-variant/15 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Financial Metrics</h4>
                    <span className="text-[10px] font-bold text-slate-500">Pipeline State</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block">Deal Value</span>
                      <span className="text-sm font-black text-slate-800">R {selectedDeal.value.toLocaleString('en-ZA')}</span>
                    </div>
                    <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block">Probability</span>
                      <span className="text-sm font-black text-slate-800">{selectedDeal.probability}%</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Active Stage:</span>
                      <span className="font-bold text-primary">{selectedDeal.stage}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Owner Assigned:</span>
                      <span className="font-bold text-slate-700">{selectedDeal.ownerName || selectedDeal.ownerEmail}</span>
                    </div>
                    {selectedDeal.stage === 'Lost' && selectedDeal.lostReason && (
                      <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-rose-700 mt-2 space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-wider block">Lost Reason</span>
                        <p className="text-[11px] leading-relaxed italic">{selectedDeal.lostReason}</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Right column: Interactive activities checklists */}
              <div className="lg:col-span-7 bg-slate-50/50 rounded-2xl border border-outline-variant/10 p-5 space-y-6">
                
                <div className="space-y-2">
                  <h4 className="text-sm font-black uppercase tracking-wide text-slate-800 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-primary" /> Tasks & Interaction Logs
                  </h4>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Log corporate calls, emails, on-site briefings, or administrative tasks. Mark tasks as completed to streamline workflow updates.
                  </p>
                </div>

                {/* Log new activity form */}
                <form onSubmit={handleAddActivity} className="p-4 bg-white rounded-2xl border border-outline-variant/10 space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary block border-b pb-1">Record Interactive Action</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    {/* Activity Type */}
                    <div className="space-y-1">
                      <label className="font-bold text-on-surface-variant block">Channel Type</label>
                      <select
                        value={newActivityType}
                        onChange={(e: any) => setNewActivityType(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-outline-variant/15 rounded-lg focus:outline-none"
                      >
                        <option value="call">Call</option>
                        <option value="email">Email</option>
                        <option value="meeting">Meeting</option>
                        <option value="task">Task</option>
                      </select>
                    </div>

                    {/* Due Date */}
                    <div className="space-y-1 sm:col-span-2">
                      <label className="font-bold text-on-surface-variant block">Due/Action Date (Optional)</label>
                      <input 
                        type="date" 
                        value={newActivityDueDate}
                        onChange={(e) => setNewActivityDueDate(e.target.value)}
                        className="w-full px-2 py-1 bg-slate-50 border border-outline-variant/15 rounded-lg focus:outline-none font-semibold text-[11px]"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-on-surface-variant block">Activity Notes</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Detail the discussion points or deliverables..."
                        value={newActivityNotes}
                        onChange={(e) => setNewActivityNotes(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-outline-variant/15 rounded-lg focus:outline-none focus:border-primary/50 text-xs"
                        required
                      />
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-primary text-white text-[10px] font-black uppercase tracking-wider rounded-lg shrink-0 hover:opacity-95 transition-all cursor-pointer"
                      >
                        Log Action
                      </button>
                    </div>
                  </div>
                </form>

                {/* Activities list */}
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {activitiesLoading ? (
                    <div className="py-10 text-center">
                      <Loader2 className="w-5 h-5 text-primary animate-spin mx-auto" />
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="py-10 text-center border-2 border-dashed rounded-2xl border-outline-variant/10 text-xs text-on-surface-variant/40 italic">
                      No interaction logs registered on this deal file.
                    </div>
                  ) : (
                    activities.map((act) => (
                      <div 
                        key={act.id} 
                        className={`p-3.5 bg-white border rounded-xl flex items-start gap-3 transition-colors ${
                          act.completed ? 'opacity-70 bg-slate-50 border-slate-200' : 'border-outline-variant/10 shadow-sm'
                        }`}
                      >
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => handleToggleActivityComplete(act)}
                          className="mt-0.5 w-4 h-4 rounded border border-primary/30 flex items-center justify-center hover:bg-primary/5 cursor-pointer text-primary shrink-0 focus:outline-none"
                        >
                          {act.completed && <span className="w-2.5 h-2.5 bg-primary rounded-sm" />}
                        </button>

                        <div className="space-y-1 text-xs flex-grow min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded ${
                              act.type === 'meeting' ? 'bg-purple-50 text-purple-700' :
                              act.type === 'call' ? 'bg-blue-50 text-blue-700' :
                              act.type === 'email' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {act.type}
                            </span>
                            {act.dueDate && (
                              <span className="text-[9px] text-slate-500 font-bold flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {new Date(act.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          
                          <p className={`text-[11px] leading-relaxed text-slate-800 ${act.completed ? 'line-through text-slate-400' : ''}`}>
                            {act.notes}
                          </p>

                          <div className="text-[9px] text-slate-400 font-medium">
                            By {act.createdByEmail || 'Staff'} • {new Date(act.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* DRAG-AND-DROP LOST REASON PROMPT MODAL */}
      {showLostReasonModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-outline-variant/15 w-full max-w-md shadow-2xl p-6 space-y-5 animate-scale-up">
            <div className="space-y-1 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 mx-auto">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <h3 className="text-md font-black uppercase text-slate-800 tracking-tight">Record Lost Reason</h3>
              <p className="text-xs text-on-surface-variant">
                To maintain accurate business analytics, please describe the competitive or situational reason for marking this deal as Lost.
              </p>
            </div>

            <form onSubmit={handleDragLostReasonSubmit} className="space-y-4">
              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-on-surface-variant uppercase tracking-wider block">Lost Reason Details</label>
                <textarea 
                  rows={3}
                  value={dragLostReasonText}
                  onChange={(e) => setDragLostReasonText(e.target.value)}
                  placeholder="e.g. Budget constraints, selected alternative vendor, project indefinitely postponed..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-outline-variant/15 rounded-xl text-xs focus:outline-none focus:border-primary/50 transition-colors font-semibold"
                  required
                />
              </div>

              <div className="flex justify-end gap-2.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowLostReasonModal(false);
                    setLostReasonTargetDealId(null);
                  }}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full font-bold uppercase transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-wider rounded-full transition-all"
                >
                  Save Lost Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW/EDIT DEAL FORM MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-outline-variant/15 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8 space-y-6 animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-outline-variant/10 pb-4">
              <div className="space-y-0.5">
                <h3 className="text-lg font-black uppercase text-on-surface flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" /> 
                  {editingDeal ? 'Update Sales Deal' : 'Register Sales Deal'}
                </h3>
                <p className="text-[11px] text-on-surface-variant">
                  Standardize expected metrics, stages, and assigned operators.
                </p>
              </div>
              <button 
                onClick={() => setShowFormModal(false)}
                className="p-2 hover:bg-slate-50 rounded-xl text-on-surface-variant transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error bar */}
            {formError && (
              <div className="bg-red-50 border border-red-200/50 rounded-2xl p-4 flex items-center gap-3 text-red-700 text-xs font-semibold">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleDealSubmit} className="space-y-5 text-xs">
              
              {/* Customer Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-on-surface-variant uppercase tracking-wider block">
                  Connected Account Profile <span className="text-primary">*</span>
                </label>
                <select
                  value={formCustomerId}
                  onChange={(e) => setFormCustomerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-outline-variant/15 rounded-xl text-xs focus:outline-none focus:border-primary/50 font-bold"
                  required
                >
                  <option value="">-- Choose Corporate Account --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.industry})</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="font-bold text-on-surface-variant uppercase tracking-wider block">
                  Deal Title <span className="text-primary">*</span>
                </label>
                <input 
                  type="text" 
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Enterprise SLA Web Portal Phase 2"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-outline-variant/15 rounded-xl text-xs focus:outline-none focus:border-primary/50 font-semibold"
                  required
                />
              </div>

              {/* Grid 2-column: Stage & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Stage */}
                <div className="space-y-1.5">
                  <label className="font-bold text-on-surface-variant uppercase tracking-wider block">Stage Status</label>
                  <select
                    value={formStage}
                    onChange={(e: any) => setFormStage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-outline-variant/15 rounded-xl text-xs focus:outline-none focus:border-primary/50 font-bold"
                  >
                    {STAGES.map(s => (
                      <option key={s.stage} value={s.stage}>{s.stage}</option>
                    ))}
                  </select>
                </div>

                {/* Value */}
                <div className="space-y-1.5">
                  <label className="font-bold text-on-surface-variant uppercase tracking-wider block">
                    Financial Deal Value (ZAR) <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-on-surface-variant/40">R</span>
                    <input 
                      type="number" 
                      min="0"
                      step="1"
                      value={formValue}
                      onChange={(e) => setFormValue(e.target.value)}
                      placeholder="85000"
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-outline-variant/15 rounded-xl text-xs focus:outline-none focus:border-primary/50 font-bold text-slate-800"
                      required
                    />
                  </div>
                </div>

              </div>

              {/* Grid 2-column: Probability & Expected Close Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Probability */}
                <div className="space-y-1.5">
                  <label className="font-bold text-on-surface-variant uppercase tracking-wider block">Win Probability (%)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={formProbability}
                    onChange={(e) => setFormProbability(e.target.value)}
                    placeholder="20"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-outline-variant/15 rounded-xl text-xs focus:outline-none"
                  />
                </div>

                {/* Expected Close Date */}
                <div className="space-y-1.5">
                  <label className="font-bold text-on-surface-variant uppercase tracking-wider block">
                    Expected Close Date <span className="text-primary">*</span>
                  </label>
                  <input 
                    type="date" 
                    value={formExpectedCloseDate}
                    onChange={(e) => setFormExpectedCloseDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-outline-variant/15 rounded-xl text-xs focus:outline-none font-semibold text-slate-800"
                    required
                  />
                </div>

              </div>

              {/* Owner (Admins can reassign) */}
              {isAdmin && (
                <div className="space-y-1.5">
                  <label className="font-bold text-on-surface-variant uppercase tracking-wider block">Pipeline Owner</label>
                  <select
                    value={formOwnerId}
                    onChange={(e) => setFormOwnerId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-outline-variant/15 rounded-xl text-xs focus:outline-none focus:border-primary/50 font-bold"
                  >
                    <option value={user?.uid || ''}>Assign to me ({user?.displayName || user?.email})</option>
                    {salesReps.map(rep => (
                      <option key={rep.uid} value={rep.uid}>Assign to: {rep.name || rep.email}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Lost Reason if stage Lost */}
              {formStage === 'Lost' && (
                <div className="space-y-1.5 bg-rose-50 border border-rose-100 p-4 rounded-2xl animate-fade-in">
                  <label className="font-bold text-rose-800 uppercase tracking-wider block">
                    Lost Reason <span className="text-primary">*</span>
                  </label>
                  <textarea 
                    rows={2}
                    value={formLostReason}
                    onChange={(e) => setFormLostReason(e.target.value)}
                    placeholder="Why was this deal unsuccessful? (e.g., pricing constraints)"
                    className="w-full px-3.5 py-2 bg-white border border-rose-200 rounded-xl text-xs focus:outline-none focus:border-rose-500 font-semibold"
                    required
                  />
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 border-t border-outline-variant/10 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-5 py-2.5 border border-slate-200 text-on-surface-variant hover:bg-slate-50 rounded-full font-bold uppercase tracking-wider cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-white hover:opacity-90 rounded-full font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-4 h-4" /> Save Deal
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER INLINE DETAIL MODAL */}
      {showCustomerModal && focusedCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-outline-variant/15 w-full max-w-md shadow-2xl p-6 md:p-8 space-y-5 animate-scale-up">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black uppercase text-slate-800">Account Contact Cards</h3>
                <p className="text-[10px] text-slate-400">Dynamic credentials & details</p>
              </div>
              <button 
                onClick={() => setShowCustomerModal(false)}
                className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 block">Company Name</span>
                <div className="text-md font-bold text-slate-900 flex items-center gap-2">
                  <Building className="w-4 h-4 text-primary" />
                  {focusedCustomer.name}
                </div>
              </div>

              {focusedCustomer.industry && (
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Industry Sector</span>
                  <div className="font-semibold text-slate-800">{focusedCustomer.industry}</div>
                </div>
              )}

              {focusedCustomer.address && (
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Physical Headquarters</span>
                  <div className="text-slate-600 italic leading-relaxed">{focusedCustomer.address}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Tax Number (VAT)</span>
                  <div className="font-mono text-slate-800 font-semibold">{focusedCustomer.taxNumber || 'Exempt / None'}</div>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Owner/Representative</span>
                  <div className="text-slate-800 font-semibold truncate">{focusedCustomer.ownerEmail?.split('@')[0] || 'Staff'}</div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2">
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <a href={`mailto:${focusedCustomer.email}`} className="hover:underline font-bold text-slate-800">{focusedCustomer.email}</a>
                </div>
                {focusedCustomer.phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-bold text-slate-800">{focusedCustomer.phone}</span>
                  </div>
                )}
                {focusedCustomer.website && (
                  <div className="flex items-center gap-2 text-primary">
                    <Globe className="w-4 h-4 text-primary/70 shrink-0" />
                    <a href={focusedCustomer.website} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                      {focusedCustomer.website} <ArrowUpRight className="w-3 h-3 text-primary" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex justify-end">
              <button
                onClick={() => setShowCustomerModal(false)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 rounded-full font-bold uppercase tracking-wider text-[10px]"
              >
                Close Cards
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
