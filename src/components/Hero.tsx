import { useState, useEffect, useRef, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight } from 'lucide-react';

interface StatItem {
  target: number;
  suffix: string;
  label: string;
}

const stats: StatItem[] = [
  { target: 6, suffix: '+', label: 'Years of Tech Excellence' },
  { target: 12, suffix: '+', label: 'Million+ Managed Projects' },
  { target: 76, suffix: '', label: 'Enterprise Clients' },
  { target: 660, suffix: '', label: 'Academy Students' },
];

const bgImages = [
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1588072432836-e10032774350?q=80&w=2000&auto=format&fit=crop"
];

export default function Hero() {
  const [counts, setCounts] = useState<number[]>([0, 0, 0, 0]);
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [currentBg, setCurrentBg] = useState(0);

  useEffect(() => {
    const bgInterval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % bgImages.length);
    }, 5000);
    return () => clearInterval(bgInterval);
  }, []);

  useEffect(() => {
    // Stat count-up animation
    const duration = 2000; // 2 seconds
    const frameDuration = 1000 / 60; // 60fps
    const totalFrames = Math.round(duration / frameDuration);
    let frame = 0;

    const counter = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      
      // Easing function: easeOutQuad
      const easeProgress = progress * (2 - progress);

      setCounts(
        stats.map((stat) => Math.floor(easeProgress * stat.target))
      );

      if (frame >= totalFrames) {
        setCounts(stats.map((stat) => stat.target));
        clearInterval(counter);
      }
    }, frameDuration);

    return () => clearInterval(counter);
  }, []);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const dx = x - xc;
    const dy = y - yc;
    // Limit rotation to maximum 10 degrees
    setRotate({
      x: -dy / (rect.height / 15),
      y: dx / (rect.width / 15),
    });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  return (
    <section className="relative min-h-screen flex flex-col justify-center pt-28 pb-32 overflow-hidden bg-background">
      {/* Background Slider */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="popLayout">
          <motion.img
            key={currentBg}
            src={bgImages[currentBg]}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover"
            alt="School apps development"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-white/40 dark:bg-black/60" />
      </div>

      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-primary-container/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-[1280px] w-full mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
        {/* Left text column */}
        <div className="md:col-span-7 space-y-8 drop-shadow-md">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-container/10 border border-primary-container/20 text-primary font-label-md text-xs tracking-wider uppercase font-semibold"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
            <span>High-Performance Enterprise Solutions</span>
          </motion.div>

          <h1 className="font-headline-xl text-5xl md:text-[64px] leading-[1.05] font-black tracking-tight text-on-surface max-w-[640px]">
            Your Trusted Partner in Digital Solutions.
          </h1>

          <p className="font-body-lg text-lg text-on-surface-variant max-w-[540px] leading-relaxed">
            We don't just write code; we build digital foundations you can rely on. From the first prototype to the final deployment, we are dedicated to bringing your vision to life with precision, transparency, and reliable support.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <a
              href="#capabilities"
              className="primary-gradient text-on-primary px-8 py-4 rounded-xl font-label-md text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 group active:scale-95 transition-all"
            >
              Explore Our Services{' '}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-200" />
            </a>
            <a
              href="#company"
              className="border-2 border-outline/20 px-8 py-4 rounded-xl font-label-md text-sm uppercase tracking-widest text-on-surface hover:bg-surface-container transition-colors text-center active:scale-95"
            >
              View Portfolio
            </a>
          </div>
        </div>

        {/* Right leopard graphic column */}
        <div className="hidden md:block md:col-span-5 relative">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
          
          <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale(1.02)`,
              transition: 'transform 0.1s ease-out',
            }}
            className="relative glass-card p-4 rounded-2xl rotate-3 shadow-2xl cursor-pointer"
          >
            <video
              className="rounded-xl w-full aspect-square object-cover shadow-inner bg-black"
              src="https://eudorawater.xyz/wp-content/uploads/2026/07/Digital_cheetah_head_circuit_boards_202606222336.mp4"
              autoPlay
              loop
              muted
              playsInline
            />
          </motion.div>
        </div>
      </div>

      {/* Stats Strip at the bottom of the hero section */}
      <div className="absolute bottom-0 w-full py-6 bg-white/50 dark:bg-on-background/10 backdrop-blur-md border-t border-outline-variant/20">
        <div className="max-w-[1280px] mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((stat, i) => (
            <div key={i} className="space-y-1">
              <div className="text-3xl md:text-4xl font-black text-primary font-headline-lg flex items-center justify-center">
                <span>{counts[i]}</span>
                <span className="text-primary-container">{stat.suffix}</span>
              </div>
              <div className="font-label-md uppercase text-xs md:text-[13px] tracking-wider text-on-surface-variant font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
