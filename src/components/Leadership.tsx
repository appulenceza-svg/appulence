import { Quote } from 'lucide-react';
// @ts-ignore
import mdImage from '../assets/images/regenerated_image_1783219852661.jpg';

export default function Leadership() {
  return (
    <section className="py-24 bg-surface-container-low relative overflow-hidden">
      {/* Background radial soft light */}
      <div className="absolute top-1/2 left-0 w-[450px] h-[450px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-[1280px] mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        
        {/* Left column: Quote & Info */}
        <div className="lg:col-span-7 space-y-8 relative">
          <div className="absolute -top-12 -left-8 text-primary/10 select-none">
            <Quote className="w-24 h-24 rotate-180" />
          </div>

          <div className="space-y-4 relative z-10">
            <span className="font-label-md text-xs uppercase tracking-widest text-primary font-bold">
              Executive Leadership
            </span>
            <h2 className="font-headline-lg text-3xl md:text-5xl font-black tracking-tight text-on-surface">
              Uncompromising Technical Governance
            </h2>
            <div className="w-16 h-1 bg-primary rounded-full" />
          </div>

          <blockquote className="relative z-10">
            <p className="font-headline-md text-xl md:text-2xl font-semibold italic text-on-surface-variant leading-relaxed">
              &ldquo;True engineering quality isn't just about syntax; it's about setting up governance systems, aligning strategic mandates, and building sustainable architectures that stand the test of time.&rdquo;
            </p>
          </blockquote>

          <div className="space-y-1">
            <h4 className="font-headline-xs text-lg font-black text-on-surface">
              Mohlalifi Samuel Mokolutlo
            </h4>
            <p className="font-label-md text-xs uppercase tracking-widest text-primary font-bold">
              Managing Director
            </p>
          </div>
        </div>

        {/* Right column: Styled Portrait */}
        <div className="lg:col-span-5 relative flex justify-center">
          {/* Decorative frame box */}
          <div className="absolute -inset-4 bg-primary-container/10 border border-primary-container/20 rounded-2xl rotate-3 pointer-events-none" />
          
          <div className="relative glass-card p-3 rounded-2xl -rotate-2 shadow-2xl max-w-sm w-full overflow-hidden">
            <img
              className="rounded-xl w-full aspect-[4/5] object-cover filter grayscale contrast-105 hover:grayscale-0 transition-all duration-500"
              src={mdImage}
              alt="Mohlalifi Samuel Mokolutlo, Managing Director of Appulence Tech"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

      </div>
    </section>
  );
}
