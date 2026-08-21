import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  Globe,
  Server,
  Lock,
  Mail,
  Zap,
  ShieldCheck,
  ShoppingBag,
  Sliders,
  Sparkles,
  Award,
  ChevronRight,
  Layers,
  HelpCircle,
  Headphones,
  CheckCircle2,
  FileText
} from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

interface WebPackage {
  name: string;
  badge: string;
  bestFor: string;
  pageCount: string;
  hosting: string;
  ssl: string;
  emailSetup: string;
  ecommerce: string;
  support: string;
  price: string;
  monthlyHostingFee: string;
  isPopular?: boolean;
  features: string[];
}

const wordpressPlans: WebPackage[] = [
  {
    name: 'Starter WordPress',
    badge: 'Small Businesses & Startups',
    bestFor: 'Freelancers, Local Shops & Personal Brands',
    pageCount: 'Up to 5 Custom Pages',
    hosting: '1 Year Free Fast SSD Hosting Included',
    ssl: 'Free Let\'s Encrypt SSL Certificate',
    emailSetup: '3 Professional Business Email Accounts',
    ecommerce: 'Not Included (Lead Gen Focus)',
    support: '1 Month Free Technical Support & Security',
    price: 'R3,500 – R5,500',
    monthlyHostingFee: 'R199/mo (Free for Year 1)',
    features: [
      'Up to 5 Fully Responsive Custom Pages',
      'Managed Fast SSD WordPress Hosting (1 Yr Free)',
      'Free SSL Certificate (HTTPS Encryption)',
      'Custom Domain (.co.za) & 3 Business Email Setups',
      'Mobile & Tablet Responsive Layouts',
      'Contact Form & Direct WhatsApp Chat Button',
      'Basic On-Page SEO & Google Indexing',
      'Social Media & Google Maps Integration',
      'Anti-Spam & Basic Security Plugins Setup',
      '30 Days Post-Launch Maintenance & Support'
    ]
  },
  {
    name: 'Business WordPress',
    badge: 'Growing Companies & E-Commerce',
    bestFor: 'Established Businesses, Online Stores & Booking Agencies',
    pageCount: 'Up to 15 Pages + E-Commerce Store',
    hosting: '1 Year Free Premium Managed Hosting',
    ssl: 'Free Wildcard SSL + Daily Automated Backups',
    emailSetup: '10 Professional Business Email Accounts',
    ecommerce: 'Full WooCommerce Integration (Up to 50 Products)',
    support: '3 Months Priority Support & Maintenance',
    isPopular: true,
    price: 'R8,500 – R12,500',
    monthlyHostingFee: 'R399/mo (Free for Year 1)',
    features: [
      'Up to 15 Custom Styled Pages + Blog / News Portal',
      'Full WooCommerce E-Commerce Integration',
      'Payment Gateway Setup (PayFast, Yoco, Ozow, Stripe)',
      'Product Catalog Setup (Up to 50 Products with Inventory)',
      'Free Managed High-Speed SSD Hosting (1 Yr Free)',
      'Free Wildcard SSL Certificate & Daily Off-site Backups',
      '10 Custom Business Email Addresses (@yourcompany)',
      'Online Appointment / Service Booking System',
      'Advanced Speed Caching & SEO Optimization',
      'Admin Dashboard Training Session & User Manual',
      '3 Months Priority Security Patching & Maintenance'
    ]
  },
  {
    name: 'Enterprise WordPress',
    badge: 'Corporates & High-Traffic Portals',
    bestFor: 'Large Organizations, Multi-Vendor Stores & Portals',
    pageCount: 'Unlimited Pages & Custom Architecture',
    hosting: 'Dedicated VPS Cloud Server with CDN & DDoS Protection',
    ssl: 'Enterprise SSL + Hourly Real-Time Backups',
    emailSetup: 'Unlimited Professional Business Email Accounts',
    ecommerce: 'Advanced Multi-Vendor or Custom Wholesale Portal',
    support: '12 Months Dedicated SLA Account Management',
    price: 'R18,500+ (Custom Quote)',
    monthlyHostingFee: 'R899/mo (Free for Year 1)',
    features: [
      'Unlimited Pages & Custom WordPress Theme Architecture',
      'Dedicated VPS Cloud Server Hosting (1 Yr Included)',
      'Enterprise SSL Certificate & Global CDN Acceleration',
      'Custom API Integrations (CRM, ERP, Payment & Accounting)',
      'Unlimited Products & Multi-Currency / Language Support',
      'High-Security Hardening (Firewall, Malware Scanner, 2FA)',
      'Real-time Analytics Dashboard & Custom Reporting',
      'Custom Member Portals & Restricted Content Zones',
      'Dedicated Account Manager & 24/7 SLA Priority Support',
      '12 Months Full System Maintenance, Updates & Backups'
    ]
  }
];

export default function WebDevPackages() {
  const [activeTab, setActiveTab] = useState<'cards' | 'matrix'>('cards');
  const [pageEstimate, setPageEstimate] = useState<number>(5);
  const [includeEcommerce, setIncludeEcommerce] = useState<boolean>(false);
  const [includeBooking, setIncludeBooking] = useState<boolean>(false);

  // Calculate estimated price based on custom features
  const calculateEstimate = () => {
    let base = 3500;
    if (pageEstimate > 5) {
      base += (pageEstimate - 5) * 450;
    }
    if (includeEcommerce) {
      base += 3500;
    }
    if (includeBooking) {
      base += 1500;
    }
    return base;
  };

  const estimatedPrice = calculateEstimate();

  const handleSelectPackage = () => {
    window.location.href = '/#onboarding';
  };

  return (
    <div className="min-h-screen bg-white text-on-surface flex flex-col pt-[100px]">
      <Header />
      <main className="flex-grow">
        <section className="py-20 relative overflow-hidden">
          {/* Ambient glowing background blobs */}
          <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary-container/10 blur-[140px] rounded-full pointer-events-none" />
          <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-primary/5 blur-[140px] rounded-full pointer-events-none" />

          <div className="max-w-[1280px] mx-auto px-6 md:px-12 space-y-16 relative z-10">
            
            {/* Header Section */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <span className="font-label-md text-xs uppercase tracking-widest text-primary font-bold flex items-center justify-center gap-2">
                <Globe className="w-4 h-4 text-primary animate-pulse" /> WordPress &amp; Web Development
              </span>
              <h1 className="font-headline-lg text-3xl md:text-5xl font-black tracking-tight text-on-surface">
                WordPress Web Development Packages
              </h1>
              <p className="font-body-md text-base md:text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
                All-inclusive WordPress web design packages bundled with <strong>free high-speed hosting</strong>, <strong>SSL security certificates</strong>, <strong>business email accounts</strong>, and <strong>ongoing technical maintenance</strong>.
              </p>
              <div className="w-16 h-1 bg-primary mx-auto rounded-full" />
            </div>

            {/* Value Highlights Banner */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-surface-container-low border border-outline-variant/15 p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-on-surface">Managed Hosting</h4>
                  <p className="text-[11px] text-on-surface-variant">1 Year Free SSD Hosting</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-on-surface">Free SSL Certificate</h4>
                  <p className="text-[11px] text-on-surface-variant">256-Bit Bank-Grade HTTPS</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-on-surface">Business Email</h4>
                  <p className="text-[11px] text-on-surface-variant">Custom Domain Mailboxes</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-on-surface">Security &amp; Backups</h4>
                  <p className="text-[11px] text-on-surface-variant">Automated Maintenance</p>
                </div>
              </div>
            </div>

            {/* Interactive Calculator Box */}
            <div className="bg-surface-container-low border border-outline-variant/15 p-6 md:p-8 rounded-3xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-md">
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <Sliders className="w-4 h-4" /> Real-time Price Estimator
                </div>
                <h3 className="font-headline-sm text-lg md:text-xl font-black text-on-surface">
                  Customize Your WordPress Website Requirements
                </h3>
                <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                  Adjust page numbers and feature add-ons below to see instant pricing estimates tailored to your project scope.
                </p>

                {/* Slider for Pages */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Number of Custom Pages</span>
                    <span className="px-3 py-1 bg-primary text-white rounded-lg text-xs font-black font-mono">
                      {pageEstimate} Pages
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    value={pageEstimate}
                    onChange={(e) => setPageEstimate(parseInt(e.target.value))}
                    className="w-full h-2 bg-outline-variant/30 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                    <span>1 Page (Landing Page)</span>
                    <span>15 Pages (Business)</span>
                    <span>30+ Pages (Enterprise)</span>
                  </div>
                </div>

                {/* Checkboxes for Add-ons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <label className="flex items-center gap-3 p-3 bg-white border border-outline-variant/20 rounded-xl cursor-pointer hover:border-primary/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={includeEcommerce}
                      onChange={(e) => setIncludeEcommerce(e.target.checked)}
                      className="w-4 h-4 accent-primary rounded"
                    />
                    <div>
                      <span className="text-xs font-bold text-on-surface block">WooCommerce Online Shop</span>
                      <span className="text-[10px] text-on-surface-variant">Products, Payments &amp; Checkout</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-white border border-outline-variant/20 rounded-xl cursor-pointer hover:border-primary/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={includeBooking}
                      onChange={(e) => setIncludeBooking(e.target.checked)}
                      className="w-4 h-4 accent-primary rounded"
                    />
                    <div>
                      <span className="text-xs font-bold text-on-surface block">Online Booking / Reservations</span>
                      <span className="text-[10px] text-on-surface-variant">Calendar &amp; Appointment Scheduling</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Estimate Result Box */}
              <div className="lg:col-span-5 bg-white border border-outline-variant/20 p-6 rounded-2xl flex flex-col justify-between h-full shadow-sm relative overflow-hidden">
                <div className="space-y-3">
                  <span className="text-[10px] bg-primary-container/20 text-primary px-2.5 py-1 rounded-full font-black uppercase tracking-wider inline-block">
                    Estimated Investment
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-bold text-on-surface-variant">R</span>
                    <span className="text-4xl md:text-5xl font-black tracking-tight text-primary">
                      {estimatedPrice.toLocaleString()}
                    </span>
                  </div>
                  <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                    Includes full WordPress setup, custom layout design, free 1-year managed SSD hosting, free SSL security, and domain/email configuration.
                  </p>
                </div>

                <div className="pt-4 border-t border-outline-variant/10 mt-4 flex items-center justify-between">
                  <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> All-Inclusive Package
                  </span>
                  <a
                    href="#onboarding"
                    onClick={handleSelectPackage}
                    className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-primary hover:text-primary-container transition-colors"
                  >
                    Request Proposal <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* View Selector (Cards vs Comparison Table) */}
            <div className="flex justify-center">
              <div className="bg-surface-container p-1 rounded-xl flex border border-outline-variant/15 font-semibold text-xs">
                <button
                  onClick={() => setActiveTab('cards')}
                  className={`px-5 py-2.5 rounded-lg transition-all ${
                    activeTab === 'cards'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  WordPress Packages
                </button>
                <button
                  onClick={() => setActiveTab('matrix')}
                  className={`px-5 py-2.5 rounded-lg transition-all ${
                    activeTab === 'matrix'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Detailed Package Matrix
                </button>
              </div>
            </div>

            {/* Switchable Layout Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'cards' ? (
                <motion.div
                  key="cards-view"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch"
                >
                  {wordpressPlans.map((plan) => (
                    <div
                      key={plan.name}
                      className={`relative bg-white rounded-2xl p-8 border flex flex-col justify-between transition-all duration-300 hover:shadow-2xl ${
                        plan.isPopular
                          ? 'border-primary shadow-xl scale-102 ring-2 ring-primary/20 md:-translate-y-2'
                          : 'border-outline-variant/20 hover:border-outline-variant/50 shadow-md'
                      }`}
                    >
                      {/* Popular Choice Badge */}
                      {plan.isPopular && (
                        <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 primary-gradient text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md whitespace-nowrap">
                          Most Popular Package
                        </div>
                      )}

                      <div className="space-y-6">
                        {/* Heading */}
                        <div>
                          <span className="text-[10px] text-primary/80 font-black uppercase tracking-wider">
                            {plan.badge}
                          </span>
                          <h3 className="font-headline-sm text-xl md:text-2xl font-black text-on-surface mt-1">
                            {plan.name}
                          </h3>
                          <p className="font-body-sm text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                            {plan.bestFor}
                          </p>
                        </div>

                        {/* Price Block */}
                        <div className="pt-2 border-b border-outline-variant/10 pb-6">
                          <span className="text-2xl md:text-3xl font-black tracking-tight text-on-surface">
                            {plan.price}
                          </span>
                          <span className="text-[11px] text-primary font-bold block mt-1">
                            Includes Hosting, SSL, Emails &amp; Setup
                          </span>
                          <span className="text-[10px] text-on-surface-variant/70 block mt-0.5">
                            Renewal Hosting: {plan.monthlyHostingFee}
                          </span>
                        </div>

                        {/* Features checklist */}
                        <div className="space-y-3">
                          <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant block">Included Features:</span>
                          <ul className="space-y-2.5">
                            {plan.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2.5 text-xs text-on-surface font-medium">
                                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* CTA Action Button */}
                      <div className="pt-8">
                        <a
                          href="/#onboarding"
                          onClick={handleSelectPackage}
                          className={`block w-full text-center py-3.5 rounded-xl font-label-md text-xs uppercase tracking-widest font-black transition-all ${
                            plan.isPopular
                              ? 'primary-gradient text-white shadow-lg shadow-primary/25 hover:shadow-xl active:scale-95'
                              : 'bg-surface-container text-on-surface hover:bg-surface-container-high active:scale-95'
                          }`}
                        >
                          Select {plan.name.split(' ')[0]}
                        </a>
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="matrix-view"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white border border-outline-variant/15 rounded-2xl overflow-hidden shadow-xl"
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container-low border-b border-outline-variant/10">
                          <th className="p-6 font-headline-xs text-xs md:text-sm font-black text-on-surface uppercase tracking-wider w-[25%]">
                            Feature / Component
                          </th>
                          <th className="p-6 font-headline-xs text-xs md:text-sm font-black text-on-surface uppercase tracking-wider w-[25%] bg-primary/5">
                            Starter WordPress
                          </th>
                          <th className="p-6 font-headline-xs text-xs md:text-sm font-black text-primary uppercase tracking-wider w-[25%] relative bg-primary-container/10">
                            <span className="absolute top-0 left-0 right-0 h-1 bg-primary" />
                            Business WordPress
                          </th>
                          <th className="p-6 font-headline-xs text-xs md:text-sm font-black text-on-surface uppercase tracking-wider w-[25%]">
                            Enterprise WordPress
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10 text-xs md:text-sm">
                        <tr className="hover:bg-surface-container-low/40 transition-colors">
                          <td className="p-6 font-bold text-on-surface-variant uppercase tracking-wide text-[10px] md:text-xs">
                            Target Audience
                          </td>
                          <td className="p-6 font-medium text-on-surface bg-primary/5">
                            Small Businesses &amp; Startups
                          </td>
                          <td className="p-6 font-bold text-on-surface bg-primary-container/5">
                            Growing Companies &amp; E-Commerce
                          </td>
                          <td className="p-6 font-medium text-on-surface">
                            Corporates &amp; High-Traffic Portals
                          </td>
                        </tr>

                        <tr className="hover:bg-surface-container-low/40 transition-colors">
                          <td className="p-6 font-bold text-on-surface-variant uppercase tracking-wide text-[10px] md:text-xs">
                            Page Capacity
                          </td>
                          <td className="p-6 font-mono text-on-surface bg-primary/5">
                            Up to 5 Pages
                          </td>
                          <td className="p-6 font-mono font-bold text-primary bg-primary-container/5">
                            Up to 15 Pages + Shop
                          </td>
                          <td className="p-6 font-mono text-on-surface">
                            Unlimited Custom Pages
                          </td>
                        </tr>

                        <tr className="hover:bg-surface-container-low/40 transition-colors">
                          <td className="p-6 font-bold text-on-surface-variant uppercase tracking-wide text-[10px] md:text-xs">
                            Managed SSD Hosting
                          </td>
                          <td className="p-6 font-medium text-emerald-700 font-bold bg-primary/5">
                            ✓ 1 Year Free Included
                          </td>
                          <td className="p-6 font-medium text-emerald-700 font-bold bg-primary-container/5">
                            ✓ 1 Year Free Premium Included
                          </td>
                          <td className="p-6 font-medium text-emerald-700 font-bold">
                            ✓ 1 Year Free Dedicated VPS Cloud
                          </td>
                        </tr>

                        <tr className="hover:bg-surface-container-low/40 transition-colors">
                          <td className="p-6 font-bold text-on-surface-variant uppercase tracking-wide text-[10px] md:text-xs">
                            SSL Certificate
                          </td>
                          <td className="p-6 font-medium text-on-surface bg-primary/5">
                            Free Let's Encrypt SSL
                          </td>
                          <td className="p-6 font-medium text-on-surface bg-primary-container/5">
                            Free Wildcard SSL + Daily Backups
                          </td>
                          <td className="p-6 font-bold text-on-surface">
                            Enterprise SSL + Hourly Backups
                          </td>
                        </tr>

                        <tr className="hover:bg-surface-container-low/40 transition-colors">
                          <td className="p-6 font-bold text-on-surface-variant uppercase tracking-wide text-[10px] md:text-xs">
                            Business Email
                          </td>
                          <td className="p-6 font-medium text-on-surface bg-primary/5">
                            3 Email Accounts
                          </td>
                          <td className="p-6 font-bold text-primary bg-primary-container/5">
                            10 Email Accounts
                          </td>
                          <td className="p-6 font-medium text-on-surface">
                            Unlimited Email Accounts
                          </td>
                        </tr>

                        <tr className="hover:bg-surface-container-low/40 transition-colors">
                          <td className="p-6 font-bold text-on-surface-variant uppercase tracking-wide text-[10px] md:text-xs">
                            E-Commerce Store
                          </td>
                          <td className="p-6 font-medium text-on-surface-variant/50 bg-primary/5">
                            Optional Add-on
                          </td>
                          <td className="p-6 font-bold text-primary bg-primary-container/5">
                            WooCommerce (PayFast, Yoco, Ozow)
                          </td>
                          <td className="p-6 font-medium text-on-surface">
                            Custom Wholesale / Multi-Vendor
                          </td>
                        </tr>

                        <tr className="hover:bg-surface-container-low/40 transition-colors">
                          <td className="p-6 font-bold text-on-surface-variant uppercase tracking-wide text-[10px] md:text-xs">
                            Support &amp; Maintenance
                          </td>
                          <td className="p-6 font-medium text-on-surface bg-primary/5">
                            30 Days Post-Launch Support
                          </td>
                          <td className="p-6 font-medium text-on-surface bg-primary-container/5">
                            3 Months Priority Support
                          </td>
                          <td className="p-6 font-bold text-on-surface">
                            12 Months SLA &amp; Dedicated Manager
                          </td>
                        </tr>

                        <tr className="hover:bg-surface-container-low/40 transition-colors">
                          <td className="p-6 font-bold text-on-surface-variant uppercase tracking-wide text-[10px] md:text-xs">
                            Package Price
                          </td>
                          <td className="p-6 font-black text-on-surface bg-primary/5">
                            R3,500 – R5,500
                          </td>
                          <td className="p-6 font-black text-primary bg-primary-container/5">
                            R8,500 – R12,500
                          </td>
                          <td className="p-6 font-black text-on-surface">
                            R18,500+ (Custom Quote)
                          </td>
                        </tr>

                        <tr>
                          <td className="p-6 border-none"></td>
                          <td className="p-6 bg-primary/5 border-none">
                            <a
                              href="/#onboarding"
                              onClick={handleSelectPackage}
                              className="inline-flex items-center justify-center w-full py-2.5 rounded-lg font-black text-xs uppercase tracking-wide bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface"
                            >
                              Choose Starter
                            </a>
                          </td>
                          <td className="p-6 bg-primary-container/5 border-none">
                            <a
                              href="/#onboarding"
                              onClick={handleSelectPackage}
                              className="inline-flex items-center justify-center w-full py-2.5 rounded-lg font-black text-xs uppercase tracking-wide primary-gradient text-white shadow-md hover:shadow-lg transition-all"
                            >
                              Choose Business
                            </a>
                          </td>
                          <td className="p-6 border-none">
                            <a
                              href="/#onboarding"
                              onClick={handleSelectPackage}
                              className="inline-flex items-center justify-center w-full py-2.5 rounded-lg font-black text-xs uppercase tracking-wide bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface"
                            >
                              Request Quote
                            </a>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
