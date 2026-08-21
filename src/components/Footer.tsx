import { useState, FormEvent } from 'react';
import { Bolt, MapPin, Mail, Phone, Send } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 3000);
  };

  return (
    <footer className="bg-on-surface text-white pt-20 pb-12 border-t border-white/10 relative">
      <div className="max-w-[1280px] mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-white/10">
        
        {/* Brand Column */}
        <div className="md:col-span-4 space-y-6">
          <div className="flex items-center gap-3">
            <img 
              src="https://eudorawater.xyz/wp-content/uploads/2026/07/Unique_logo_for_Appulence_Tech_202606220852-1-scaled.jpeg" 
              alt="Appulence Logo" 
              className="w-10 h-10 rounded-lg object-cover shadow-lg border border-white/10"
              referrerPolicy="no-referrer"
            />
            <span className="font-headline-md text-2xl font-black tracking-tighter text-white">
              APPULENCE
            </span>
          </div>
          <p className="font-body-sm text-sm text-white/60 max-w-sm leading-relaxed">
            Precision in Strategy, Speed in Technology. Redefining the intersection of high-performance technical engineering and elite business consulting.
          </p>
        </div>

        {/* Navigation Links Column */}
        <div className="md:col-span-2 space-y-4">
          <h4 className="font-label-md text-xs uppercase tracking-widest text-primary-container font-black">
            Navigation
          </h4>
          <ul className="space-y-2">
            <li>
              <a href="/web-development" className="font-body-sm text-sm text-white/70 hover:text-white hover:translate-x-1 inline-block transition-all">
                WordPress &amp; Web Packages
              </a>
            </li>
            <li>
              <a href="#capabilities" className="font-body-sm text-sm text-white/70 hover:text-white hover:translate-x-1 inline-block transition-all">
                Capabilities
              </a>
            </li>
            <li>
              <a href="#hosting" className="font-body-sm text-sm text-white/70 hover:text-white hover:translate-x-1 inline-block transition-all">
                Hosting
              </a>
            </li>
            <li>
              <a href="#academy" className="font-body-sm text-sm text-white/70 hover:text-white hover:translate-x-1 inline-block transition-all">
                Academy
              </a>
            </li>
            <li>
              <a href="#company" className="font-body-sm text-sm text-white/70 hover:text-white hover:translate-x-1 inline-block transition-all">
                Company Ethos
              </a>
            </li>
          </ul>
        </div>

        {/* Contact Details Column */}
        <div className="md:col-span-3 space-y-4">
          <h4 className="font-label-md text-xs uppercase tracking-widest text-primary-container font-black">
            Contact
          </h4>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-sm text-white/70">
              <MapPin className="w-4 h-4 text-primary-container shrink-0 mt-0.5" />
              <span>35 10th St, Voorspoed, Welkom, 9459</span>
            </li>
            <li className="flex items-center gap-3 text-sm text-white/70">
              <Mail className="w-4 h-4 text-primary-container shrink-0" />
              <a href="mailto:info@appulence.co.za" className="hover:text-white transition-colors">
                info@appulence.co.za
              </a>
            </li>
            <li className="flex items-center gap-3 text-sm text-white/70">
              <Phone className="w-4 h-4 text-primary-container shrink-0" />
              <a href="tel:0823228215" className="hover:text-white transition-colors">
                0823228215
              </a>
            </li>
          </ul>
        </div>

        {/* Newsletter Subscription Column */}
        <div className="md:col-span-3 space-y-4">
          <h4 className="font-label-md text-xs uppercase tracking-widest text-primary-container font-black">
            Newsletter
          </h4>
          <p className="font-body-sm text-xs text-white/60 leading-relaxed">
            Subscribe to our bi-weekly architecture briefs, enterprise insights, and program updates.
          </p>
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl font-body-sm text-xs text-white placeholder-white/30 focus:outline-none focus:border-primary-container transition-colors"
            />
            <button
              type="submit"
              className="p-2.5 bg-primary hover:bg-primary-container rounded-xl text-white transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          {subscribed && (
            <p className="font-body-sm text-[10px] text-primary-container animate-pulse">
              ✓ Successfully subscribed! Check your inbox soon.
            </p>
          )}
        </div>

      </div>

      <div className="max-w-[1280px] mx-auto px-6 md:px-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
        <p className="font-body-sm text-xs text-white/40">
          &copy; {new Date().getFullYear()} Appulence Tech. All rights reserved.
        </p>
        <p className="font-label-md text-[10px] uppercase tracking-wider text-white/30 font-semibold">
          Powered By The Appulence Group
        </p>
      </div>
    </footer>
  );
}
