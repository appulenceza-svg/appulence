import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  X, 
  Save, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  BookOpen,
  Loader2,
  Lock,
  Tag
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  getDocs, 
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { CatalogItem } from '../types';

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

const SAMPLE_CATALOG: Omit<CatalogItem, 'id'>[] = [
  {
    name: "Custom Mobile Application Development",
    description: "End-to-end design and coding of native or cross-platform iOS & Android mobile apps (React Native / Flutter) with secure API linkages.",
    type: "service",
    sku: "DEV-MOB-01",
    unitPrice: 1200,
    unit: "hour",
    taxable: true,
    active: true,
    category: "Development",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "Enterprise Full-Stack Web App",
    description: "Design, prototyping, development, and launch of complex web portals with real-time admin analytics dashboards.",
    type: "service",
    sku: "DEV-WEB-02",
    unitPrice: 1100,
    unit: "hour",
    taxable: true,
    active: true,
    category: "Development",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "UX Research & Brand Interface Design",
    description: "High-fidelity interactive Figma wireframes, prototype animations, responsive grid design systems, and brand guide creation.",
    type: "service",
    sku: "DES-UIX-01",
    unitPrice: 950,
    unit: "hour",
    taxable: true,
    active: true,
    category: "Design",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "DevOps & Cloud Infrastructure Provisioning",
    description: "Production-ready automated AWS/GCP setups, CI/CD deployment pipelines, load balancers, and Kubernetes orchestration.",
    type: "service",
    sku: "INF-OPS-01",
    unitPrice: 24000,
    unit: "project",
    taxable: true,
    active: true,
    category: "Infrastructure",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "Gemini API Smart Feature Integration",
    description: "Implementation of server-side generative artificial intelligence, contextual data summaries, smart tags, and prompt engineering.",
    type: "service",
    sku: "DEV-AI-01",
    unitPrice: 1500,
    unit: "hour",
    taxable: true,
    active: true,
    category: "Development",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "AWS Dedicated Computing Server",
    description: "Provision of high-availability AWS EC2 dedicated compute nodes, managed database storage, and automated nightly back-ups.",
    type: "product",
    sku: "HST-CLD-01",
    unitPrice: 3200,
    unit: "month",
    taxable: true,
    active: true,
    category: "Hosting",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "Transactional SMS & Email Gateway API Node",
    description: "Dedicated Twilio and Sendgrid transactional outbound messaging setups supporting high-throughput corporate alerts.",
    type: "product",
    sku: "TEL-SMS-01",
    unitPrice: 1800,
    unit: "each",
    taxable: true,
    active: true,
    category: "Telecoms",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "Starter WordPress Web Development Package",
    description: "Up to 5 custom pages, managed fast SSD WordPress hosting (1 year free), SSL certificate, domain (.co.za), and 3 business email setups.",
    type: "service",
    sku: "DEV-WP-01",
    unitPrice: 4500,
    unit: "project",
    taxable: true,
    active: true,
    category: "Development",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "Business WordPress & E-Commerce Package",
    description: "Up to 15 pages + WooCommerce store setup (PayFast/Yoco/Ozow), product catalog, managed hosting, SSL certificate, 10 business emails, & 3 months priority support.",
    type: "service",
    sku: "DEV-WP-02",
    unitPrice: 9500,
    unit: "project",
    taxable: true,
    active: true,
    category: "Development",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "Enterprise WordPress Custom Architecture Package",
    description: "Unlimited custom pages, dedicated VPS hosting, enterprise SSL, API integrations, high-security hardening, multi-language/currency, and 12-month SLA maintenance.",
    type: "service",
    sku: "DEV-WP-03",
    unitPrice: 18500,
    unit: "project",
    taxable: true,
    active: true,
    category: "Development",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "Monthly SLA Support & Systems Maintenance",
    description: "Sustained post-production monitoring, active threat scanning, framework security patches, and monthly advisory hours.",
    type: "service",
    sku: "SUP-SLA-01",
    unitPrice: 7500,
    unit: "month",
    taxable: true,
    active: true,
    category: "Support",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

interface CatalogDashboardProps {
  onBack: () => void;
}

export default function CatalogDashboard({ onBack }: CatalogDashboardProps) {
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  // State
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // All, Active, Inactive

  // Form State
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Individual field states for Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'product' | 'service'>('service');
  const [sku, setSku] = useState('');
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [unit, setUnit] = useState('hour');
  const [customUnit, setCustomUnit] = useState('');
  const [taxable, setTaxable] = useState(true);
  const [active, setActive] = useState(true);
  const [category, setCategory] = useState('Development');
  const [customCategory, setCustomCategory] = useState('');

  // Fixed Options
  const categoriesList = ["Development", "Design", "Support", "Infrastructure", "Hosting", "Telecoms", "Consulting", "Other"];
  const unitsList = ["hour", "license", "project", "month", "each", "Other"];

  // Real-time Firestore sync
  useEffect(() => {
    setLoading(true);
    const catalogRef = collection(db, 'catalog');
    const q = query(catalogRef, orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: CatalogItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as CatalogItem);
      });
      setItems(list);
      setLoading(false);
    }, (error) => {
      console.error("Firestore sync error: ", error);
      handleFirestoreError(error, OperationType.GET, 'catalog');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Seeding routine
  const handleSeedCatalog = async () => {
    if (!isAdmin) {
      alert("Only administrators can seed catalog sample items.");
      return;
    }
    setSeeding(true);
    try {
      const catalogRef = collection(db, 'catalog');
      for (const item of SAMPLE_CATALOG) {
        await addDoc(catalogRef, {
          ...item,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      alert("Successfully seeded catalog with professional corporate items!");
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.WRITE, 'catalog');
    } finally {
      setSeeding(false);
    }
  };

  // Open Form Modal
  const openNewForm = () => {
    if (!isAdmin) return;
    setEditingItem(null);
    setName('');
    setDescription('');
    setType('service');
    setSku('');
    setUnitPrice('');
    setUnit('hour');
    setCustomUnit('');
    setTaxable(true);
    setActive(true);
    setCategory('Development');
    setCustomCategory('');
    setFormError(null);
    setShowFormModal(true);
  };

  const openEditForm = (item: CatalogItem) => {
    if (!isAdmin) return;
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description || '');
    setType(item.type);
    setSku(item.sku || '');
    setUnitPrice(item.unitPrice.toString());
    
    if (unitsList.includes(item.unit)) {
      setUnit(item.unit);
      setCustomUnit('');
    } else {
      setUnit('Other');
      setCustomUnit(item.unit);
    }

    setTaxable(item.taxable);
    setActive(item.active);

    if (categoriesList.includes(item.category)) {
      setCategory(item.category);
      setCustomCategory('');
    } else {
      setCategory('Other');
      setCustomCategory(item.category);
    }

    setFormError(null);
    setShowFormModal(true);
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!name.trim()) {
      setFormError("Product/Service Name is required.");
      return;
    }

    const priceVal = parseFloat(unitPrice);
    if (isNaN(priceVal) || priceVal <= 0) {
      setFormError("Unit Price is required and must be a positive number greater than zero.");
      return;
    }

    const finalUnit = unit === 'Other' ? customUnit.trim() : unit;
    if (!finalUnit) {
      setFormError("Please specify the billing unit.");
      return;
    }

    const finalCategory = category === 'Other' ? customCategory.trim() : category;
    if (!finalCategory) {
      setFormError("Please specify a catalog category.");
      return;
    }

    try {
      const now = new Date().toISOString();
      const payload = {
        name: name.trim(),
        description: description.trim(),
        type,
        sku: sku.trim() || undefined,
        unitPrice: priceVal,
        unit: finalUnit,
        taxable,
        active,
        category: finalCategory,
        updatedAt: now
      };

      if (editingItem) {
        // Edit existing
        const itemRef = doc(db, 'catalog', editingItem.id);
        await updateDoc(itemRef, payload);
      } else {
        // Create new
        const catalogRef = collection(db, 'catalog');
        await addDoc(catalogRef, {
          ...payload,
          createdAt: now
        });
      }

      setShowFormModal(false);
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, editingItem ? OperationType.UPDATE : OperationType.CREATE, editingItem ? `catalog/${editingItem.id}` : 'catalog');
      setFormError("Failed to save. Review your cloud credentials.");
    }
  };

  // Toggle active status directly
  const handleToggleActive = async (item: CatalogItem) => {
    if (!isAdmin) return;
    try {
      const itemRef = doc(db, 'catalog', item.id);
      await updateDoc(itemRef, {
        active: !item.active,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, `catalog/${item.id}`);
    }
  };

  // Filter logic
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesType = typeFilter === 'All' || item.type === typeFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'Active') matchesStatus = item.active === true;
    if (statusFilter === 'Inactive') matchesStatus = item.active === false;

    return matchesSearch && matchesCategory && matchesType && matchesStatus;
  });

  // Extract all categories dynamically from catalog list
  const dynamicCategories = Array.from(new Set(items.map(i => i.category))).sort();

  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-12 py-10 space-y-8 animate-fade-in relative">
      
      {/* Upper Breadcrumbs & Quick actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/15 pb-6">
        <div className="space-y-1">
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider hover:opacity-80 transition-all mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Workspace
          </button>
          <h2 className="font-headline-md text-3xl font-black text-on-surface uppercase tracking-tight flex items-center gap-3">
            <Package className="w-8 h-8 text-primary" /> Products & Services Catalog
          </h2>
          <p className="text-sm text-on-surface-variant">
            Standardize item lines, pricing formulas, and corporate taxing matrices for client quotes.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap gap-2.5">
          {isAdmin && (
            <>
              <button
                onClick={handleSeedCatalog}
                disabled={seeding}
                className="px-4 py-2.5 border border-primary/20 text-primary hover:bg-primary/5 text-xs font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer flex items-center gap-2"
                title="Populate catalog with corporate app development business products and services"
              >
                {seeding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Seeding...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-primary" /> Seed Sample Catalog
                  </>
                )}
              </button>
              <button
                onClick={openNewForm}
                className="px-5 py-2.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-full shadow-md hover:shadow-lg hover:scale-103 active:scale-97 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Catalog Item
              </button>
            </>
          )}
        </div>
      </div>

      {/* Staff Permission Alert Bar */}
      {!isAdmin && (
        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Read-Only Catalog Browse</h4>
            <p className="text-xs text-slate-500">
              Your Sales Representative role grants browse permissions to read catalog items for quotes. Creating, editing, or deactivating catalog assets is restricted to Administrator roles.
            </p>
          </div>
        </div>
      )}

      {/* Search & Filters block */}
      <div className="bg-white rounded-3xl border border-outline-variant/15 p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search bar */}
          <div className="relative flex-grow">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-on-surface-variant/50" />
            <input 
              type="text" 
              placeholder="Search catalog by name, SKU code, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-outline-variant/15 rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Filter Group */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Category Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant block">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-outline-variant/15 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary/50"
              >
                <option value="All">All Categories</option>
                {dynamicCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                {dynamicCategories.length === 0 && (
                  <>
                    <option value="Development">Development</option>
                    <option value="Design">Design</option>
                    <option value="Support">Support</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Hosting">Hosting</option>
                    <option value="Telecoms">Telecoms</option>
                  </>
                )}
              </select>
            </div>

            {/* Type Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant block">Item Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-outline-variant/15 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary/50"
              >
                <option value="All">All Types</option>
                <option value="product">Product</option>
                <option value="service">Service</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant block">State Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-outline-variant/15 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary/50"
              >
                <option value="All">All States</option>
                <option value="Active">Active Only</option>
                <option value="Inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Table Card */}
      <div className="bg-white rounded-3xl border border-outline-variant/15 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Synchronizing master catalog catalog...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 px-4 text-center max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 bg-primary/5 text-primary flex items-center justify-center rounded-2xl mx-auto border border-primary/10">
              <Package className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black uppercase text-on-surface tracking-wide">No Catalog Items Discovered</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {items.length === 0 
                  ? "The Products & Services catalog collection is currently empty. Seed sample App Development listings to initiate sandbox testing."
                  : "No items match your active filter preferences. Refine your query or reset filter settings above."}
              </p>
            </div>
            {items.length === 0 && isAdmin && (
              <button
                onClick={handleSeedCatalog}
                className="px-5 py-2.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                Seed App Development Catalog
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/10 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  <th className="py-4 px-6">Name / Details</th>
                  <th className="py-4 px-4">Type</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4 text-right">Unit Rate</th>
                  <th className="py-4 px-4 text-center">Taxable</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  {isAdmin && <th className="py-4 px-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5 text-xs text-on-surface">
                {filteredItems.map((item) => (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-slate-50/50 transition-colors ${!item.active ? 'opacity-65 bg-slate-50/20' : ''}`}
                  >
                    {/* Item Details */}
                    <td className="py-4 px-6 max-w-xs md:max-w-md space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-on-surface text-sm line-clamp-1">{item.name}</span>
                        {item.sku && (
                          <span className="px-2 py-0.5 bg-slate-100 border border-slate-200/50 text-[9px] font-mono rounded text-slate-600 uppercase">
                            {item.sku}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed">
                        {item.description || <span className="italic text-slate-400">No high-level description cataloged.</span>}
                      </p>
                    </td>

                    {/* Type */}
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-full border ${
                        item.type === 'service' 
                          ? 'bg-purple-50 text-purple-700 border-purple-200/40' 
                          : 'bg-blue-50 text-blue-700 border-blue-200/40'
                      }`}>
                        {item.type}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 text-[10px] font-medium bg-slate-50 border border-slate-200 text-slate-700 rounded-lg">
                        {item.category}
                      </span>
                    </td>

                    {/* Price & Unit */}
                    <td className="py-4 px-4 text-right">
                      <span className="font-bold text-slate-800 text-sm">
                        R {item.unitPrice.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-on-surface-variant font-medium block">
                        per {item.unit}
                      </span>
                    </td>

                    {/* Taxable */}
                    <td className="py-4 px-4 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                        item.taxable 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/40' 
                          : 'bg-slate-100 text-slate-500 border border-slate-200/40'
                      }`}>
                        {item.taxable ? 'VAT' : 'EXEMPT'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {isAdmin ? (
                          <button
                            onClick={() => handleToggleActive(item)}
                            className="focus:outline-none transition-transform active:scale-95 cursor-pointer"
                            title={item.active ? "Click to set Inactive" : "Click to set Active"}
                          >
                            {item.active ? (
                              <span className="flex items-center gap-1.5 text-emerald-700 font-bold uppercase text-[10px] bg-emerald-50/80 border border-emerald-200/50 px-2.5 py-1 rounded-full">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                Active
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-slate-500 font-bold uppercase text-[10px] bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                                Inactive
                              </span>
                            )}
                          </button>
                        ) : (
                          item.active ? (
                            <span className="flex items-center gap-1.5 text-emerald-700 font-bold uppercase text-[10px] bg-emerald-50/80 border border-emerald-200/50 px-2.5 py-1 rounded-full">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                              Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-slate-500 font-bold uppercase text-[10px] bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                              Inactive
                            </span>
                          )
                        )}
                      </div>
                    </td>

                    {/* Edit Option (Admins) */}
                    {isAdmin && (
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => openEditForm(item)}
                          className="p-2 hover:bg-primary/5 border border-transparent hover:border-primary/10 rounded-xl text-primary transition-colors cursor-pointer"
                          title="Edit Catalog Item"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* NEW/EDIT MODAL FORM */}
      {showFormModal && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-outline-variant/15 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8 space-y-6 animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-outline-variant/10 pb-4">
              <div className="space-y-0.5">
                <h3 className="text-lg font-black uppercase text-on-surface flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" /> 
                  {editingItem ? 'Edit Catalog Asset' : 'Register Catalog Asset'}
                </h3>
                <p className="text-[11px] text-on-surface-variant">
                  Configure high-fidelity unit rates, tax matrices, and item metadata.
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
            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              
              {/* Product Name */}
              <div className="space-y-1.5">
                <label className="font-bold text-on-surface-variant uppercase tracking-wider block">
                  Product / Service Name <span className="text-primary">*</span>
                </label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dedicated AWS Computing Server node"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-outline-variant/15 rounded-xl text-xs focus:outline-none focus:border-primary/50 transition-colors font-semibold"
                  required
                />
              </div>

              {/* Grid 2-column: Type & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-on-surface-variant uppercase tracking-wider block">Catalog Type</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl border border-outline-variant/15">
                    <button
                      type="button"
                      onClick={() => setType('service')}
                      className={`py-2 text-center rounded-lg font-bold transition-all cursor-pointer ${
                        type === 'service' 
                          ? 'bg-white shadow-sm text-primary border border-outline-variant/5' 
                          : 'text-on-surface-variant'
                      }`}
                    >
                      Service
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('product')}
                      className={`py-2 text-center rounded-lg font-bold transition-all cursor-pointer ${
                        type === 'product' 
                          ? 'bg-white shadow-sm text-primary border border-outline-variant/5' 
                          : 'text-on-surface-variant'
                      }`}
                    >
                      Product
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-on-surface-variant uppercase tracking-wider block">SKU Code (Optional)</label>
                  <input 
                    type="text" 
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. DEV-WEB-02"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-outline-variant/15 rounded-xl text-xs focus:outline-none focus:border-primary/50 transition-colors uppercase tracking-wider font-mono font-semibold"
                  />
                </div>
              </div>

              {/* Grid 2-column: Category & Unit Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Category Selector */}
                <div className="space-y-1.5">
                  <label className="font-bold text-on-surface-variant uppercase tracking-wider block">Catalog Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-outline-variant/15 rounded-xl text-xs focus:outline-none focus:border-primary/50 font-semibold"
                  >
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  
                  {category === 'Other' && (
                    <input 
                      type="text"
                      placeholder="Specify custom category..."
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full mt-2 px-3.5 py-2 bg-slate-50 border border-outline-variant/15 rounded-xl text-xs focus:outline-none focus:border-primary/50 font-semibold animate-fade-in"
                      required
                    />
                  )}
                </div>

                {/* Unit Price */}
                <div className="space-y-1.5">
                  <label className="font-bold text-on-surface-variant uppercase tracking-wider block">
                    Unit Price (ZAR) <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-on-surface-variant/40">R</span>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0.01"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      placeholder="1200.00"
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-outline-variant/15 rounded-xl text-xs focus:outline-none focus:border-primary/50 transition-colors font-bold text-slate-800"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Unit selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-on-surface-variant uppercase tracking-wider block">Billing Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-outline-variant/15 rounded-xl text-xs focus:outline-none focus:border-primary/50 font-semibold"
                  >
                    {unitsList.map(u => (
                      <option key={u} value={u}>per {u}</option>
                    ))}
                  </select>

                  {unit === 'Other' && (
                    <input 
                      type="text"
                      placeholder="Specify custom billing unit (e.g. project)..."
                      value={customUnit}
                      onChange={(e) => setCustomUnit(e.target.value)}
                      className="w-full mt-2 px-3.5 py-2 bg-slate-50 border border-outline-variant/15 rounded-xl text-xs focus:outline-none focus:border-primary/50 font-semibold animate-fade-in"
                      required
                    />
                  )}
                </div>

                {/* Flags: Taxable & Active */}
                <div className="space-y-3 pt-4">
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-outline-variant/10">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-700 tracking-wide block">Taxable Asset</span>
                      <span className="text-[10px] text-on-surface-variant">Subject standard VAT calculation.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTaxable(!taxable)}
                      className="text-primary hover:opacity-85 focus:outline-none cursor-pointer"
                    >
                      {taxable ? (
                        <ToggleRight className="w-10 h-10 text-primary" />
                      ) : (
                        <ToggleLeft className="w-10 h-10 text-slate-300" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Toggle for direct edits */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-outline-variant/10">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-700 tracking-wide block">Active Status</span>
                  <span className="text-[10px] text-on-surface-variant">Inactive assets remain intact in historical logs.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActive(!active)}
                  className="text-primary hover:opacity-85 focus:outline-none cursor-pointer"
                >
                  {active ? (
                    <ToggleRight className="w-10 h-10 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-slate-300" />
                  )}
                </button>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="font-bold text-on-surface-variant uppercase tracking-wider block">Description</label>
                <textarea 
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail the deliverable specifications, corporate SLA metrics, or license allowances..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-outline-variant/15 rounded-xl text-xs focus:outline-none focus:border-primary/50 transition-colors font-semibold"
                />
              </div>

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
                  className="px-6 py-2.5 bg-primary text-white hover:opacity-90 rounded-full font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 shadow-sm hover:shadow"
                >
                  <Save className="w-4 h-4" /> Save Asset
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
