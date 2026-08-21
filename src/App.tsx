import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Company from './components/Company';
import Capabilities from './components/Capabilities';
import Hosting from './components/Hosting';
import AppDevelopment from './components/AppDevelopment';
import Academy from './components/Academy';
import OnboardingForm from './components/OnboardingForm';
import Leadership from './components/Leadership';
import Footer from './components/Footer';
import CustomerPortal from './components/CustomerPortal';
import DashboardLayout from './components/DashboardLayout';
import Chatbot from './components/Chatbot';
import SMMEPackages from './components/SMMEPackages';
import WebDevPackages from './components/WebDevPackages';
import { useAuth } from './contexts/AuthContext';
import { Loader2, ShieldCheck, Sparkles } from 'lucide-react';

export default function App() {
  const { user, role, loading } = useAuth();
  
  // Lightweight router state
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigate = (to: string) => {
    window.history.pushState({}, '', to);
    setCurrentPath(to);
  };

  // Route Guarding & Redirects (Requirement 6)
  useEffect(() => {
    if (loading) return;

    if (user && role === 'customer') {
      // Customer-role users MUST be redirected to /portal and never see internal UI
      if (currentPath !== '/portal') {
        navigate('/portal');
      }
    } else {
      // Non-customer users (logged out, admin, sales_rep) can never see /portal
      if (currentPath === '/portal') {
        navigate('/');
      }
    }

    // Only admins can see /dashboard/users
    if (currentPath === '/dashboard/users' && (!user || role !== 'admin')) {
      navigate('/');
    }

    // Only internal roles (admin, sales_rep) can see /dashboard
    if (currentPath.startsWith('/dashboard') && (!user || (role !== 'admin' && role !== 'sales_rep'))) {
      navigate('/');
    }
  }, [user, role, currentPath, loading]);

  // Premium loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex flex-col items-center justify-center p-6 gap-4">
        {/* Decorative subtle ambient background */}
        <div className="fixed inset-0 bg-[linear-gradient(to_right,#85530005_1px,transparent_1px),linear-gradient(to_bottom,#85530005_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
        
        <div className="relative flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl border border-outline-variant/20 flex items-center justify-center bg-surface-container shadow-inner">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="font-headline-sm text-sm font-black uppercase tracking-widest text-on-surface">APPULENCE SECURE NODE</h3>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Verifying security token claims...</p>
          </div>
        </div>
      </div>
    );
  }

  // Guard view rendering based on security roles
  if (user && role === 'customer') {
    return <CustomerPortal />;
  }

  // Dashboard render for internal staff
  if (currentPath.startsWith('/dashboard')) {
    if (!user || (role !== 'admin' && role !== 'sales_rep')) {
      return null;
    }
    return <DashboardLayout currentPath={currentPath} navigate={navigate} />;
  }

  if (currentPath === '/smme-ngo-packages') {
    return <SMMEPackages />;
  }

  if (currentPath === '/web-development' || currentPath === '/wordpress-packages') {
    return <WebDevPackages />;
  }

  return (
    <div className="min-h-screen bg-background text-on-surface antialiased selection:bg-primary-container/30 selection:text-primary">
      {/* Dynamic ambient grid background globally */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#85530005_1px,transparent_1px),linear-gradient(to_bottom,#85530005_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none z-0" />
      
      {/* Content wrapper with z-index to stay above background grid */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-grow pt-[72px]"> {/* Pad top to prevent header overlapping */}
          
          {/* Render Active Route Panel */}
          {currentPath === '/' && (
            <>
              <Hero />
              <Company />
              <Capabilities />
              <Hosting />
              <AppDevelopment />
              <Academy />
              <OnboardingForm />
              <Leadership />
            </>
          )}
        </main>

        <Footer />
        <Chatbot />
      </div>
    </div>
  );
}
