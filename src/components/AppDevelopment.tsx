import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  Smartphone,
  Layers,
  Users,
  MessageSquare,
  HelpCircle,
  Coins,
  Sparkles,
  Building2,
  ChevronRight,
  TrendingUp,
  Sliders,
  Award
} from 'lucide-react';

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

const appDevPlans: AppDevPlan[] = [
  {
    name: 'Starter (Basic)',
    badge: 'Pre-Schools & Small Academy',
    bestFor: 'Small Schools / Pre-schools',
    userLimit: 'Up to 200 learners',
    coreModules: 'SIS, Attendance, Messaging',
    communication: 'Email & In-App',
    support: 'Email/Ticket System',
    appPresence: 'Web Portal + PWA',
    price: 'R10,000 – R15,000',
  },
  {
    name: 'Professional (Growth)',
    badge: 'Primary & High Schools',
    bestFor: 'Mid-sized Primary/High Schools',
    userLimit: 'Up to 800 learners',
    coreModules: 'All Starter + Exams, Fees',
    communication: 'SMS + Email + In-App',
    support: 'Email + Live Chat',
    appPresence: 'Custom Mobile App (Android)',
    isPopular: true,
    price: 'R25,000 – R45,000',
  },
  {
    name: 'Enterprise (Advanced)',
    badge: 'Large / Multi-campus Groups',
    bestFor: 'Large/Multi-campus Schools',
    userLimit: 'Unlimited',
    coreModules: 'All Prof + Transport, HR, Payroll',
    communication: 'Priority Multi-channel + AI Alerts',
    support: 'Dedicated Account Manager',
    appPresence: 'Custom Mobile App (iOS & Android)',
    price: 'R60,000+ (Custom Quote)',
  },
];

export default function AppDevelopment() {
  const [activeTab, setActiveTab] = useState<'cards' | 'matrix'>('cards');
  const [learnerCount, setLearnerCount] = useState<number>(350);

  // Determine the recommended tier based on school size slider
  const getRecommendedTier = (learners: number): string => {
    if (learners <= 200) return 'Starter (Basic)';
    if (learners <= 800) return 'Professional (Growth)';
    return 'Enterprise (Advanced)';
  };

  const recommendedTier = getRecommendedTier(learnerCount);

  return (
    <section id="app-development" className="py-24 bg-white relative overflow-hidden border-t border-outline-variant/10">
      {/* Soft color glowing vectors to separate content */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary-container/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-primary/5 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-[1280px] mx-auto px-6 md:px-12 space-y-16 relative z-10">
        
        {/* Module Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="font-label-md text-xs uppercase tracking-widest text-primary font-bold flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" /> Custom App Suite
          </span>
          <h2 className="font-headline-lg text-3xl md:text-5xl font-black tracking-tight text-on-surface">
            School App Development
          </h2>
          <p className="font-body-md text-base md:text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            Provision native mobile apps and unified school portal engines designed for your specific learner base, compliance codes, and administration pathways.
          </p>
          <div className="w-16 h-1 bg-primary mx-auto rounded-full" />
        </div>

        {/* Interactive Layout Switcher & Fast Calculator */}
        <div className="bg-surface-container-low border border-outline-variant/15 p-6 md:p-8 rounded-3xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-md">
          
          {/* Slider Calculator */}
          <div id="school-calc-container" className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Sliders className="w-4 h-4" /> Real-time Scalability Estimator
            </div>
            <h3 className="font-headline-sm text-lg md:text-xl font-black text-on-surface">
              Select Your School Size
            </h3>
            <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
              Drag the control below to input your total enrolled learners. We will automatically highlight the custom software and hosting matrix recommended for your infrastructure.
            </p>
            
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-on-surface-variant uppercase tracking-wider">Total Learners</span>
                <span className="px-3 py-1 bg-primary text-white rounded-lg text-xs font-black font-mono">
                  {learnerCount === 1000 ? '1,000+ (Enterprise)' : `${learnerCount} Learners`}
                </span>
              </div>
              <input
                id="learner-slider"
                type="range"
                min="50"
                max="1000"
                step="50"
                value={learnerCount}
                onChange={(e) => setLearnerCount(parseInt(e.target.value))}
                className="w-full h-2 bg-outline-variant/30 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
                <span>50 (Small Pre-school)</span>
                <span>500 (Primary/High)</span>
                <span>1,000+ (Multi-campus)</span>
              </div>
            </div>
          </div>

          {/* Dynamic Recommendation Output */}
          <div id="school-rec-card" className="lg:col-span-5 bg-white border border-outline-variant/20 p-6 rounded-2xl flex flex-col justify-between h-full shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-md" />
            <div className="space-y-3">
              <span className="text-[10px] bg-primary-container/20 text-primary px-2.5 py-1 rounded-full font-black uppercase tracking-wider inline-block">
                Tailored Recommendation
              </span>
              <h4 className="font-headline-sm text-base md:text-lg font-black text-on-surface flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" /> {recommendedTier}
              </h4>
              <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                Ideal for <strong className="text-on-surface">{learnerCount <= 200 ? 'Small Schools / Pre-schools' : learnerCount <= 800 ? 'Mid-sized Primary/High Schools' : 'Large/Multi-campus Groups'}</strong> requiring customized database profiles, portals, and modules.
              </p>
            </div>
            <div className="pt-4 border-t border-outline-variant/10 mt-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-on-surface-variant/60 block uppercase font-bold">Est. Investment / Year</span>
                <span className="text-sm font-black text-primary">
                  {learnerCount <= 200 ? 'R10,000 – R15,000' : learnerCount <= 800 ? 'R25,000 – R45,000' : 'R60,000+ (Custom Quote)'}
                </span>
              </div>
              <a
                href="#onboarding"
                className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-primary hover:text-primary-container transition-colors"
              >
                Onboard Now <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>

        </div>

        {/* View Layout Selector (Cards vs Comparison Matrix) */}
        <div className="flex justify-center">
          <div className="bg-surface-container p-1 rounded-xl flex border border-outline-variant/15 font-semibold text-xs">
            <button
              id="view-cards-btn"
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
              id="view-matrix-btn"
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
              {appDevPlans.map((plan) => {
                const isRecommended = recommendedTier === plan.name;
                return (
                  <div
                    id={`appdev-card-${plan.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    key={plan.name}
                    className={`relative bg-white rounded-2xl p-8 border flex flex-col justify-between transition-all duration-300 hover:shadow-2xl ${
                      isRecommended
                        ? 'border-primary shadow-xl scale-102 ring-2 ring-primary/20 md:-translate-y-2'
                        : plan.isPopular
                        ? 'border-outline-variant/50 shadow-md'
                        : 'border-outline-variant/20'
                    }`}
                  >
                    {/* Recommendation Badge */}
                    {isRecommended && (
                      <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 primary-gradient text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md whitespace-nowrap">
                        Recommended For You
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
                          Estimated Investment (Annual Subscription)
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
                        href="#onboarding"
                        className={`block w-full text-center py-3 rounded-xl font-label-md text-xs uppercase tracking-widest font-black transition-all ${
                          isRecommended
                            ? 'primary-gradient text-white shadow-lg shadow-primary/25 hover:shadow-xl active:scale-95'
                            : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high active:scale-95'
                        }`}
                      >
                        Choose {plan.name.split(' ')[0]}
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
                        Starter (Basic)
                      </th>
                      <th className="p-6 font-headline-xs text-xs md:text-sm font-black text-primary uppercase tracking-wider w-[25%] relative bg-primary-container/10">
                        <span className="absolute top-0 left-0 right-0 h-1 bg-primary" />
                        Professional (Growth)
                      </th>
                      <th className="p-6 font-headline-xs text-xs md:text-sm font-black text-on-surface uppercase tracking-wider w-[25%]">
                        Enterprise (Advanced)
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
                        Small Schools / Pre-schools
                      </td>
                      <td className="p-6 font-bold text-on-surface bg-primary-container/5">
                        Mid-sized Primary/High Schools
                      </td>
                      <td className="p-6 font-medium text-on-surface">
                        Large/Multi-campus Schools
                      </td>
                    </tr>

                    {/* Row 2: User Limit */}
                    <tr className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="p-6 font-bold text-on-surface-variant uppercase tracking-wide text-[10px] md:text-xs">
                        User Limit
                      </td>
                      <td className="p-6 font-mono text-on-surface bg-primary/5">
                        Up to 200 learners
                      </td>
                      <td className="p-6 font-mono font-bold text-primary bg-primary-container/5">
                        Up to 800 learners
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
                        SIS, Attendance, Messaging
                      </td>
                      <td className="p-6 font-bold text-on-surface bg-primary-container/5">
                        All Starter + Exams, Fees
                      </td>
                      <td className="p-6 font-medium text-on-surface">
                        All Prof + Transport, HR, Payroll
                      </td>
                    </tr>

                    {/* Row 4: Communication */}
                    <tr className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="p-6 font-bold text-on-surface-variant uppercase tracking-wide text-[10px] md:text-xs">
                        Communication
                      </td>
                      <td className="p-6 font-medium text-on-surface bg-primary/5">
                        Email &amp; In-App
                      </td>
                      <td className="p-6 font-medium text-on-surface bg-primary-container/5">
                        SMS + Email + In-App
                      </td>
                      <td className="p-6 font-bold text-on-surface">
                        Priority Multi-channel + AI Alerts
                      </td>
                    </tr>

                    {/* Row 5: Support */}
                    <tr className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="p-6 font-bold text-on-surface-variant uppercase tracking-wide text-[10px] md:text-xs">
                        Support
                      </td>
                      <td className="p-6 font-medium text-on-surface bg-primary/5">
                        Email/Ticket System
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
                        Web Portal + PWA
                      </td>
                      <td className="p-6 font-bold text-primary bg-primary-container/5">
                        Custom Mobile App (Android)
                      </td>
                      <td className="p-6 font-medium text-on-surface">
                        Custom Mobile App (iOS &amp; Android)
                      </td>
                    </tr>

                    {/* Row 7: Est. Price/yr */}
                    <tr className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="p-6 font-bold text-on-surface-variant uppercase tracking-wide text-[10px] md:text-xs">
                        Est. Price/yr
                      </td>
                      <td className="p-6 font-black text-on-surface bg-primary/5">
                        R10,000 – R15,000
                      </td>
                      <td className="p-6 font-black text-primary bg-primary-container/5">
                        R25,000 – R45,000
                      </td>
                      <td className="p-6 font-black text-on-surface">
                        R60,000+ (Custom Quote)
                      </td>
                    </tr>

                    {/* Row 8: Action row */}
                    <tr>
                      <td className="p-6 border-none"></td>
                      <td className="p-6 bg-primary/5 border-none">
                        <a
                          href="#onboarding"
                          className="inline-flex items-center justify-center w-full py-2.5 rounded-lg font-black text-xs uppercase tracking-wide bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface"
                        >
                          Select Starter
                        </a>
                      </td>
                      <td className="p-6 bg-primary-container/5 border-none">
                        <a
                          href="#onboarding"
                          className="inline-flex items-center justify-center w-full py-2.5 rounded-lg font-black text-xs uppercase tracking-wide primary-gradient text-white shadow-md hover:shadow-lg transition-all"
                        >
                          Select Growth
                        </a>
                      </td>
                      <td className="p-6 border-none">
                        <a
                          href="#onboarding"
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
  );
}
