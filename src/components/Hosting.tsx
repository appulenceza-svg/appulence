import { useState } from 'react';
import { Check, X, Server, Zap, Cpu } from 'lucide-react';
import { PricingPlan } from '../types';

const plans: PricingPlan[] = [
  {
    name: 'Starter Node',
    price: '199',
    period: 'mo',
    buttonText: 'Deploy Starter',
    features: [
      '4 vCPU Cores',
      '8 GB DDR5 ECC Memory',
      '160 GB NVMe Storage',
      '5 TB Outbound Bandwidth',
      '99.9% SLA Uptime Guarantee',
    ],
    unsupportedFeatures: [
      'Enterprise DDoS Mitigation',
      'Custom Anycast IP Routing',
    ],
  },
  {
    name: 'Business Pod',
    price: '499',
    period: 'mo',
    isPopular: true,
    buttonText: 'Deploy Business',
    features: [
      '16 vCPU Cores',
      '32 GB DDR5 ECC Memory',
      '500 GB NVMe Storage',
      '15 TB Outbound Bandwidth',
      '99.99% SLA Uptime Guarantee',
      'Enterprise DDoS Mitigation',
    ],
    unsupportedFeatures: [
      'Custom Anycast IP Routing',
    ],
  },
  {
    name: 'Enterprise Grid',
    price: '1499',
    period: 'mo',
    buttonText: 'Deploy Enterprise Grid',
    features: [
      '64 vCPU Cores',
      '128 GB DDR5 ECC Memory',
      '2 TB NVMe SSD Storage',
      'Unlimited Outbound Bandwidth',
      '99.999% SLA Uptime Guarantee',
      'Enterprise DDoS Mitigation',
      'Custom Anycast IP Routing',
    ],
  },
];

export default function Hosting() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annually'>('monthly');

  return (
    <section id="hosting" className="py-24 bg-surface-container-low relative overflow-hidden">
      {/* Dynamic glow lines background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-container/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-[1280px] mx-auto px-6 md:px-12 space-y-16 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="font-label-md text-xs uppercase tracking-widest text-primary font-bold">
            Deployment Infrastructure
          </span>
          <h2 className="font-headline-lg text-3xl md:text-5xl font-black tracking-tight text-on-surface">
            Premium Elastic Cloud Hosting
          </h2>
          <p className="font-body-md text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            Deploy your enterprise applications on our redundant, high-availability virtual private server grid, backed by Tier 4 security standards.
          </p>

          {/* Billing Switcher */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <span className={`text-sm font-semibold tracking-wide transition-colors ${billingPeriod === 'monthly' ? 'text-primary' : 'text-on-surface-variant'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annually' : 'monthly')}
              className="relative w-12 h-6 rounded-full bg-outline-variant/30 hover:bg-outline-variant/50 transition-colors"
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-primary transition-transform duration-300 ${
                  billingPeriod === 'annually' ? 'translate-x-6 bg-primary-container' : ''
                }`}
              />
            </button>
            <span className={`text-sm font-semibold tracking-wide flex items-center gap-1.5 transition-colors ${billingPeriod === 'annually' ? 'text-primary' : 'text-on-surface-variant'}`}>
              Annually
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-container/20 text-primary-container uppercase tracking-wide">
                Save 20%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const rawPrice = parseInt(plan.price);
            const displayPrice =
              billingPeriod === 'annually' ? Math.floor(rawPrice * 0.8) : rawPrice;

            return (
              <div
                key={plan.name}
                className={`relative bg-white rounded-2xl p-8 border flex flex-col justify-between transition-all duration-300 hover:shadow-2xl ${
                  plan.isPopular
                    ? 'border-primary shadow-xl scale-102 ring-2 ring-primary/20 md:-translate-y-2'
                    : 'border-outline-variant/25'
                }`}
              >
                {/* Popular Badge */}
                {plan.isPopular && (
                  <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 primary-gradient text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md">
                    Most Popular
                  </div>
                )}

                <div className="space-y-6">
                  {/* Icon & Plan Name */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-headline-sm text-2xl font-black text-on-surface">
                        {plan.name}
                      </h3>
                      <p className="font-body-sm text-xs text-on-surface-variant tracking-wider uppercase font-semibold mt-1">
                        High Performance VPS
                      </p>
                    </div>
                    <div className={`p-2.5 rounded-xl ${plan.isPopular ? 'bg-primary-container/10 text-primary' : 'bg-surface-container text-on-surface-variant'}`}>
                      {plan.name.includes('Starter') && <Cpu className="w-5 h-5" />}
                      {plan.name.includes('Business') && <Zap className="w-5 h-5" />}
                      {plan.name.includes('Enterprise') && <Server className="w-5 h-5" />}
                    </div>
                  </div>

                  {/* Pricing Display */}
                  <div className="flex items-baseline gap-1 pt-2 border-b border-outline-variant/10 pb-6">
                    <span className="text-sm font-bold text-on-surface-variant">R</span>
                    <span className="text-4xl md:text-5xl font-black tracking-tight text-on-surface">
                      {displayPrice.toLocaleString()}
                    </span>
                    <span className="text-sm text-on-surface-variant font-medium">
                      /{plan.period}
                    </span>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-4">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-3 text-sm text-on-surface font-medium">
                        <Check className="w-4 h-4 text-primary shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                    {plan.unsupportedFeatures?.map((feat) => (
                      <li key={feat} className="flex items-center gap-3 text-sm text-on-surface-variant/40 line-through">
                        <X className="w-4 h-4 text-outline-variant/40 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Action Button */}
                <div className="pt-8">
                  <a
                    href="#academy"
                    className={`block w-full text-center py-3.5 rounded-xl font-label-md text-xs uppercase tracking-widest font-black transition-all ${
                      plan.isPopular
                        ? 'primary-gradient text-white shadow-lg shadow-primary/25 hover:shadow-xl active:scale-95'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high active:scale-95'
                    }`}
                  >
                    {plan.buttonText}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
