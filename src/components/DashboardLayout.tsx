import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BarChart, 
  FileText, 
  Target, 
  Package, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import CrmDashboard from './CrmDashboard';
import PipelineDashboard from './PipelineDashboard';
import CatalogDashboard from './CatalogDashboard';
import QuotationDashboard from './QuotationDashboard';
import TargetsDashboard from './TargetsDashboard';
import ManageUsers from './ManageUsers';
import AILogsDashboard from './AILogsDashboard';
import SupportChatsDashboard from './SupportChatsDashboard';
import { PhoneCall, MessageSquare } from 'lucide-react';

interface DashboardLayoutProps {
  currentPath: string;
  navigate: (to: string) => void;
}

export default function DashboardLayout({ currentPath, navigate }: DashboardLayoutProps) {
  const { user, role, signOut } = useAuth();
  const isAdmin = role === 'admin';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = [
    { id: '/dashboard/crm', label: 'CRM', icon: Users, show: true },
    { id: '/dashboard/pipeline', label: 'Pipeline', icon: BarChart, show: true },
    { id: '/dashboard/quotes', label: 'Quotes', icon: FileText, show: true },
    { id: '/dashboard/targets', label: 'Targets', icon: Target, show: true },
    { id: '/dashboard/catalog', label: 'Catalog', icon: Package, show: true },
    { id: '/dashboard/support-chats', label: 'Support Chats', icon: MessageSquare, show: isAdmin },
    { id: '/dashboard/ai-leads', label: 'AI Leads', icon: PhoneCall, show: true },
    { id: '/dashboard/users', label: 'Manage Users', icon: Settings, show: isAdmin },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-30 transform transition-transform duration-300 ease-in-out flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2 text-primary font-black tracking-widest uppercase text-sm">
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            <span className="truncate">{isAdmin ? 'Admin Portal' : 'Sales Manager Portal'}</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="px-3 mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Main Menu</div>
          {navItems.filter(item => item.show).map((item) => (
            <button
              key={item.id}
              onClick={() => {
                navigate(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                currentPath === item.id || (currentPath === '/dashboard' && item.id === '/dashboard/crm')
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100 space-y-2 shrink-0">
          <div className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Logged In As</div>
            <div className="text-xs font-black text-slate-700 truncate">{user?.email}</div>
            <div className="text-[10px] font-bold text-primary mt-0.5 capitalize">{role}</div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-slate-50">
        
        {/* Mobile Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:hidden shrink-0">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="font-black text-sm text-slate-800 uppercase tracking-wider truncate">
            {isAdmin ? 'Admin Portal' : 'Sales Manager Portal'}
          </div>
          <div className="w-9" /> {/* spacer for centering */}
        </header>

        {/* Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="min-h-full">
            {currentPath === '/dashboard/crm' || currentPath === '/dashboard' ? (
              <CrmDashboard onBack={() => navigate('/')} />
            ) : currentPath === '/dashboard/pipeline' ? (
              <PipelineDashboard onBack={() => navigate('/')} />
            ) : currentPath === '/dashboard/quotes' ? (
              <QuotationDashboard onBack={() => navigate('/')} />
            ) : currentPath === '/dashboard/targets' ? (
              <TargetsDashboard onBack={() => navigate('/')} />
            ) : currentPath === '/dashboard/catalog' ? (
              <CatalogDashboard onBack={() => navigate('/')} />
            ) : currentPath === '/dashboard/support-chats' ? (
              <SupportChatsDashboard />
            ) : currentPath === '/dashboard/ai-leads' ? (
              <AILogsDashboard onBack={() => navigate('/')} />
            ) : currentPath === '/dashboard/users' && isAdmin ? (
              <ManageUsers onBack={() => navigate('/')} />
            ) : (
              <div className="p-8 text-center text-slate-500">Page not found</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
