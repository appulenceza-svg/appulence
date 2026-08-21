import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  FileText, 
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
  ArrowUpRight, 
  Phone, 
  Mail, 
  Globe, 
  Building, 
  Tag, 
  MessageSquare,
  AlertCircle,
  CalendarDays,
  Sparkles,
  Award,
  DollarSign,
  Download,
  Send,
  Eye,
  History,
  Check,
  ChevronDown,
  ArrowUpDown
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
import { Quote, QuoteLineItem, QuoteStatus, Customer, Deal, CatalogItem } from '../types';
import jsPDF from 'jspdf';

export default function QuotationDashboard({ onBack }: { onBack: () => void }) {
  const { user, role } = useAuth();
  const isAdmin = role === 'admin';
  const isSalesRep = role === 'sales_rep';

  // Data state
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter and search states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchivedVersions, setShowArchivedVersions] = useState(false);

  // Active views / modales
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [quoteToEdit, setQuoteToEdit] = useState<Quote | null>(null);

  // Builder form states
  const [builderCustomerId, setBuilderCustomerId] = useState('');
  const [builderDealId, setBuilderDealId] = useState('');
  const [builderValidUntil, setBuilderValidUntil] = useState('');
  const [builderNotes, setBuilderNotes] = useState('');
  const [builderTaxPercent, setBuilderTaxPercent] = useState<number>(15); // Default South African VAT
  const [builderLineItems, setBuilderLineItems] = useState<QuoteLineItem[]>([
    { description: '', quantity: 1, unitPrice: 0, discountPercent: 0 }
  ]);
  const [builderError, setBuilderError] = useState<string | null>(null);
  const [builderSaving, setBuilderSaving] = useState(false);

  // Simulation states
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);

  // Load real-time quotes, customers, deals, and catalog
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    // Sync quotes
    const quotesRef = collection(db, 'quotes');
    const quotesQuery = query(quotesRef, orderBy('createdAt', 'desc'));
    const unsubscribeQuotes = onSnapshot(quotesQuery, (snap) => {
      const list: Quote[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Quote);
      });
      setQuotes(list);
      setLoading(false);
    }, (err) => {
      console.error("Error syncing quotes:", err);
      setLoading(false);
    });

    // Sync customers
    const customersRef = collection(db, 'customers');
    let customersQuery = query(customersRef);
    if (isSalesRep) {
      customersQuery = query(customersRef, where('ownerId', '==', user.uid));
    }
    const unsubscribeCustomers = onSnapshot(customersQuery, (snap) => {
      const list: Customer[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Customer);
      });
      setCustomers(list);
    });

    // Sync deals
    const dealsRef = collection(db, 'deals');
    const unsubscribeDeals = onSnapshot(dealsRef, (snap) => {
      const list: Deal[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Deal);
      });
      setDeals(list);
    });

    // Sync catalog
    const catalogRef = collection(db, 'catalog');
    const unsubscribeCatalog = onSnapshot(catalogRef, (snap) => {
      const list: CatalogItem[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as CatalogItem);
      });
      setCatalog(list);
    });

    return () => {
      unsubscribeQuotes();
      unsubscribeCustomers();
      unsubscribeDeals();
      unsubscribeCatalog();
    };
  }, [user]);

  // Set initial Validity Date (default: 30 days from now)
  useEffect(() => {
    if (showBuilderModal && !isEditing) {
      const future = new Date();
      future.setDate(future.getDate() + 30);
      setBuilderValidUntil(future.toISOString().split('T')[0]);
    }
  }, [showBuilderModal, isEditing]);

  // Live Calculations for Quote Builder
  const calculatedSubtotal = builderLineItems.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unitPrice;
    const discount = itemTotal * (item.discountPercent / 100);
    return sum + (itemTotal - discount);
  }, 0);

  const calculatedTaxAmount = calculatedSubtotal * (builderTaxPercent / 100);
  const calculatedTotal = calculatedSubtotal + calculatedTaxAmount;

  // Filter Quotes
  const filteredQuotes = quotes.filter((q) => {
    // Versioning Filter: Show only latest versions unless requested otherwise
    if (!showArchivedVersions && !q.isLatest) return false;

    // Status Filter
    if (statusFilter !== 'all' && q.status !== statusFilter) return false;

    // Customer Filter
    if (customerFilter !== 'all' && q.customerId !== customerFilter) return false;

    // Search Query
    if (searchQuery.trim()) {
      const queryLower = searchQuery.toLowerCase();
      const customer = customers.find((c) => c.id === q.customerId);
      const matchesNum = q.quoteNumber.toLowerCase().includes(queryLower);
      const matchesCustomer = customer ? customer.name.toLowerCase().includes(queryLower) : false;
      const matchesNotes = q.notes?.toLowerCase().includes(queryLower);
      return matchesNum || matchesCustomer || matchesNotes;
    }

    return true;
  });

  // Builder actions
  const addLineItem = () => {
    setBuilderLineItems([
      ...builderLineItems,
      { description: '', quantity: 1, unitPrice: 0, discountPercent: 0 }
    ]);
  };

  const removeLineItem = (index: number) => {
    if (builderLineItems.length === 1) {
      setBuilderLineItems([{ description: '', quantity: 1, unitPrice: 0, discountPercent: 0 }]);
    } else {
      setBuilderLineItems(builderLineItems.filter((_, i) => i !== index));
    }
  };

  const updateLineItem = (index: number, fields: Partial<QuoteLineItem>) => {
    const updated = builderLineItems.map((item, i) => {
      if (i === index) {
        return { ...item, ...fields };
      }
      return item;
    });
    setBuilderLineItems(updated);
  };

  const handleSelectCatalogItem = (index: number, itemId: string) => {
    const item = catalog.find((c) => c.id === itemId);
    if (item) {
      updateLineItem(index, {
        catalogItemId: item.id,
        description: `${item.name} (${item.unitPrice} per ${item.unit})`,
        unitPrice: item.unitPrice,
        discountPercent: 0
      });
    }
  };

  const moveLineItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === builderLineItems.length - 1) return;

    const items = [...builderLineItems];
    const temp = items[index];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    items[index] = items[targetIdx];
    items[targetIdx] = temp;
    setBuilderLineItems(items);
  };

  // Open builder for creating a new quote
  const handleOpenCreateBuilder = () => {
    setIsEditing(false);
    setQuoteToEdit(null);
    setBuilderCustomerId('');
    setBuilderDealId('');
    setBuilderNotes('');
    setBuilderTaxPercent(15);
    setBuilderLineItems([{ description: '', quantity: 1, unitPrice: 0, discountPercent: 0 }]);
    setBuilderError(null);
    setShowBuilderModal(true);
  };

  // Open builder for editing an existing quote
  const handleOpenEditBuilder = (quote: Quote) => {
    if (quote.status !== 'Draft' && quote.status !== 'Sent') {
      alert("Only commercial quotes in Draft or Sent status can be modified.");
      return;
    }
    setIsEditing(true);
    setQuoteToEdit(quote);
    setBuilderCustomerId(quote.customerId);
    setBuilderDealId(quote.dealId || '');
    setBuilderValidUntil(quote.validUntil);
    setBuilderNotes(quote.notes || '');
    setBuilderTaxPercent(quote.taxPercent);
    setBuilderLineItems([...quote.lineItems]);
    setBuilderError(null);
    setShowBuilderModal(true);
  };

  // Submit Quote Builder Form (handles both Create and Versioning on Edit)
  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setBuilderError(null);

    if (!builderCustomerId) {
      setBuilderError("Please select a valid customer.");
      return;
    }

    if (builderLineItems.some(item => !item.description.trim())) {
      setBuilderError("All line items must have a valid description.");
      return;
    }

    if (builderLineItems.some(item => item.quantity <= 0 || item.unitPrice < 0)) {
      setBuilderError("Line item quantities must be greater than zero and prices non-negative.");
      return;
    }

    setBuilderSaving(true);
    try {
      const now = new Date().toISOString();
      const client = customers.find(c => c.id === builderCustomerId);
      const linkedDeal = deals.find(d => d.id === builderDealId);

      const quoteData: Omit<Quote, 'id'> = {
        customerId: builderCustomerId,
        customerName: client ? client.name : 'Unknown Client',
        dealId: builderDealId || undefined,
        dealTitle: linkedDeal ? linkedDeal.title : undefined,
        quoteNumber: '', // will be set below
        status: isEditing && quoteToEdit ? quoteToEdit.status : 'Draft',
        lineItems: builderLineItems,
        subtotal: calculatedSubtotal,
        taxPercent: builderTaxPercent,
        taxAmount: calculatedTaxAmount,
        total: calculatedTotal,
        notes: builderNotes.trim() || undefined,
        validUntil: builderValidUntil,
        createdBy: user?.uid || '',
        createdByEmail: user?.email || '',
        createdAt: isEditing && quoteToEdit ? quoteToEdit.createdAt : now,
        version: 1, // default
        isLatest: true,
        parentQuoteId: ''
      };

      if (isEditing && quoteToEdit) {
        // --- VERSIONING MODE ---
        // If editing a Draft or Sent quote, we create a new version document instead of overwriting, keeping history viewable.
        const prevVersionNum = quoteToEdit.version;
        const parentId = quoteToEdit.parentQuoteId || quoteToEdit.id;

        // 1. Mark the older document as not the latest version
        const oldDocRef = doc(db, 'quotes', quoteToEdit.id);
        await updateDoc(oldDocRef, {
          isLatest: false
        });

        // 2. Insert the new document as the latest version
        quoteData.quoteNumber = quoteToEdit.quoteNumber;
        quoteData.version = prevVersionNum + 1;
        quoteData.parentQuoteId = parentId;
        
        const quotesRef = collection(db, 'quotes');
        const docRef = await addDoc(quotesRef, quoteData);

        // Update selectedQuote details view if active
        if (selectedQuote?.id === quoteToEdit.id) {
          setSelectedQuote({ id: docRef.id, ...quoteData });
        }
      } else {
        // --- NEW QUOTE CREATION ---
        // Generate a clean sequential quote number based on existing documents
        const allQuotesSnap = await getDocs(collection(db, 'quotes'));
        // Count distinct quote numbers to increment
        const distinctNumbers = new Set(allQuotesSnap.docs.map(doc => doc.data().quoteNumber)).size;
        const generatedNum = `Q-2026-${String(distinctNumbers + 1).padStart(4, '0')}`;

        quoteData.quoteNumber = generatedNum;
        quoteData.parentQuoteId = ''; // will update with its own id once saved, or leave empty
        
        const quotesRef = collection(db, 'quotes');
        const docRef = await addDoc(quotesRef, quoteData);
        
        // Link parent ID to itself
        await updateDoc(doc(db, 'quotes', docRef.id), {
          parentQuoteId: docRef.id
        });
      }

      setShowBuilderModal(false);
    } catch (err) {
      console.error("Error storing quote proposal:", err);
      setBuilderError("Cloud datastore transmission failed. Please verify security parameters.");
    } finally {
      setBuilderSaving(false);
    }
  };

  // One-click action to mark a quote "Accepted" and update the linked deal to "Won"
  const handleAcceptQuoteAndAdvanceDeal = async (quote: Quote) => {
    try {
      // 1. Update quote status to Accepted
      const quoteRef = doc(db, 'quotes', quote.id);
      const now = new Date().toISOString();
      await updateDoc(quoteRef, {
        status: 'Accepted',
        respondedAt: now,
        updatedAt: now
      });

      // 2. If quote has a linked deal, offer/execute advancing it to Won with matching total value
      if (quote.dealId) {
        const dealRef = doc(db, 'deals', quote.dealId);
        await updateDoc(dealRef, {
          stage: 'Won',
          value: quote.total,
          updatedAt: now
        });
        alert(`Quote accepted! The linked deal has been automatically marked as 'Won' with a value of R ${quote.total.toLocaleString('en-ZA')}.`);
      } else {
        alert("Quote marked as Accepted.");
      }

      // Update local detailed state
      setSelectedQuote({ ...quote, status: 'Accepted', respondedAt: now });
    } catch (err) {
      console.error(err);
      alert("Failed to execute status escalation.");
    }
  };

  // Simulates emailing the customer contact with the generated PDF attachment
  const handleSendToCustomer = async (quote: Quote) => {
    const client = customers.find(c => c.id === quote.customerId);
    if (!client) {
      alert("No customer linked to this quote. Cannot identify destination contact.");
      return;
    }

    setSendingEmail(true);
    setEmailSentSuccess(false);

    try {
      // Simulate slow asynchronous worker network delay
      await new Promise((resolve) => setTimeout(resolve, 1800));

      // Update Quote Status to "Sent"
      const quoteRef = doc(db, 'quotes', quote.id);
      const now = new Date().toISOString();
      await updateDoc(quoteRef, {
        status: 'Sent',
        sentAt: now
      });

      setSelectedQuote({ ...quote, status: 'Sent', sentAt: now });
      setEmailSentSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Failed to trigger automated dispatch services.");
    } finally {
      setSendingEmail(false);
    }
  };

  // jsPDF high-fidelity commercial quote generator
  const handleGeneratePDF = (quote: Quote) => {
    const docPdf = new jsPDF();
    const client = customers.find(c => c.id === quote.customerId);

    // Decorative Corporate Header
    docPdf.setFillColor(15, 23, 42); // slate-900
    docPdf.rect(0, 0, 210, 38, 'F');

    // Branding Title
    docPdf.setTextColor(255, 255, 255);
    docPdf.setFont('Helvetica', 'bold');
    docPdf.setFontSize(20);
    docPdf.text("APPULENCE TECHNOLOGY GROUP", 14, 18);
    
    docPdf.setFont('Helvetica', 'normal');
    docPdf.setFontSize(8);
    docPdf.setTextColor(200, 200, 200);
    docPdf.text("SECURE SYSTEMS INTEGRATION • BIOMETRICS • ERP PORTALS", 14, 25);
    docPdf.text("Pretoria, South Africa  |  info@appulence.co.za", 14, 30);

    // Document Title Box
    docPdf.setFillColor(243, 244, 246); // slate-100
    docPdf.rect(14, 46, 182, 35, 'F');

    docPdf.setTextColor(15, 23, 42);
    docPdf.setFont('Helvetica', 'bold');
    docPdf.setFontSize(14);
    docPdf.text("COMMERCIAL QUOTATION", 20, 56);

    docPdf.setFont('Helvetica', 'normal');
    docPdf.setFontSize(9);
    docPdf.text(`Quote Number: ${quote.quoteNumber}`, 20, 64);
    docPdf.text(`Document Version: V${quote.version}`, 20, 70);
    docPdf.text(`Created On: ${new Date(quote.createdAt).toLocaleDateString()}`, 20, 76);

    // Validity block inside same box
    docPdf.text(`Valid Until: ${new Date(quote.validUntil).toLocaleDateString()}`, 110, 64);
    docPdf.text(`Created By: ${quote.createdByEmail || 'Authorized Agent'}`, 110, 70);
    docPdf.text(`Status Claim: ${quote.status.toUpperCase()}`, 110, 76);

    // Billing details
    docPdf.setFont('Helvetica', 'bold');
    docPdf.setFontSize(11);
    docPdf.text("CLIENT / ACCOUNT DETAIL", 14, 92);
    
    docPdf.setFont('Helvetica', 'normal');
    docPdf.setFontSize(9.5);
    docPdf.text(`Customer Name: ${client ? client.name : 'N/A'}`, 14, 99);
    docPdf.text(`Industry / Sector: ${client ? client.industry : 'N/A'}`, 14, 105);
    docPdf.text(`Registered Address: ${client ? client.address : 'N/A'}`, 14, 111);
    docPdf.text(`Corporate Tax ID: ${client ? client.taxNumber : 'N/A'}`, 14, 117);

    // Line items header
    let currentY = 132;
    docPdf.setFillColor(15, 23, 42);
    docPdf.rect(14, currentY, 182, 8, 'F');
    
    docPdf.setTextColor(255, 255, 255);
    docPdf.setFont('Helvetica', 'bold');
    docPdf.setFontSize(8.5);
    docPdf.text("DESCRIPTION / SOLUTIONS MAPPED", 18, currentY + 5.5);
    docPdf.text("QTY", 115, currentY + 5.5);
    docPdf.text("UNIT PRICE (ZAR)", 132, currentY + 5.5);
    docPdf.text("DISC %", 164, currentY + 5.5);
    docPdf.text("TOTAL (ZAR)", 180, currentY + 5.5);

    // Print line items
    docPdf.setTextColor(50, 50, 50);
    docPdf.setFont('Helvetica', 'normal');
    docPdf.setFontSize(8.5);

    quote.lineItems.forEach((item) => {
      currentY += 8;
      // Zebra stripe backgrounds
      docPdf.setFillColor(250, 250, 250);
      docPdf.rect(14, currentY, 182, 8, 'F');

      const itemSub = item.quantity * item.unitPrice;
      const discount = itemSub * (item.discountPercent / 100);
      const itemFinal = itemSub - discount;

      // Clean text formatting
      docPdf.text(item.description.substring(0, 52), 18, currentY + 5.5);
      docPdf.text(String(item.quantity), 116, currentY + 5.5);
      docPdf.text(item.unitPrice.toLocaleString('en-ZA'), 133, currentY + 5.5);
      docPdf.text(`${item.discountPercent}%`, 166, currentY + 5.5);
      docPdf.text(itemFinal.toLocaleString('en-ZA'), 181, currentY + 5.5);
    });

    // Subtotal table
    currentY += 16;
    docPdf.setDrawColor(220, 220, 220);
    docPdf.line(110, currentY, 196, currentY);

    docPdf.setFont('Helvetica', 'normal');
    docPdf.text("Subtotal:", 110, currentY + 6);
    docPdf.text(`R ${quote.subtotal.toLocaleString('en-ZA')}`, 165, currentY + 6);

    docPdf.text(`VAT (${quote.taxPercent}%):`, 110, currentY + 12);
    docPdf.text(`R ${quote.taxAmount.toLocaleString('en-ZA')}`, 165, currentY + 12);

    docPdf.setFont('Helvetica', 'bold');
    docPdf.text("Grand Total:", 110, currentY + 19);
    docPdf.text(`R ${quote.total.toLocaleString('en-ZA')}`, 165, currentY + 19);

    // Terms & notes
    if (quote.notes) {
      currentY += 32;
      docPdf.setFillColor(249, 250, 251);
      docPdf.rect(14, currentY, 182, 20, 'F');
      
      docPdf.setTextColor(100, 100, 100);
      docPdf.setFont('Helvetica', 'bold');
      docPdf.setFontSize(8);
      docPdf.text("AUTHORIZED MAPPING TERMS & NOTES", 18, currentY + 5);

      docPdf.setFont('Helvetica', 'italic');
      docPdf.setFontSize(7.5);
      docPdf.text(quote.notes.substring(0, 110), 18, currentY + 11);
    }

    // Save
    docPdf.save(`Quotation_${quote.quoteNumber}_V${quote.version}.pdf`);
  };

  // Delete Quote Handler (Admins only)
  const handleDeleteQuote = async (quoteId: string) => {
    if (!isAdmin) {
      alert("Only admins can delete commercial documents.");
      return;
    }
    if (confirm("Are you sure you want to permanently delete this quote?")) {
      try {
        await deleteDoc(doc(db, 'quotes', quoteId));
        setShowDetailModal(false);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-12 py-10 space-y-8 animate-fade-in">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/15 pb-6">
        <div className="space-y-1">
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider hover:opacity-80 transition-all mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Workspace
          </button>
          <h2 className="font-headline-md text-3xl font-black text-on-surface uppercase tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" /> Corporate Quotes & SLAs
          </h2>
          <p className="text-sm text-on-surface-variant">
            Create multi-version service proposals, budget matrices, and binding licensing agreements.
          </p>
        </div>

        <div>
          <button
            onClick={handleOpenCreateBuilder}
            className="px-6 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-full shadow-md hover:shadow-lg hover:scale-103 active:scale-97 transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4.5 h-4.5" /> New Quote Builder
          </button>
        </div>
      </div>

      {/* Filter and search panels */}
      <div className="bg-white rounded-3xl border border-outline-variant/15 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-on-surface-variant/50" />
            <input 
              type="text" 
              placeholder="Search quote numbers or clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-outline-variant/15 rounded-xl text-sm focus:outline-none focus:border-primary/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Status dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-outline-variant/15 rounded-xl text-xs font-bold focus:outline-none"
            >
              <option value="all">All Status Claims</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
              <option value="Expired">Expired</option>
            </select>

            {/* Customer filter */}
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-outline-variant/15 rounded-xl text-xs font-bold focus:outline-none max-w-xs"
            >
              <option value="all">All Corporate Customers</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Toggle Archived versions */}
            <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={showArchivedVersions}
                onChange={(e) => setShowArchivedVersions(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300"
              />
              Show History (Archived Versions)
            </label>
          </div>
        </div>
      </div>

      {/* Main Quote List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Synchronizing Quotation Matrices...</p>
        </div>
      ) : filteredQuotes.length === 0 ? (
        <div className="py-20 text-center bg-white border border-outline-variant/15 rounded-3xl p-8 space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-sm text-slate-500 font-bold">No quotes found mapping the requested filters.</p>
          <p className="text-xs text-slate-400">Add a new quote item or adjust filters above.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-outline-variant/15 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 uppercase text-[10px] font-black tracking-wider text-slate-500">
                <tr>
                  <th className="py-4 px-6">Quote Number</th>
                  <th className="py-4 px-6">Client Customer</th>
                  <th className="py-4 px-6">Total Amount (ZAR)</th>
                  <th className="py-4 px-6">Valid Until</th>
                  <th className="py-4 px-6">Version</th>
                  <th className="py-4 px-6">Status Claim</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredQuotes.map((q) => {
                  const client = customers.find(c => c.id === q.customerId);
                  return (
                    <tr 
                      key={q.id} 
                      className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${!q.isLatest ? 'opacity-60 bg-slate-50/30' : ''}`}
                      onClick={() => {
                        setSelectedQuote(q);
                        setShowDetailModal(true);
                      }}
                    >
                      <td className="py-4 px-6 font-black text-slate-900 flex items-center gap-1.5">
                        {q.quoteNumber}
                        {!q.isLatest && (
                          <span className="px-1.5 py-0.5 bg-slate-200 text-[8px] font-bold rounded text-slate-500 uppercase">Archived</span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-800">
                        {client ? client.name : 'Unknown Client'}
                      </td>
                      <td className="py-4 px-6 font-black text-slate-900 text-sm">
                        R {q.total.toLocaleString('en-ZA')}
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-500">
                        {new Date(q.validUntil).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 font-semibold">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] text-slate-600 font-bold">V{q.version}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-full border ${
                          q.status === 'Accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          q.status === 'Sent' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          q.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                          q.status === 'Expired' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                          'bg-amber-50 text-amber-700 border-amber-100' // Draft
                        }`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedQuote(q);
                              setShowDetailModal(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-primary transition-colors hover:bg-slate-50 rounded-lg cursor-pointer"
                            title="View quote details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {q.isLatest && (q.status === 'Draft' || q.status === 'Sent') && (
                            <button
                              onClick={() => handleOpenEditBuilder(q)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 transition-colors hover:bg-slate-50 rounded-lg cursor-pointer"
                              title="Edit and create new version"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteQuote(q.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 transition-colors hover:bg-slate-50 rounded-lg cursor-pointer"
                              title="Delete quote"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QUOTE BUILDER MODAL (Create & Edit-New Version) */}
      {showBuilderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-3xl border border-outline-variant/15 w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8 space-y-6 animate-scale-up">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-primary tracking-widest bg-primary/5 border border-primary/10 px-2.5 py-1 rounded-full">
                  System Tool
                </span>
                <h3 className="text-xl font-black text-on-surface uppercase tracking-tight">
                  {isEditing ? `Edit & Build New Version of ${quoteToEdit?.quoteNumber} (Currently V${quoteToEdit?.version})` : 'Create Corporate Commercial Quote'}
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {isEditing 
                    ? "Saving this edit will automatically lock the prior version and instantiate an incremented version."
                    : "Fill in the parameters below. Standard South African corporate rules (15% VAT claim) apply."}
                </p>
              </div>
              <button 
                onClick={() => setShowBuilderModal(false)}
                className="p-2 hover:bg-slate-50 rounded-xl text-on-surface-variant transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error banner */}
            {builderError && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 text-xs">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="font-bold">{builderError}</span>
              </div>
            )}

            <form onSubmit={handleSaveQuote} className="space-y-6">
              
              {/* Top metadata grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                
                {/* Customer selection */}
                <div className="space-y-1">
                  <label className="font-black uppercase tracking-wider text-slate-600 block">Select Account Customer</label>
                  <select
                    value={builderCustomerId}
                    onChange={(e) => {
                      setBuilderCustomerId(e.target.value);
                      // Reset deal selection as it depends on customer
                      setBuilderDealId('');
                    }}
                    disabled={isEditing}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold"
                    required
                  >
                    <option value="">-- Choose Corporate Customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Deal association */}
                <div className="space-y-1">
                  <label className="font-black uppercase tracking-wider text-slate-600 block">Link Sales Deal (Optional)</label>
                  <select
                    value={builderDealId}
                    onChange={(e) => setBuilderDealId(e.target.value)}
                    disabled={!builderCustomerId}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold disabled:opacity-50"
                  >
                    <option value="">-- No Linked Deal --</option>
                    {deals
                      .filter(d => d.customerId === builderCustomerId)
                      .map(d => (
                        <option key={d.id} value={d.id}>{d.title} (R {d.value.toLocaleString('en-ZA')})</option>
                      ))}
                  </select>
                </div>

                {/* Valid until date */}
                <div className="space-y-1">
                  <label className="font-black uppercase tracking-wider text-slate-600 block">Proposal Validity Date</label>
                  <input 
                    type="date"
                    value={builderValidUntil}
                    onChange={(e) => setBuilderValidUntil(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold"
                    required
                  />
                </div>

                {/* Tax rating */}
                <div className="space-y-1">
                  <label className="font-black uppercase tracking-wider text-slate-600 block">Corporate Tax (VAT %)</label>
                  <input 
                    type="number"
                    min="0"
                    max="100"
                    value={builderTaxPercent}
                    onChange={(e) => setBuilderTaxPercent(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-bold"
                    required
                  />
                </div>

              </div>

              {/* Line Items block */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">Proposal Line Items Mapped</h4>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="px-3 py-1.5 border border-primary/20 text-primary hover:bg-primary/5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add New Row
                  </button>
                </div>

                <div className="space-y-3">
                  {builderLineItems.map((item, index) => (
                    <div 
                      key={index} 
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center"
                    >
                      {/* Catalog quick selection */}
                      <div className="lg:col-span-3 space-y-1 text-xs">
                        <label className="font-bold text-slate-500 block">Choose Product/Service</label>
                        <select
                          value={item.catalogItemId || ''}
                          onChange={(e) => handleSelectCatalogItem(index, e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="">-- One-off Custom Item --</option>
                          {catalog.map(catItem => (
                            <option key={catItem.id} value={catItem.id}>{catItem.name} (R {catItem.unitPrice}/{catItem.unit})</option>
                          ))}
                        </select>
                      </div>

                      {/* Description */}
                      <div className="lg:col-span-4 space-y-1 text-xs">
                        <label className="font-bold text-slate-500 block">Description</label>
                        <input 
                          type="text"
                          value={item.description}
                          onChange={(e) => updateLineItem(index, { description: e.target.value })}
                          placeholder="e.g. Turnstile licensing, consulting SLA..."
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                          required
                        />
                      </div>

                      {/* Quantity */}
                      <div className="lg:col-span-1 space-y-1 text-xs">
                        <label className="font-bold text-slate-500 block">Qty</label>
                        <input 
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, { quantity: parseInt(e.target.value) || 1 })}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                          required
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="lg:col-span-2 space-y-1 text-xs">
                        <label className="font-bold text-slate-500 block">Unit Price (R)</label>
                        <input 
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(index, { unitPrice: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                          required
                        />
                      </div>

                      {/* Discount % */}
                      <div className="lg:col-span-1 space-y-1 text-xs">
                        <label className="font-bold text-slate-500 block">Disc %</label>
                        <input 
                          type="number"
                          min="0"
                          max="100"
                          value={item.discountPercent}
                          onChange={(e) => updateLineItem(index, { discountPercent: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                          required
                        />
                      </div>

                      {/* Actions/Reordering */}
                      <div className="lg:col-span-1 flex items-center justify-end gap-1.5 pt-4 lg:pt-0">
                        <button
                          type="button"
                          onClick={() => moveLineItem(index, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:bg-white border rounded disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveLineItem(index, 'down')}
                          disabled={index === builderLineItems.length - 1}
                          className="p-1 hover:bg-white border rounded disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeLineItem(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* Financial calculations block & Terms */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4 border-t border-slate-100">
                
                {/* Terms and notes */}
                <div className="md:col-span-7 space-y-2 text-xs">
                  <label className="font-black uppercase tracking-wider text-slate-600 block">Corporate Terms & Notes</label>
                  <textarea 
                    rows={4}
                    value={builderNotes}
                    onChange={(e) => setBuilderNotes(e.target.value)}
                    placeholder="Provide any detailed conditions, project deliverables mapping, payment schedule, or infrastructure dependencies..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none text-xs font-semibold"
                  />
                </div>

                {/* Subtotal table */}
                <div className="md:col-span-5 bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-3.5 text-xs text-slate-600 font-semibold">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 block border-b pb-1">Price Summary</span>
                  
                  <div className="flex justify-between">
                    <span>Active Subtotal:</span>
                    <span className="font-bold text-slate-800">R {calculatedSubtotal.toLocaleString('en-ZA')}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Corporate VAT ({builderTaxPercent}%):</span>
                    <span className="font-bold text-slate-800">R {calculatedTaxAmount.toLocaleString('en-ZA')}</span>
                  </div>

                  <div className="border-t border-slate-200 my-1 pt-2 flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-800">Grand Proposal Total:</span>
                    <span className="font-black text-primary text-md">R {calculatedTotal.toLocaleString('en-ZA')}</span>
                  </div>
                </div>

              </div>

              {/* Footer buttons */}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => setShowBuilderModal(false)}
                  className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px] rounded-xl cursor-pointer"
                >
                  Discard Changes
                </button>
                <button
                  type="submit"
                  disabled={builderSaving}
                  className="px-6 py-2.5 bg-primary hover:bg-opacity-95 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  {builderSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> MAPPING PROPOSAL...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" /> SAVE PROPOSAL
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* DETAILED VIEW MODAL WITH HISTORICAL SELECTOR, DISPATCH EMAIL, AND PDF EXPORTS */}
      {showDetailModal && selectedQuote && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-3xl border border-outline-variant/15 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8 space-y-6 animate-scale-up">
            
            {/* Top row controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-primary tracking-widest bg-primary/5 border border-primary/10 px-2.5 py-1 rounded-full">
                    Quote Information Center
                  </span>
                  {!selectedQuote.isLatest && (
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-md">
                      Older Archive Version
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  {selectedQuote.quoteNumber} <span className="text-xs text-slate-400 font-bold">V{selectedQuote.version}</span>
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Generate PDF */}
                <button
                  onClick={() => handleGeneratePDF(selectedQuote)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Generate PDF
                </button>

                {/* Dispatch / Send to Customer */}
                {selectedQuote.isLatest && (selectedQuote.status === 'Draft' || selectedQuote.status === 'Sent') && (
                  <button
                    onClick={() => handleSendToCustomer(selectedQuote)}
                    disabled={sendingEmail}
                    className="px-4 py-2 bg-primary text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    {sendingEmail ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Dispatching...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Send to Customer
                      </>
                    )}
                  </button>
                )}

                {/* Accept deal sync button */}
                {selectedQuote.isLatest && selectedQuote.status === 'Sent' && (
                  <button
                    onClick={() => handleAcceptQuoteAndAdvanceDeal(selectedQuote)}
                    className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Accept Proposal
                  </button>
                )}

                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Simulated Email dispatch banner */}
            {emailSentSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl space-y-1.5 text-xs animate-fade-in">
                <div className="font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" /> Auto-Dispatch Notification Triggered!
                </div>
                <p className="text-[11px] leading-relaxed text-emerald-700">
                  A high-priority commercial SLA document and proposal link was emailed to the customer's secure domain contacts. The quote status has been escalated to <strong>'Sent'</strong>.
                </p>
              </div>
            )}

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Visual Invoice styled sheet */}
              <div className="lg:col-span-8 border border-slate-200/80 rounded-3xl p-6 md:p-8 space-y-6 bg-slate-50/20 shadow-sm">
                
                {/* Branding and Client Mapping Info */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <span className="text-xs font-black text-slate-900 uppercase">Appulence Corporate Partner</span>
                    <p className="text-[10px] text-slate-400 font-bold">Secure Billing Entity</p>
                  </div>
                  {(() => {
                    const client = customers.find(c => c.id === selectedQuote.customerId);
                    return (
                      <div className="text-right text-xs">
                        <p className="font-black text-slate-800">{client ? client.name : 'Unknown Customer'}</p>
                        <p className="text-slate-400 text-[10px] font-semibold">{client ? client.industry : ''}</p>
                        <p className="text-slate-400 text-[10px] max-w-[180px] truncate">{client ? client.address : ''}</p>
                      </div>
                    );
                  })()}
                </div>

                {/* Line Items Table Rendering */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block border-b pb-1">Solution Line Items</span>
                  <div className="border rounded-2xl overflow-hidden bg-white">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead className="bg-slate-50 border-b uppercase text-[9px] font-black tracking-wider text-slate-500">
                        <tr>
                          <th className="py-3 px-4">Line Item Details</th>
                          <th className="py-3 px-4 text-center">Qty</th>
                          <th className="py-3 px-4 text-right">Unit Rate (R)</th>
                          <th className="py-3 px-4 text-center">Disc</th>
                          <th className="py-3 px-4 text-right">Amount (R)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedQuote.lineItems.map((item, idx) => {
                          const subTotal = item.quantity * item.unitPrice;
                          const discount = subTotal * (item.discountPercent / 100);
                          const finalSub = subTotal - discount;
                          return (
                            <tr key={idx} className="hover:bg-slate-50/30">
                              <td className="py-3 px-4 font-bold text-slate-800">{item.description}</td>
                              <td className="py-3 px-4 text-center font-bold text-slate-600">{item.quantity}</td>
                              <td className="py-3 px-4 text-right font-semibold text-slate-600">{item.unitPrice.toLocaleString('en-ZA')}</td>
                              <td className="py-3 px-4 text-center text-rose-600 font-bold">{item.discountPercent}%</td>
                              <td className="py-3 px-4 text-right font-black text-slate-900">{(finalSub).toLocaleString('en-ZA')}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="flex justify-end pt-2">
                  <div className="w-72 bg-white rounded-2xl border border-slate-100 p-4 space-y-3 text-xs text-slate-500">
                    <div className="flex justify-between">
                      <span>Mapped Subtotal:</span>
                      <span className="font-bold text-slate-800">R {selectedQuote.subtotal.toLocaleString('en-ZA')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Corporate Tax (VAT {selectedQuote.taxPercent}%):</span>
                      <span className="font-bold text-slate-800">R {selectedQuote.taxAmount.toLocaleString('en-ZA')}</span>
                    </div>
                    <div className="border-t border-slate-100 my-1 pt-2 flex justify-between items-center text-sm">
                      <span className="font-bold text-slate-800">Grand Total Amount:</span>
                      <span className="font-black text-primary">R {selectedQuote.total.toLocaleString('en-ZA')}</span>
                    </div>
                  </div>
                </div>

                {/* Terms and conditions */}
                {selectedQuote.notes && (
                  <div className="p-4 bg-white rounded-2xl border border-slate-100 space-y-1.5 text-[11px] text-slate-500 leading-relaxed italic">
                    <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider not-italic">Corporate Terms & Notes</span>
                    {selectedQuote.notes}
                  </div>
                )}

              </div>

              {/* Right Column: Status metrics and historical version controller */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Meta details */}
                <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-4 text-xs">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-black uppercase text-slate-700 text-[10px]">Quote Claim State</span>
                    <span className={`px-2 py-0.5 text-[9px] font-black rounded-full uppercase ${
                      selectedQuote.status === 'Accepted' ? 'bg-emerald-50 text-emerald-700' :
                      selectedQuote.status === 'Sent' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {selectedQuote.status}
                    </span>
                  </div>

                  <div className="space-y-2.5 text-slate-600 font-semibold">
                    <div className="flex justify-between">
                      <span>Active Version:</span>
                      <span className="font-black">V{selectedQuote.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Created By:</span>
                      <span className="font-bold text-slate-800 truncate max-w-[150px]" title={selectedQuote.createdByEmail}>{selectedQuote.createdByEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Created On:</span>
                      <span className="font-bold text-slate-800">{new Date(selectedQuote.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expiration SLA:</span>
                      <span className="font-bold text-slate-800">{new Date(selectedQuote.validUntil).toLocaleDateString()}</span>
                    </div>
                    {selectedQuote.sentAt && (
                      <div className="flex justify-between">
                        <span>Dispatched On:</span>
                        <span className="font-bold text-slate-800">{new Date(selectedQuote.sentAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    {selectedQuote.respondedAt && (
                      <div className="flex justify-between">
                        <span>Responded On:</span>
                        <span className="font-bold text-slate-800">{new Date(selectedQuote.respondedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* VERSIONING HISTORY CONTROLLER */}
                {(() => {
                  const siblingVersions = quotes
                    .filter(q => q.quoteNumber === selectedQuote.quoteNumber)
                    .sort((a, b) => b.version - a.version);

                  if (siblingVersions.length <= 1) return null;

                  return (
                    <div className="border border-slate-100 p-5 rounded-2xl bg-white space-y-4">
                      <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5 tracking-wide">
                        <History className="w-4 h-4 text-primary" /> Proposal Version History
                      </h4>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Every save cycle creates an archived historic copy to protect corporate audit records. Click below to load.
                      </p>

                      <div className="space-y-2">
                        {siblingVersions.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => setSelectedQuote(v)}
                            className={`w-full p-2.5 rounded-xl border text-left text-xs flex justify-between items-center transition-all ${
                              v.id === selectedQuote.id 
                                ? 'bg-primary/5 border-primary/20 text-primary font-black scale-[1.02]' 
                                : 'bg-slate-50/50 border-slate-200/50 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <span className="font-mono">V{v.version}</span>
                              <span className="text-[9px] uppercase font-bold text-slate-400">
                                {new Date(v.createdAt).toLocaleDateString()}
                              </span>
                            </span>
                            <span className="text-[9px] uppercase font-black text-slate-500">
                              {v.status}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
