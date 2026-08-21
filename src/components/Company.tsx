import { CheckCircle2, Shield, Flame, GraduationCap } from 'lucide-react';

export default function Company() {
  return (
    <section id="company" className="py-24 bg-surface-container-low relative">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 blur-[100px] pointer-events-none" />

      <div className="max-w-[1280px] mx-auto px-6 md:px-12 space-y-16">
        {/* Header */}
        <div className="max-w-3xl space-y-4">
          <span className="font-label-md text-xs uppercase tracking-widest text-primary font-bold">
            Company Ethos
          </span>
          <h2 className="font-headline-lg text-3xl md:text-5xl font-black tracking-tight text-on-surface">
            Engineering the Digital Infrastructures of Tomorrow
          </h2>
          <p className="font-body-md text-lg text-on-surface-variant max-w-2xl leading-relaxed">
            We believe in strategic alignment, technical purity, and uncompromising commitment to delivery. We do not just build systems; we construct foundational technology pillars.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pillar 1 */}
          <div className="bg-white p-8 rounded-2xl border border-outline-variant/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-headline-sm text-xl font-bold text-on-surface">
                Delivery Excellence
              </h3>
              <p className="font-body-sm text-sm text-on-surface-variant leading-relaxed">
                A culture focused on predictable sprints, elite architectural design, and zero compromise on system performance.
              </p>
            </div>
            <div className="inline-flex self-start px-3 py-1 rounded-full bg-primary/10 text-primary font-label-md text-xs font-semibold">
              Guaranteed SLA
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white p-8 rounded-2xl border border-outline-variant/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="font-headline-sm text-xl font-bold text-on-surface">
                Agile Powerhouse
              </h3>
              <p className="font-body-sm text-sm text-on-surface-variant leading-relaxed">
                Leveraging Scrum, Lean software development, and modern CI/CD automation pipelines for continuous impact.
              </p>
            </div>
            <div className="inline-flex self-start px-3 py-1 rounded-full bg-primary/10 text-primary font-label-md text-xs font-semibold">
              Rapid Delivery
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white p-8 rounded-2xl border border-outline-variant/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="font-headline-sm text-xl font-bold text-on-surface">
                Community Impact
              </h3>
              <p className="font-body-sm text-sm text-on-surface-variant leading-relaxed">
                Building a pipeline of next-generation African engineering talent through our dedicated Academy programs.
              </p>
            </div>
            <div className="inline-flex self-start px-3 py-1 rounded-full bg-primary/10 text-primary font-label-md text-xs font-semibold">
              Empowering People
            </div>
          </div>
        </div>

        {/* Vision Statement */}
        <div className="bg-on-surface text-white p-8 md:p-12 rounded-3xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-4">
            <span className="font-label-md text-xs uppercase tracking-widest text-primary-container font-bold">
              Our Vision
            </span>
            <h3 className="font-headline-md text-2xl md:text-3xl font-extrabold tracking-tight">
              Redefining limits through precise execution and deep strategic alignment.
            </h3>
            <p className="font-body-md text-sm md:text-base text-white/70 leading-relaxed">
              Empowering enterprise growth with premium technology assets, robust platforms, and the specialized skill sets demanded by modern architectural paradigms.
            </p>
          </div>

          <div className="md:col-span-5 bg-white/5 p-6 md:p-8 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary-container shrink-0" />
              <span className="font-label-md text-sm font-semibold tracking-wide">
                Dedicated Project Success Management
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary-container shrink-0" />
              <span className="font-label-md text-sm font-semibold tracking-wide">
                Production-Grade Cloud Paradigms
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary-container shrink-0" />
              <span className="font-label-md text-sm font-semibold tracking-wide">
                Top-Tier Technical Competency
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
