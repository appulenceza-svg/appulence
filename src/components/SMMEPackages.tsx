import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  Smartphone,
  Layers,
  Users,
  MessageSquare,
  HelpCircle,
  Sparkles,
  Building2,
  ChevronRight,
  TrendingUp,
  Briefcase
} from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

interface AppDevPlan {
  name: string;
  badge: string;
  bestFor: string;
  userLimit: string;
  coreModules: string;
  communication: string;
  support: string;
  appPresence: string;
  price: string;
  isPopular?: boolean;
}

const smmeNgoPlans: AppDevPlan[] = [
  {
    name: 'Essential (Startup)',
    badge: 'Micro Enterprises & Small NGOs',
    bestFor: 'Startups / Local NPOs',
    userLimit: 'Up to 50 users',
    coreModules: 'CRM, Basic Reporting, Task Management',
    communication: 'Email Integration',
    support: 'Email Support',
    appPresence: 'Web Portal',
    price: 'R8,000 – R12,000',
  },
  {
    name: 'Business (Growth)',
    badge: 'Growing SMMEs & Mid-size NGOs',
    bestFor: 'Established SMMEs / Regional NPOs',
    userLimit: 'Up to 250 users',
    coreModules: 'All Essential + Inventory/Donations, Analytics',
    communication: 'Email + SMS Integration',
    support: 'Email + Live Chat',
    appPresence: 'Web Portal + PWA',
    isPopular: true,
    price: 'R20,000 – R35,000',
  },
  {
    name: 'Corporate (Scale)',
    badge: 'Large Enterprises & National NGOs',
    bestFor: 'Large Organizations / National NPOs',
    userLimit: 'Unlimited',
    coreModules: 'All Business + HR, Advanced Finance, Custom Integrations',
    communication: 'Omnichannel + AI Automations',
    support: 'Dedicated Account Manager',
    appPresence: 'Custom Mobile App (iOS & Android)',
    price: 'R50,000+ (Custom Quote)',
  },
];

export default function SMMEPackages() {
  const [activeTab, setActiveTab] = useState<'cards' | 'matrix'>('cards');

  return (
    <div className="min-h-screen bg-white text-on-surface flex flex-col pt-[100px]">
      <Header />
      <main className="flex-grow">
        <section className="py-24 relative overflow-hidden">
          {/* Soft color glowing vectors to separate content */}
          <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary-container/10 blur-[140px] rounded-full pointer-events-none" />
          <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-primary/5 blur-[140px] rounded-full pointer-events-none" />

          <div className="max-w-[1280px] mx-auto px-6 md:px-12 space-y-16 relative z-10">
            
            {/* Module Header */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <span className="font-label-md text-xs uppercase tracking-widest text-primary font-bold flex items-center justify-center gap-2">
                <Briefcase className="w-4 h-4 text-primary animate-pulse" /> Business & NGO Solutions
              </span>
              <h2 className="font-headline-lg text-3xl md:text-5xl font-black tracking-tight text-on-surface">
                App Packages for SMMEs & NGOs
              </h2>
              <p className="font-body-md text-base md:text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
                Empower your business or non-profit organization with custom-built applications designed to streamline operations, enhance communication, and scale your impact.
              </p>
              <div className="w-16 h-1 bg-primary mx-auto rounded-full" />
            </div>

            {/* View Layout Selector (Cards vs Comparison Matrix) */}
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
                  Development Plans
                </button>
                <button
                  onClick={() => setActiveTab('matrix')}
                  className={`px-5 py-2.5 rounded-lg transition-all ${
                    activeTab === 'matrix'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Detailed Comparison Matrix
                </button>
              </div>
            </div>

            {/* Render Switchable Layouts */}
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
                  {smmeNgoPlans.map((plan) => {
                    return (
                      <div
                        key={plan.name}
                        className={`relative bg-white rounded-2xl p-8 border flex flex-col justify-between transition-all duration-300 hover:shadow-2xl ${
                          plan.isPopular
                            ? 'border-primary shadow-xl scale-102 ring-2 ring-primary/20 md:-translate-y-2'
                            : 'border-outline-variant/20 hover:border-outline-variant/50 shadow-md'
                        }`}
                      >
                        {/* Recommendation Badge */}
                        {plan.isPopular && (
                          <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 primary-gradient text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md whitespace-nowrap">
                            Most Popular Choice
                          </div>
                        )}

                        <div className="space-y-6">
                          {/* Plan Heading */}
                          <div>
                            <span className="text-[10px] text-primary/80 font-black uppercase tracking-wider">
                              {plan.badge}
                            </span>
                            <h3 className="font-headline-sm text-xl md:text-2xl font-black text-on-surface mt-1">
                              {plan.name}
                            </h3>
                            <p className="font-body-sm text-xs text-on-surface-variant mt-2 leading-relaxed">
                              Ideal setup for {plan.bestFor.toLowerCase()}.
                            </p>
                          </div>

                          {/* Pricing block */}
                          <div className="pt-2 border-b border-outline-variant/10 pb-6">
                            <span className="text-2xl font-black tracking-tight text-on-surface">
                              {plan.price}
                            </span>
                            <span className="text-xs text-on-surface-variant font-medium block mt-1">
                              Estimated Investment
                            </span>
                          </div>

                          {/* Features Visual List */}
                          <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-xs text-on-surface font-medium">
                              <Users className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              <div>
                                <span className="text-on-surface-variant/70 block uppercase tracking-wide text-[9px] font-bold">User Capacity</span>
                                <span className="text-on-surface font-bold text-xs">{plan.userLimit}</span>
                              </div>
                            </li>
                            <li className="flex items-start gap-3 text-xs text-on-surface font-medium">
                              <Layers className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              <div>
                                <span className="text-on-surface-variant/70 block uppercase tracking-wide text-[9px] font-bold">Bundled Modules</span>
                                <span className="text-on-surface font-bold text-xs">{plan.coreModules}</span>
                              </div>
                            </li>
                            <li className="flex items-start gap-3 text-xs text-on-surface font-medium">
                              <Smartphone className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              <div>
                                <span className="text-on-surface-variant/70 block uppercase tracking-wide text-[9px] font-bold">App Presence</span>
                                <span className="text-on-surface font-bold text-xs">{plan.appPresence}</span>
                              </div>
                            </li>
                            <li className="flex items-start gap-3 text-xs text-on-surface font-medium">
                              <MessageSquare className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              <div>
                                <span className="text-on-surface-variant/70 block uppercase tracking-wide text-[9px] font-bold">Communications</span>
                                <span className="text-on-surface font-bold text-xs">{plan.communication}</span>
                              </div>
                            </li>
                            <li className="flex items-start gap-3 text-xs text-on-surface font-medium">
                              <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              <div>
                                <span className="text-on-surface-variant/70 block uppercase tracking-wide text-[9px] font-bold">SLA &amp; Support</span>
                                <span className="text-on-surface font-bold text-xs">{plan.support}</span>
                              </div>
                            </li>
                          </ul>
                        </div>

                        {/* CTA Action Button */}
                        <div className="pt-8">
                          <a
                            href="/#onboarding"
                            className={`block w-full text-center py-3 rounded-xl font-label-md text-xs uppercase tracking-widest font-black transition-all ${
                              plan.isPopular
                                ? 'primary-gradient text-white shadow-lg shadow-primary/25 hover:shadow-xl active:scale-95'
                                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high active:scale-95'
                            }`}
                          >
                            Get Started
                          </a>
                        </div>
                      </div>
                    );
                  })}
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
                  {/* Responsive comparison table wrapper */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container-low border-b border-outline-variant/10">
                          <th className="p-6 font-headline-xs text-xs md:text-sm font-black text-on-surface uppercase tracking-wider w-[25%]">
                            Feature / Metric
                          </th>
                          <th className="p-6 font-headline-xs text-xs md:text-sm font-black text-on-surface uppercase tracking-wider w-[25%] bg-primary/5">
                            Essential (Startup)
                          </th>
                          <th className="p-6 font-headline-xs text-xs md:text-sm font-black text-primary uppercase tracking-wider w-[25%] relative bg-primary-container/10">
                            <span className="absolute top-0 left-0 right-0 h-1 bg-primary" />
                            Business (Growth)
                          </th>
                          <th className="p-6 font-headline-xs text-xs md:text-sm font-black text-on-surface uppercase tracking-wider w-[25%]">
                            Corporate (Scale)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10 text-xs md:text-sm">
                        {/* Row 1: Best For */}
                        <tr className="hover:bg-surface-container-low/40 transition-colors">
                          <td className="p-6 font-bold text-on-surface-variant uppercase tracking-wide text-[10px] md:text-xs">
                            Best For
                          </td>
                          <td className="p-6 font-medium text-on-surface bg-primary/5">
                            Startups / Local NPOs
                          </td>
                          <td className="p-6 font-bold text-on-surface bg-primary-container/5">
                            Established SMMEs / Regional NPOs
                          </td>
                          <td className="p-6 font-medium text-on-surface">
                            Large Organizations / National NPOs
                          </td>
                        </tr>

                        {/* Row 2: User Limit */}
                        <tr className="hover:bg-surface-container-low/40 transition-colors">
                          <td className="p-6 font-bold text-on-surface-variant uppercase tracking-wide text-[10px] md:text-xs">
                            User Limit
                          </td>
                          <td className="p-6 font-mono text-on-surface bg-primary/5">
                            Up to 50 users
                          </td>
                          <td className="p-6 font-mono font-bold text-primary bg-primary-container/5">
                            Up to 250 users
                          </td>
                          <td className="p-6 font-mono text-on-surface">
                            Unlimited
                          </td>
                        </tr>

                        {/* Row 3: Core Modules */}
                        <tr className="hover:bg-surface-container-low/40 transition-colors">
                          <td className="p-6 font-bold text-on-surface-variant uppercase tracking-wide text-[10px] md:text-xs">
                            Core Modules
                          </td>
                          <td className="p-6 font-medium text-on-surface bg-primary/5">
                            CRM, Basic Reporting, Task Management
                          </td>
                          <td className="p-6 font-bold text-on-surface bg-primary-container/5">
                            All Essential + Inventory/Donations, Analytics
                          </td>
                          <td className="p-6 font-medium text-on-surface">
                            All Business + HR, Advanced Finance
                          </td>
                        </tr>

                        {/* Row 4: Communication */}
                        <tr className="hover:bg-surface-container-low/40 transition-colors">
                          <td className="p-6 font-bold text-on-surface-variant uppercase tracking-wide text-[10px] md:text-xs">
                            Communication
                          </td>
                          <td className="p-6 font-medium text-on-surface bg-primary/5">
                            Email Integration
                          </td>
                          <td className="p-6 font-medium text-on-surface bg-primary-container/5">
                            Email + SMS Integration
                          </td>
                          <td className="p-6 font-bold text-on-surface">
                            Omnichannel + AI Automations
                          </td>
                        </tr>

                        {/* Row 5: Support */}
                        <tr className="hover:bg-surface-container-low/40 transition-colors">
                          <td className="p-6 font-bold text-on-surface-variant uppercase tracking-wide text-[10px] md:text-xs">
                            Support
                          </td>
                          <td className="p-6 font-medium text-on-surface bg-primary/5">
                            Email Support
                          </td>
                          <td className="p-6 font-medium text-on-surface bg-primary-container/5">
                            Email + Live Chat
                          </td>
                          <td className="p-6 font-bold text-on-surface">
                            Dedicated Account Manager
                          </td>
                        </tr>

                        {/* Row 6: App Presence */}
                        <tr className="hover:bg-surface-container-low/40 transition-colors">
                          <td className="p-6 font-bold text-on-surface-variant uppercase tracking-wide text-[10px] md:text-xs">
                            App Presence
                          </td>
                          <td className="p-6 font-medium text-on-surface bg-primary/5">
                            Web Portal
                          </td>
                          <td className="p-6 font-bold text-primary bg-primary-container/5">
                            Web Portal + PWA
                          </td>
                          <td className="p-6 font-medium text-on-surface">
                            Custom Mobile App (iOS & Android)
                          </td>
                        </tr>

                        {/* Row 7: Est. Price */}
                        <tr className="hover:bg-surface-container-low/40 transition-colors">
                          <td className="p-6 font-bold text-on-surface-variant uppercase tracking-wide text-[10px] md:text-xs">
                            Est. Price
                          </td>
                          <td className="p-6 font-black text-on-surface bg-primary/5">
                            R8,000 – R12,000
                          </td>
                          <td className="p-6 font-black text-primary bg-primary-container/5">
                            R20,000 – R35,000
                          </td>
                          <td className="p-6 font-black text-on-surface">
                            R50,000+ (Custom Quote)
                          </td>
                        </tr>

                        {/* Row 8: Action row */}
                        <tr>
                          <td className="p-6 border-none"></td>
                          <td className="p-6 bg-primary/5 border-none">
                            <a
                              href="/#onboarding"
                              className="inline-flex items-center justify-center w-full py-2.5 rounded-lg font-black text-xs uppercase tracking-wide bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface"
                            >
                              Get Started
                            </a>
                          </td>
                          <td className="p-6 bg-primary-container/5 border-none">
                            <a
                              href="/#onboarding"
                              className="inline-flex items-center justify-center w-full py-2.5 rounded-lg font-black text-xs uppercase tracking-wide primary-gradient text-white shadow-md hover:shadow-lg transition-all"
                            >
                              Select Business
                            </a>
                          </td>
                          <td className="p-6 border-none">
                            <a
                              href="/#onboarding"
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
