import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Target as TargetIcon, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  User, 
  TrendingUp, 
  Loader2, 
  Award, 
  Calendar, 
  DollarSign, 
  Users, 
  CheckCircle, 
  HelpCircle,
  AlertCircle,
  ShieldCheck,
  Percent,
  CalendarDays,
  BarChart3,
  Flame
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
import { Deal, Quote, Target } from '../types';

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
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email
    },
    operationType,
    path
  };
  console.error('Firestore Error in Targets Dashboard: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface TargetsDashboardProps {
  onBack: () => void;
}

export default function TargetsDashboard({ onBack }: TargetsDashboardProps) {
  const { user, role } = useAuth();
  const isAdmin = role === 'admin';
  const isSalesRep = role === 'sales_rep';

  // --- Real-time Synchronized States ---
  const [deals, setDeals] = useState<Deal[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [salesReps, setSalesReps] = useState<{ uid: string; email: string; name?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Period Selector States ---
  const [periodType, setPeriodType] = useState<'month' | 'quarter' | 'custom'>('month');
  
  // Months: Default to current month "YYYY-MM"
  const getCurrentMonthStr = () => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${mm}`;
  };
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthStr());

  // Quarters: Default to current quarter e.g. "YYYY-QX"
  const getCurrentQuarterStr = () => {
    const d = new Date();
    const q = Math.floor(d.getMonth() / 3) + 1;
    return `${d.getFullYear()}-Q${q}`;
  };
  const [selectedQuarterYear, setSelectedQuarterYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedQuarterNum, setSelectedQuarterNum] = useState<string>((Math.floor(new Date().getMonth() / 3) + 1).toString());

  // Custom range: Default to current month range
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    const d = new Date();
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${lastDay}`;
  });

  // --- Active Selection filter for display (Admins only) ---
  const [displayUserFilter, setDisplayUserFilter] = useState<string>('team'); // 'team' or specific UID

  // --- Form fields for creating/updating targets ---
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [formOwnerId, setFormOwnerId] = useState<string>('team');
  const [formPeriodType, setFormPeriodType] = useState<'month' | 'quarter'>('month');
  const [formMonth, setFormMonth] = useState<string>(getCurrentMonthStr());
  const [formQuarterYear, setFormQuarterYear] = useState<string>(new Date().getFullYear().toString());
  const [formQuarterNum, setFormQuarterNum] = useState<string>('1');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<boolean>(false);

  // --- Initialize target filter ---
  useEffect(() => {
    if (isSalesRep && user) {
      setDisplayUserFilter(user.uid);
    } else {
      setDisplayUserFilter('team');
    }
  }, [user, role]);

  // --- Fetch Sales Representatives list (Admins only) ---
  useEffect(() => {
    if (!isAdmin || !user) return;
    const fetchStaffDirectory = async () => {
      try {
        const idToken = await user.getIdToken();
        const response = await fetch('/api/users', {
          headers: { 'Authorization': `Bearer ${idToken}` }
        });
        if (response.ok) {
          const data = await response.json();
          // Filter to only sales_reps and admins
          const staff = (data.users || [])
            .filter((u: any) => u.role === 'sales_rep' || u.role === 'admin')
            .map((u: any) => ({
              uid: u.uid,
              email: u.email,
              name: u.name || u.email.split('@')[0]
            }));
          setSalesReps(staff);
        }
      } catch (err) {
        console.error("Error downloading live credentials directory: ", err);
      }
    };
    fetchStaffDirectory();
  }, [user, isAdmin]);

  // --- Synchronize Deals collection ---
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const dealsRef = collection(db, 'deals');
    const unsubscribe = onSnapshot(dealsRef, (snapshot) => {
      const list: Deal[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Deal);
      });
      setDeals(list);
      setLoading(false);
    }, (error) => {
      console.error("Deals synchronization failed: ", error);
      handleFirestoreError(error, OperationType.GET, 'deals');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // --- Synchronize Targets collection ---
  useEffect(() => {
    if (!user) return;
    const targetsRef = collection(db, 'targets');
    const unsubscribe = onSnapshot(targetsRef, (snapshot) => {
      const list: Target[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Target);
      });
      setTargets(list);
    }, (error) => {
      console.error("Targets synchronization failed: ", error);
      handleFirestoreError(error, OperationType.GET, 'targets');
    });

    return () => unsubscribe();
  }, [user]);

  // --- Period calculation Helpers ---
  const getQuarterMonths = (quarterStr: string): string[] => {
    const [year, qVal] = quarterStr.split('-Q');
    if (!year || !qVal) return [];
    return [
      qVal === '1' ? `${year}-01` : qVal === '2' ? `${year}-04` : qVal === '3' ? `${year}-07` : `${year}-10`,
      qVal === '1' ? `${year}-02` : qVal === '2' ? `${year}-05` : qVal === '3' ? `${year}-08` : `${year}-11`,
      qVal === '1' ? `${year}-03` : qVal === '2' ? `${year}-06` : qVal === '3' ? `${year}-09` : `${year}-12`
    ];
  };

  const getActivePeriodKey = (): string => {
    if (periodType === 'month') return selectedMonth;
    if (periodType === 'quarter') return `${selectedQuarterYear}-Q${selectedQuarterNum}`;
    return 'custom';
  };

  const isDateInPeriod = (dateStr?: string): boolean => {
    if (!dateStr) return false;
    // Handle ISO strings by extracting date prefix YYYY-MM-DD
    const dateOnly = dateStr.substring(0, 10);
    
    if (periodType === 'month') {
      return dateOnly.startsWith(selectedMonth);
    }
    if (periodType === 'quarter') {
      const qKey = `${selectedQuarterYear}-Q${selectedQuarterNum}`;
      const months = getQuarterMonths(qKey);
      return months.some(m => dateOnly.startsWith(m));
    }
    if (periodType === 'custom') {
      return dateOnly >= customStartDate && dateOnly <= customEndDate;
    }
    return false;
  };

  // --- Aggregate Performance Math ---
  const calculateMetricsForRep = (repUid: string | 'team') => {
    const repDeals = deals.filter(deal => {
      if (repUid === 'team') return true;
      return deal.ownerId === repUid;
    });

    // 1. Actual Achieved: Sum of Won deals updatedAt inside selected period
    const wonDeals = repDeals.filter(deal => deal.stage === 'Won' && isDateInPeriod(deal.updatedAt));
    const actualAmount = wonDeals.reduce((sum, d) => sum + d.value, 0);

    // 2. Open pipeline forecast: Sum of (value * probability / 100) for open deals expected close inside period
    const openDeals = repDeals.filter(deal => 
      deal.stage !== 'Won' && 
      deal.stage !== 'Lost' && 
      isDateInPeriod(deal.expectedCloseDate)
    );
    const forecastAmount = openDeals.reduce((sum, d) => sum + (d.value * (d.probability || 0) / 100), 0);

    // 3. Find target
    const targetPeriod = getActivePeriodKey();
    let targetAmount = 0;

    if (targetPeriod !== 'custom') {
      const matchTarget = targets.find(t => t.ownerId === repUid && t.period === targetPeriod);
      targetAmount = matchTarget ? matchTarget.targetAmount : 0;
    } else {
      // For custom date range, we interpolate by summing overlapping months
      // Or simply look up any overlapping targets. For simplicity and robustness,
      // we sum up target quotas matching months that fall within the custom range.
      const monthsInRange: string[] = [];
      let currentMonthStr = customStartDate.substring(0, 7);
      const endMonthStr = customEndDate.substring(0, 7);
      
      while (currentMonthStr <= endMonthStr) {
        monthsInRange.push(currentMonthStr);
        // Advance month
        const [y, m] = currentMonthStr.split('-').map(Number);
        const nextDate = new Date(y, m, 1);
        currentMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
      }

      const matchingTargets = targets.filter(t => t.ownerId === repUid && monthsInRange.includes(t.period));
      targetAmount = matchingTargets.reduce((sum, t) => sum + t.targetAmount, 0);
    }

    const progressPercent = targetAmount > 0 ? (actualAmount / targetAmount) * 100 : 0;

    return {
      targetAmount,
      actualAmount,
      forecastAmount,
      progressPercent,
      wonCount: wonDeals.length,
      openCount: openDeals.length
    };
  };

  // --- Active Metrics under Context ---
  const activeMetrics = calculateMetricsForRep(displayUserFilter);

  // --- Leaderboard Generation ---
  const getLeaderboard = () => {
    const list = salesReps.map(rep => {
      const metrics = calculateMetricsForRep(rep.uid);
      return {
        ...rep,
        ...metrics
      };
    });
    // Sort by progress percentage descending
    return list.sort((a, b) => b.progressPercent - a.progressPercent);
  };

  const leaderboard = getLeaderboard();

  // --- Form Submit: Target configuration ---
  const handleTargetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);

    const parsedVal = parseFloat(formAmount);
    if (isNaN(parsedVal) || parsedVal <= 0) {
      setFormError("Please enter a valid target amount greater than R0.");
      return;
    }

    const targetPeriod = formPeriodType === 'month' 
      ? formMonth 
      : `${formQuarterYear}-Q${formQuarterNum}`;

    try {
      const existingDoc = targets.find(t => t.ownerId === formOwnerId && t.period === targetPeriod);
      const now = new Date().toISOString();
      
      if (existingDoc) {
        // Update
        const docRef = doc(db, 'targets', existingDoc.id);
        await updateDoc(docRef, {
          targetAmount: parsedVal,
          updatedAt: now,
          createdBy: user?.uid || ''
        });
      } else {
        // Create
        const collectionRef = collection(db, 'targets');
        await addDoc(collectionRef, {
          ownerId: formOwnerId,
          period: targetPeriod,
          targetAmount: parsedVal,
          createdBy: user?.uid || '',
          createdAt: now,
          updatedAt: now
        });
      }

      setFormSuccess(true);
      setFormAmount('');
      setTimeout(() => setFormSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setFormError("Failed to store sales target document in Firestore.");
    }
  };

  // --- Delete Target item ---
  const handleDeleteTarget = async (id: string) => {
    if (!isAdmin) return;
    if (confirm("Are you sure you want to delete this target?")) {
      try {
        await deleteDoc(doc(db, 'targets', id));
      } catch (err) {
        console.error(err);
        alert("Failed to delete target.");
      }
    }
  };

  // --- Format ZAR Currency helper ---
  const formatZAR = (val: number) => {
    return val.toLocaleString('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 });
  };

  // --- SVG Chart coordinates builder ---
  const renderInteractiveChart = () => {
    const target = activeMetrics.targetAmount;
    const actual = activeMetrics.actualAmount;
    const forecast = activeMetrics.forecastAmount;
    const totalProjected = actual + forecast;

    const maxValue = Math.max(target, actual, totalProjected, 10000);
    const scale = (val: number) => (val / maxValue) * 100;

    const targetPct = scale(target);
    const actualPct = scale(actual);
    const forecastPct = scale(forecast);
    const projPct = scale(totalProjected);

    return (
      <div className="bg-white border border-outline-variant/15 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <BarChart3 className="w-4.5 h-4.5 text-primary" /> Visual Quota Accomplishment
          </h4>
          <span className="text-[10px] font-mono text-slate-400">Scale max: {formatZAR(maxValue)}</span>
        </div>

        {/* Custom Visual HTML/CSS horizontal comparison chart */}
        <div className="space-y-6">
          
          {/* Target bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-500 flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-slate-300 inline-block" /> Set Target Amount
              </span>
              <span className="font-black text-slate-800">{formatZAR(target)}</span>
            </div>
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden relative">
              <div 
                className="h-full bg-slate-400 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${targetPct}%` }}
              />
            </div>
          </div>

          {/* Actual Won bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600 flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-primary inline-block" /> Actual Won Achieved
              </span>
              <span className="font-black text-emerald-700">
                {formatZAR(actual)} ({activeMetrics.progressPercent.toFixed(0)}%)
              </span>
            </div>
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden relative">
              <div 
                className="h-full primary-gradient rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${actualPct}%` }}
              />
            </div>
          </div>

          {/* Projected (Actual + Weighted Forecast) bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-600 flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-purple-500 inline-block" /> Weighted Projection (Won + Open Pipeline)
              </span>
              <span className="font-black text-purple-700">
                {formatZAR(totalProjected)} ({(target > 0 ? (totalProjected / target) * 100 : 0).toFixed(0)}%)
              </span>
            </div>
            <div className="w-full h-5 bg-slate-100 rounded-full overflow-hidden relative flex">
              {/* Actual segment */}
              <div 
                className="h-full primary-gradient transition-all duration-1000 ease-out shrink-0"
                style={{ width: `${actualPct}%` }}
              />
              {/* Forecast segment */}
              <div 
                className="h-full bg-purple-500/85 transition-all duration-1000 ease-out"
                style={{ width: `${forecastPct}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              * The purple block represents your weighted open deals expected to close in this period. Adding this to closed-won shows your forecasted target capability.
            </p>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-12 py-10 space-y-8 animate-fade-in relative">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/15 pb-6">
        <div className="space-y-1">
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider hover:opacity-80 transition-all mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Portal
          </button>
          <h2 className="font-headline-md text-3xl font-black text-on-surface uppercase tracking-tight flex items-center gap-3">
            <TargetIcon className="w-8 h-8 text-primary" /> Sales Targets & Performance
          </h2>
          <p className="text-sm text-on-surface-variant">
            Track quotas, analyze actual results, and visualize pipeline-weighted forecasts.
          </p>
        </div>

        {/* Admin panel triggers */}
        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-5 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-full shadow-md hover:shadow-lg hover:scale-103 active:scale-97 transition-all cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4.5 h-4.5" /> Target Configurations
            </button>
          </div>
        )}
      </div>

      {/* Privileged Identity indicator */}
      <div className="bg-primary/5 border border-primary/10 rounded-2xl px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-3">
        <span className="text-primary font-bold uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck className="w-4.5 h-4.5" /> Checked Role Privilege: {isAdmin ? 'Administrator Panel' : 'Individual Sales rep Panel'}
        </span>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-on-surface-variant">Viewing Dashboard For:</span>
            <select
              value={displayUserFilter}
              onChange={(e) => setDisplayUserFilter(e.target.value)}
              className="px-2.5 py-1 bg-white border border-outline-variant/20 rounded-lg text-xs font-bold outline-none cursor-pointer"
            >
              <option value="team">Team Overall Aggregate</option>
              {salesReps.map(rep => (
                <option key={rep.uid} value={rep.uid}>{rep.name || rep.email}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Dynamic Period Selector Board */}
      <div className="bg-white rounded-3xl border border-outline-variant/15 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          
          {/* Selector Type buttons */}
          <div className="flex rounded-xl bg-slate-100 p-1 border">
            <button
              onClick={() => setPeriodType('month')}
              className={`px-4 py-2 text-xs uppercase font-black tracking-wider rounded-lg transition-all ${
                periodType === 'month' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Month selector
            </button>
            <button
              onClick={() => setPeriodType('quarter')}
              className={`px-4 py-2 text-xs uppercase font-black tracking-wider rounded-lg transition-all ${
                periodType === 'quarter' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Quarter selector
            </button>
            <button
              onClick={() => setPeriodType('custom')}
              className={`px-4 py-2 text-xs uppercase font-black tracking-wider rounded-lg transition-all ${
                periodType === 'custom' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Custom Range
            </button>
          </div>

          {/* Sub-inputs based on Period Type */}
          <div className="w-full md:w-auto">
            {periodType === 'month' && (
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-500 uppercase">Selected month:</span>
                <input 
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-outline-variant/15 rounded-xl font-bold text-slate-700 focus:outline-none"
                />
              </div>
            )}

            {periodType === 'quarter' && (
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-500 uppercase">Year:</span>
                  <select
                    value={selectedQuarterYear}
                    onChange={(e) => setSelectedQuarterYear(e.target.value)}
                    className="px-2.5 py-2 bg-slate-50 border border-outline-variant/15 rounded-xl font-bold"
                  >
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-500 uppercase">Quarter:</span>
                  <select
                    value={selectedQuarterNum}
                    onChange={(e) => setSelectedQuarterNum(e.target.value)}
                    className="px-2.5 py-2 bg-slate-50 border border-outline-variant/15 rounded-xl font-bold"
                  >
                    <option value="1">Q1 (Jan-Mar)</option>
                    <option value="2">Q2 (Apr-Jun)</option>
                    <option value="3">Q3 (Jul-Sep)</option>
                    <option value="4">Q4 (Oct-Dec)</option>
                  </select>
                </div>
              </div>
            )}

            {periodType === 'custom' && (
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-500 uppercase">From:</span>
                  <input 
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-outline-variant/15 rounded-xl font-semibold"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-500 uppercase">To:</span>
                  <input 
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-outline-variant/15 rounded-xl font-semibold"
                  />
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Metrics Cards row */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs text-on-surface-variant font-medium uppercase tracking-widest">Compiling metric aggregates...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Card 1: Target Quota */}
          <div className="bg-white border border-outline-variant/15 rounded-3xl p-6 flex items-center gap-5 shadow-sm relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center border">
              <TargetIcon className="w-6 h-6 text-slate-600" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant block">Target Quota</span>
              <div className="text-lg font-black text-slate-800">
                {activeMetrics.targetAmount > 0 ? formatZAR(activeMetrics.targetAmount) : 'R 0 (Not Established)'}
              </div>
              <span className="text-[10px] text-slate-400 font-medium block">
                Period: {getActivePeriodKey()}
              </span>
            </div>
          </div>

          {/* Card 2: Actual Won achieved */}
          <div className="bg-white border border-outline-variant/15 rounded-3xl p-6 flex items-center gap-5 shadow-sm relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant block">Actual Achieved</span>
              <div className="text-lg font-black text-emerald-700">
                {formatZAR(activeMetrics.actualAmount)}
              </div>
              <span className="text-[10px] text-slate-500 font-bold block flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> {activeMetrics.wonCount} Deals Won
              </span>
            </div>
          </div>

          {/* Card 3: Accomplishment % */}
          <div className="bg-white border border-outline-variant/15 rounded-3xl p-6 flex items-center gap-5 shadow-sm relative overflow-hidden">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
              activeMetrics.progressPercent >= 100 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
              activeMetrics.progressPercent >= 50 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'
            }`}>
              <Percent className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant block">Accomplishment</span>
              <div className={`text-lg font-black ${
                activeMetrics.progressPercent >= 100 ? 'text-emerald-700' :
                activeMetrics.progressPercent >= 50 ? 'text-amber-700' : 'text-rose-700'
              }`}>
                {activeMetrics.progressPercent.toFixed(1)}%
              </div>
              {/* Progress visual line indicator */}
              <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                <div 
                  className={`h-full rounded-full ${
                    activeMetrics.progressPercent >= 100 ? 'bg-emerald-500' :
                    activeMetrics.progressPercent >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                  }`} 
                  style={{ width: `${Math.min(activeMetrics.progressPercent, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 4: Pipeline-weighted Forecast */}
          <div className="bg-white border border-outline-variant/15 rounded-3xl p-6 flex items-center gap-5 shadow-sm relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant block flex items-center gap-1">
                Weighted Forecast <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 cursor-help" title="Sum of (deal.value × deal.probability) for open deals expected to close in this period" />
              </span>
              <div className="text-lg font-black text-purple-700">
                {formatZAR(activeMetrics.forecastAmount)}
              </div>
              <span className="text-[10px] text-slate-500 font-bold block">
                {activeMetrics.openCount} Open Deals in Range
              </span>
            </div>
          </div>

        </div>
      )}

      {/* Main Grid: Charts & Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Comparison charts */}
        <div className="lg:col-span-7">
          {renderInteractiveChart()}
        </div>

        {/* Right Side: Leaderboard view */}
        <div className="lg:col-span-5 bg-white border border-outline-variant/15 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Award className="w-4.5 h-4.5 text-primary" /> Staff Performance Directory
              </h3>
              <span className="px-2 py-0.5 bg-slate-100 text-[9px] uppercase tracking-wider font-black text-slate-600 rounded">
                Ranked List
              </span>
            </div>

            {/* Display list based on roles */}
            {isSalesRep ? (
              <div className="py-8 text-center space-y-2">
                <Flame className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Sales Representatives view their individual dashboards by default. Leaderboard profiles are kept privileged for administration auditing.
                </p>
              </div>
            ) : leaderboard.length === 0 ? (
              <p className="text-xs italic text-slate-400 py-4 text-center">No representative records found.</p>
            ) : (
              <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
                {leaderboard.map((item, idx) => {
                  const isTop = idx === 0 && item.progressPercent > 0;
                  return (
                    <div 
                      key={item.uid} 
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                        item.uid === displayUserFilter 
                          ? 'border-primary/30 bg-primary/5' 
                          : 'border-slate-100 bg-slate-50/30 hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center ${
                          isTop ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {isTop ? '👑' : idx + 1}
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-xs font-black text-slate-800 block truncate max-w-[150px]">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium block">
                            Target: {formatZAR(item.targetAmount)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right space-y-0.5">
                        <span className={`text-xs font-black block ${
                          item.progressPercent >= 100 ? 'text-emerald-600' :
                          item.progressPercent >= 50 ? 'text-amber-600' : 'text-slate-600'
                        }`}>
                          {item.progressPercent.toFixed(0)}% Achieved
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold block">
                          Won: {formatZAR(item.actualAmount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-3 mt-4 text-[10px] text-slate-400 leading-normal">
            Accomplishment percent rankings determine administrative sales awards. Set staff targets within the configuration drawer above.
          </div>
        </div>

      </div>

      {/* ADMIN CONFIGURATION DRAWER/MODAL */}
      {showConfigModal && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-3xl border border-outline-variant/15 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8 space-y-6 animate-scale-up">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-outline-variant/10 pb-4">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-on-surface uppercase tracking-tight flex items-center gap-2">
                  <TargetIcon className="w-5.5 h-5.5 text-primary" /> Target Configurations Board
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Set, edit, and delete month or quarter financial targets for staff or the overall team.
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowConfigModal(false);
                  setFormError(null);
                  setFormSuccess(false);
                }}
                className="p-2 hover:bg-slate-50 rounded-xl text-on-surface-variant transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Layout: Left = Define Form, Right = Current Targets Table */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Form */}
              <form onSubmit={handleTargetSubmit} className="lg:col-span-5 space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary block border-b pb-1">Establish Target Quota</span>
                
                {/* Error Banner */}
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 text-[11px] text-rose-800">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Success Banner */}
                {formSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2 text-[11px] text-emerald-800">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Target saved successfully.</span>
                  </div>
                )}

                {/* Field 1: Target Owner */}
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-slate-600 block">Target Owner</label>
                  <select
                    value={formOwnerId}
                    onChange={(e) => setFormOwnerId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-outline-variant/15 rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    <option value="team">Team Overall Aggregate</option>
                    {salesReps.map(rep => (
                      <option key={rep.uid} value={rep.uid}>Rep: {rep.name || rep.email}</option>
                    ))}
                  </select>
                </div>

                {/* Field 2: Period Type */}
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-slate-600 block">Period Type</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormPeriodType('month')}
                      className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg border ${
                        formPeriodType === 'month' 
                          ? 'bg-primary text-white border-primary' 
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      Month
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormPeriodType('quarter')}
                      className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg border ${
                        formPeriodType === 'quarter' 
                          ? 'bg-primary text-white border-primary' 
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      Quarter
                    </button>
                  </div>
                </div>

                {/* Field 3: Month/Quarter Pickers */}
                {formPeriodType === 'month' ? (
                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-slate-600 block">Select Month</label>
                    <input 
                      type="month"
                      value={formMonth}
                      onChange={(e) => setFormMonth(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-outline-variant/15 rounded-xl font-bold text-xs"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 block">Year</label>
                      <select
                        value={formQuarterYear}
                        onChange={(e) => setFormQuarterYear(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-outline-variant/15 rounded-xl font-bold"
                      >
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                        <option value="2027">2027</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600 block">Quarter</label>
                      <select
                        value={formQuarterNum}
                        onChange={(e) => setFormQuarterNum(e.target.value)}
                        className="w-full px-2.5 py-2 bg-white border border-outline-variant/15 rounded-xl font-bold"
                      >
                        <option value="1">Q1 (Jan-Mar)</option>
                        <option value="2">Q2 (Apr-Jun)</option>
                        <option value="3">Q3 (Jul-Sep)</option>
                        <option value="4">Q4 (Oct-Dec)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Field 4: Target Amount */}
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-slate-600 block">Target Amount (ZAR / R)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R</span>
                    <input 
                      type="number"
                      placeholder="e.g. 500000"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-2 bg-white border border-outline-variant/15 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-sm hover:scale-102 active:scale-98 transition-all cursor-pointer"
                >
                  Save / Apply Target
                </button>

              </form>

              {/* Right Column: Existing Targets Table */}
              <div className="lg:col-span-7 space-y-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block border-b pb-1">Defined Targets History</span>
                
                {targets.length === 0 ? (
                  <p className="text-xs italic text-slate-400 py-8 text-center bg-slate-50/50 rounded-2xl border">No targets currently configured.</p>
                ) : (
                  <div className="border border-outline-variant/15 rounded-2xl overflow-hidden shadow-inner max-h-[360px] overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b text-[9px] uppercase font-black text-slate-500">
                          <th className="px-4 py-3">Owner</th>
                          <th className="px-4 py-3">Period</th>
                          <th className="px-4 py-3 text-right">Target Amount</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {targets.map((t) => {
                          const ownerName = t.ownerId === 'team' 
                            ? 'Team Overall' 
                            : (salesReps.find(r => r.uid === t.ownerId)?.name || 'Unknown Rep');
                          
                          return (
                            <tr key={t.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 font-bold text-slate-800">{ownerName}</td>
                              <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{t.period}</td>
                              <td className="px-4 py-3 text-right font-black text-slate-700">{formatZAR(t.targetAmount)}</td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormOwnerId(t.ownerId);
                                    if (t.period.includes('-Q')) {
                                      setFormPeriodType('quarter');
                                      const [y, q] = t.period.split('-Q');
                                      setFormQuarterYear(y);
                                      setFormQuarterNum(q);
                                    } else {
                                      setFormPeriodType('month');
                                      setFormMonth(t.period);
                                    }
                                    setFormAmount(t.targetAmount.toString());
                                  }}
                                  className="p-1 text-primary hover:bg-primary/5 rounded mr-1"
                                  title="Edit target"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTarget(t.id)}
                                  className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                  title="Delete target"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
