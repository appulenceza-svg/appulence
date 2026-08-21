import React, { useState, useEffect } from 'react';
import { ChevronDown, Bolt, Menu, X, LogOut, User as UserIcon, ShieldAlert, Package, Briefcase, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  
  const { user, role, signOut } = useAuth();

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    e.preventDefault();
    if (window.location.pathname !== '/') {
      navigateTo('/');
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-2 left-1/2 -translate-x-1/2 w-[96%] max-w-[1280px] z-50 transition-all duration-500 rounded-full border shadow-xl ${
        isScrolled
          ? 'py-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-outline-variant/30 text-slate-800 dark:text-slate-100'
          : 'py-3 bg-black/60 dark:bg-black/60 backdrop-blur-lg border-white/20 text-white'
      }`}
    >
      <div className="flex justify-between items-center px-4 md:px-8 w-full">
        <div className="flex items-center gap-3">
          <img 
            src="https://eudorawater.xyz/wp-content/uploads/2026/07/Unique_logo_for_Appulence_Tech_202606220852-1-scaled.jpeg" 
            alt="Appulence Logo" 
            className="w-10 h-10 rounded-lg object-cover shadow-lg border border-outline-variant/10"
            referrerPolicy="no-referrer"
          />
          <span className="font-headline-md text-2xl font-black tracking-tighter text-inherit">
            APPULENCE
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <div className="relative group">
            <button className="font-label-md text-sm uppercase tracking-wider opacity-80 hover:opacity-100 hover:text-primary transition-all duration-200 flex items-center gap-1 cursor-pointer">
              Services
              <ChevronDown className="w-4 h-4" />
            </button>
            <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-outline-variant/10 shadow-xl rounded-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 text-slate-800 dark:text-slate-100 flex flex-col">
              <a
                href="#capabilities"
                onClick={(e) => handleNavClick(e, 'capabilities')}
                className="px-4 py-2 text-sm opacity-80 hover:opacity-100 hover:text-primary hover:bg-surface-container/50 transition-all font-medium"
              >
                Capabilities
              </a>
              <a
                href="#hosting"
                onClick={(e) => handleNavClick(e, 'hosting')}
                className="px-4 py-2 text-sm opacity-80 hover:opacity-100 hover:text-primary hover:bg-surface-container/50 transition-all font-medium"
              >
                Hosting
              </a>
              <a
                href="#app-development"
                onClick={(e) => handleNavClick(e, 'app-development')}
                className="px-4 py-2 text-sm opacity-80 hover:opacity-100 hover:text-primary hover:bg-surface-container/50 transition-all font-medium"
              >
                App Suite
              </a>
              <button
                onClick={() => navigateTo('/web-development')}
                className="w-full text-left px-4 py-2 text-sm opacity-80 hover:opacity-100 hover:text-primary hover:bg-surface-container/50 transition-all font-medium cursor-pointer"
              >
                Web &amp; WordPress
              </button>
            </div>
          </div>
          <button
            onClick={() => navigateTo('/smme-ngo-packages')}
            className="font-label-md text-sm uppercase tracking-wider opacity-80 hover:opacity-100 hover:text-primary transition-all duration-200 cursor-pointer"
          >
            SMME/NGO
          </button>
          <a
            href="#academy"
            onClick={(e) => handleNavClick(e, 'academy')}
            className="font-label-md text-sm uppercase tracking-wider opacity-80 hover:opacity-100 hover:text-primary transition-all duration-200"
          >
            Academy
          </a>
          <a
            href="#onboarding"
            onClick={(e) => handleNavClick(e, 'onboarding')}
            className="font-label-md text-sm uppercase tracking-wider opacity-80 hover:opacity-100 hover:text-primary transition-all duration-200"
          >
            Onboarding
          </a>
          <a
            href="#company"
            onClick={(e) => handleNavClick(e, 'company')}
            className="font-label-md text-sm uppercase tracking-wider opacity-80 hover:opacity-100 hover:text-primary transition-all duration-200"
          >
            Company
          </a>
        </nav>

        <div className="hidden md:flex gap-4 items-center">
          {user && (role === 'admin' || role === 'sales_rep') && (
            <button
              onClick={() => navigateTo('/dashboard/crm')}
              className="px-4 py-2 border border-primary/20 text-primary hover:bg-primary/5 text-xs font-black uppercase tracking-wider rounded-full transition-all cursor-pointer flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
            </button>
          )}
          {user ? (
            <div className="flex items-center gap-3 bg-surface-container/60 border border-outline-variant/15 pl-3 pr-2 py-1.5 rounded-full shadow-sm">
              <span className="text-xs font-bold text-inherit flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                {user.displayName || user.email?.split('@')[0]}
              </span>
              <button 
                onClick={signOut}
                className="p-1.5 opacity-80 hover:opacity-100 hover:text-red-600 hover:bg-red-50 rounded-full transition-all cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <button 
                onClick={() => {
                  setAuthTab('login');
                  setIsAuthModalOpen(true);
                }}
                className="font-label-md text-sm uppercase tracking-wider opacity-80 hover:opacity-100 hover:text-primary transition-all cursor-pointer"
              >
                Login
              </button>
              <button
                onClick={() => {
                  setAuthTab('signup');
                  setIsAuthModalOpen(true);
                }}
                className="primary-gradient text-white px-6 py-2.5 rounded-full font-label-md text-sm uppercase tracking-widest shadow-md active:scale-95 hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
              >
                Register
              </button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden text-inherit p-2 focus:outline-none"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full mt-3 left-0 w-full bg-white dark:bg-slate-900 border border-outline-variant/10 shadow-xl p-6 space-y-4 flex flex-col items-center rounded-2xl text-slate-800 dark:text-slate-100">
          <div className="w-full text-center pb-2 border-b border-outline-variant/10">
            <span className="font-label-md text-sm uppercase tracking-widest text-primary font-black mb-2 block">Services</span>
            <div className="flex flex-col gap-3">
              <a
                href="#capabilities"
                onClick={(e) => { setIsMobileMenuOpen(false); handleNavClick(e, 'capabilities'); }}
                className="font-label-md text-sm uppercase tracking-wider opacity-80 hover:opacity-100 hover:text-primary transition-all"
              >
                Capabilities
              </a>
              <a
                href="#hosting"
                onClick={(e) => { setIsMobileMenuOpen(false); handleNavClick(e, 'hosting'); }}
                className="font-label-md text-sm uppercase tracking-wider opacity-80 hover:opacity-100 hover:text-primary transition-all"
              >
                Hosting
              </a>
              <a
                href="#app-development"
                onClick={(e) => { setIsMobileMenuOpen(false); handleNavClick(e, 'app-development'); }}
                className="font-label-md text-sm uppercase tracking-wider opacity-80 hover:opacity-100 hover:text-primary transition-all"
              >
                App Suite
              </a>
              <button
                onClick={() => {
                  navigateTo('/web-development');
                  setIsMobileMenuOpen(false);
                }}
                className="font-label-md text-sm uppercase tracking-wider opacity-80 hover:opacity-100 hover:text-primary transition-all cursor-pointer"
              >
                Web &amp; WordPress
              </button>
            </div>
          </div>
          <button
            onClick={() => {
              navigateTo('/smme-ngo-packages');
              setIsMobileMenuOpen(false);
            }}
            className="font-label-md text-sm uppercase tracking-wider opacity-80 hover:opacity-100 hover:text-primary transition-all cursor-pointer"
          >
            SMME/NGO
          </button>
          <a
            href="#academy"
            onClick={(e) => { setIsMobileMenuOpen(false); handleNavClick(e, 'academy'); }}
            className="font-label-md text-sm uppercase tracking-wider opacity-80 hover:opacity-100 hover:text-primary transition-all"
          >
            Academy
          </a>
          <a
            href="#onboarding"
            onClick={(e) => { setIsMobileMenuOpen(false); handleNavClick(e, 'onboarding'); }}
            className="font-label-md text-sm uppercase tracking-wider opacity-80 hover:opacity-100 hover:text-primary transition-all"
          >
            Onboarding
          </a>
          <a
            href="#company"
            onClick={(e) => { setIsMobileMenuOpen(false); handleNavClick(e, 'company'); }}
            className="font-label-md text-sm uppercase tracking-wider opacity-80 hover:opacity-100 hover:text-primary transition-all"
          >
            Company
          </a>
          <hr className="w-full border-outline-variant/20" />
          {user ? (
            <div className="w-full flex flex-col items-center gap-3">
              {(role === 'admin' || role === 'sales_rep') && (
                <button
                  onClick={() => {
                    navigateTo('/dashboard/crm');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-center border border-primary/20 text-primary py-2.5 rounded-full font-label-md text-sm uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </button>
              )}
              <span className="text-sm font-bold text-inherit flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                {user.displayName || user.email}
              </span>
              <button 
                onClick={() => {
                  signOut();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-700 font-label-md text-sm uppercase tracking-wider py-2.5 rounded-full border border-red-200/50 cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          ) : (
            <div className="w-full flex flex-col gap-2.5">
              <button 
                onClick={() => {
                  setAuthTab('login');
                  setIsAuthModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-center font-label-md text-sm uppercase tracking-wider opacity-80 hover:opacity-100 hover:text-primary transition-all py-2.5 bg-surface-container rounded-full cursor-pointer"
              >
                Login
              </button>
              <button
                onClick={() => {
                  setAuthTab('signup');
                  setIsAuthModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-center primary-gradient text-white py-3 rounded-full font-label-md text-sm uppercase tracking-widest shadow-md cursor-pointer"
              >
                Register
              </button>
            </div>
          )}
        </div>
      )}

      {/* Auth Modal Portal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialTab={authTab}
      />
    </header>
  );
}
