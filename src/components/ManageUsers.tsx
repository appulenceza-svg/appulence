import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  UserCheck, 
  Search, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  Building,
  ArrowLeft,
  Mail,
  User as UserIcon
} from 'lucide-react';
import { useAuth, UserRole } from '../contexts/AuthContext';

interface UserDoc {
  uid: string;
  email: string;
  name?: string;
  role: UserRole;
  customerId?: string | null;
}

interface ManageUsersProps {
  onBack: () => void;
}

export default function ManageUsers({ onBack }: ManageUsersProps) {
  const { user, refreshClaims } = useAuth();
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pending changes state per user
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user) return;
      const idToken = await user.getIdToken();
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load user records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user]);

  const handleUpdateRoleAndCustomer = async (uid: string, currentRole: UserRole, targetRole: UserRole, customerId: string | null, name?: string, email?: string) => {
    setUpdatingUid(uid);
    setUpdateSuccess(null);
    setError(null);

    try {
      if (!user) return;
      const idToken = await user.getIdToken();
      
      const response = await fetch('/api/set-user-claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          uid,
          role: targetRole,
          customerId: targetRole === 'customer' ? (customerId || '') : null,
          name: name || '',
          email: email || ''
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update user security profile.');
      }

      setUpdateSuccess(uid);
      
      // Refresh the users list locally to reflect the changes
      await fetchUsers();
      
      // If the admin updated their own role, refresh claims
      if (uid === user.uid) {
        await refreshClaims();
      }

      setTimeout(() => {
        setUpdateSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Operation failed');
    } finally {
      setUpdatingUid(null);
    }
  };

  const handleLocalFieldChange = (uid: string, field: 'role' | 'customerId', value: string) => {
    setUsers(prevUsers => 
      prevUsers.map(u => {
        if (u.uid === uid) {
          return {
            ...u,
            [field]: value
          };
        }
        return u;
      })
    );
  };

  const filteredUsers = users.filter(u => {
    const query = searchQuery.toLowerCase();
    const matchesName = u.name?.toLowerCase().includes(query);
    const matchesEmail = u.email?.toLowerCase().includes(query);
    return matchesName || matchesEmail;
  });

  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-12 py-12 space-y-8 animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/15 pb-6">
        <div className="space-y-1">
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider hover:opacity-80 transition-all mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Landing
          </button>
          <h2 className="font-headline-md text-3xl font-black text-on-surface uppercase tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" /> Manage User Access
          </h2>
          <p className="text-sm text-on-surface-variant">
            Grant role privileges, assign custom claims, and map customer accounts in our secure CRM portal directory.
          </p>
        </div>

        {/* Quick stat counter */}
        <div className="flex items-center gap-4 bg-surface-container/60 border border-outline-variant/15 px-4 py-2.5 rounded-2xl">
          <div className="text-center px-2">
            <div className="text-xs font-black text-primary">{users.filter(u => u.role === 'admin').length}</div>
            <div className="text-[9px] uppercase font-black text-on-surface-variant/80 tracking-widest">Admins</div>
          </div>
          <div className="w-[1px] h-6 bg-outline-variant/20" />
          <div className="text-center px-2">
            <div className="text-xs font-black text-primary">{users.filter(u => u.role === 'sales_rep').length}</div>
            <div className="text-[9px] uppercase font-black text-on-surface-variant/80 tracking-widest">Sales</div>
          </div>
          <div className="w-[1px] h-6 bg-outline-variant/20" />
          <div className="text-center px-2">
            <div className="text-xs font-black text-primary">{users.filter(u => u.role === 'customer').length}</div>
            <div className="text-[9px] uppercase font-black text-on-surface-variant/80 tracking-widest">Clients</div>
          </div>
        </div>
      </div>

      {/* Alert banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200/50 rounded-2xl flex items-start gap-3 text-xs text-red-800">
          <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-red-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold uppercase tracking-wider text-[10px] text-red-900">Security Access Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Directory controls */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-surface-container/30 border border-outline-variant/10 p-4 rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search credentials by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-outline-variant/20 rounded-xl text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary outline-none transition-all"
          />
        </div>
        <button 
          onClick={fetchUsers}
          className="px-4 py-2.5 bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface rounded-xl border border-outline-variant/15 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Loader2 className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Sync Live Directory
        </button>
      </div>

      {/* Users table */}
      <div className="bg-white border border-outline-variant/15 rounded-3xl shadow-sm overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-on-surface-variant font-medium">Downloading live credential claims...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <UserIcon className="w-10 h-10 mx-auto text-on-surface-variant/40" />
            <p className="text-sm font-black uppercase tracking-wider text-on-surface">No profile logs match</p>
            <p className="text-xs text-on-surface-variant">Adjust your keyword filter search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container/30 border-b border-outline-variant/15 text-[10px] uppercase font-black tracking-wider text-on-surface-variant/80">
                  <th className="px-6 py-4">User Identity</th>
                  <th className="px-6 py-4">Current Role</th>
                  <th className="px-6 py-4">Customer Context (Claims)</th>
                  <th className="px-6 py-4 text-right">Actions & Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 text-xs">
                {filteredUsers.map((u) => {
                  const isUserUpdating = updatingUid === u.uid;
                  const isUserSuccess = updateSuccess === u.uid;

                  return (
                    <tr key={u.uid} className="hover:bg-surface-container-lowest transition-colors">
                      {/* Column 1: Identity */}
                      <td className="px-6 py-5 space-y-1">
                        <div className="font-bold text-on-surface flex items-center gap-2">
                          {u.name || 'No Display Name'} 
                          {u.uid === user?.uid && (
                            <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[8px] uppercase tracking-widest font-black rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-on-surface-variant flex items-center gap-1.5">
                          <Mail className="w-3 h-3 text-on-surface-variant/50" />
                          {u.email}
                        </div>
                        <div className="text-[9px] font-mono text-on-surface-variant/60">UID: {u.uid}</div>
                      </td>

                      {/* Column 2: Role Selection */}
                      <td className="px-6 py-5">
                        <div className="relative w-40">
                          <select
                            value={u.role || 'sales_rep'}
                            onChange={(e) => handleLocalFieldChange(u.uid, 'role', e.target.value as UserRole)}
                            className="w-full pl-3 pr-8 py-2 bg-surface-container-low border border-outline-variant/20 rounded-xl text-xs text-on-surface focus:border-primary outline-none transition-all cursor-pointer appearance-none font-semibold"
                          >
                            <option value="sales_rep">Sales Representative</option>
                            <option value="admin">Administrator</option>
                            <option value="customer">Customer / Client</option>
                          </select>
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/60 font-bold text-[8px]">
                            ▼
                          </span>
                        </div>
                      </td>

                      {/* Column 3: Customer ID mapping */}
                      <td className="px-6 py-5">
                        {u.role === 'customer' ? (
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-primary/70 shrink-0" />
                            <input
                              type="text"
                              placeholder="e.g. comp_acme_123"
                              value={u.customerId || ''}
                              onChange={(e) => handleLocalFieldChange(u.uid, 'customerId', e.target.value)}
                              className="w-full px-3 py-1.5 bg-surface-container-low border border-outline-variant/25 rounded-xl text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary outline-none transition-all font-mono"
                            />
                          </div>
                        ) : (
                          <span className="text-on-surface-variant/40 italic font-medium">Not applicable for role</span>
                        )}
                      </td>

                      {/* Column 4: Commit buttons */}
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isUserSuccess && (
                            <span className="text-emerald-600 flex items-center gap-1 animate-pulse font-bold text-[10px] uppercase tracking-wider mr-2">
                              <CheckCircle className="w-4 h-4 text-emerald-500" /> Claims Saved!
                            </span>
                          )}

                          <button
                            onClick={() => handleUpdateRoleAndCustomer(
                              u.uid, 
                              u.role, 
                              u.role, 
                              u.customerId || null,
                              u.name,
                              u.email
                            )}
                            disabled={isUserUpdating}
                            className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all ${
                              isUserUpdating 
                                ? 'bg-surface-container text-on-surface-variant' 
                                : 'primary-gradient text-white hover:shadow-md active:scale-97 cursor-pointer'
                            }`}
                          >
                            {isUserUpdating ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <Shield className="w-3.5 h-3.5" /> Apply
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Setup Guide details */}
      <div className="p-6 bg-surface-container/20 border border-outline-variant/15 rounded-3xl space-y-3">
        <h4 className="font-headline-sm text-sm font-black text-on-surface uppercase tracking-wider flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-primary" /> Role & Claim Enforcement Specifications
        </h4>
        <ul className="text-xs text-on-surface-variant space-y-2 list-disc list-inside leading-relaxed">
          <li>Custom Claims mapped to user tokens will update Firestore security constraints globally.</li>
          <li>Default role registration assigns <strong className="text-on-surface font-semibold">sales_rep</strong> immediately, shielding admin access panels.</li>
          <li>Client portal sessions partition documents strictly by <strong className="text-on-surface font-semibold">customerId</strong> claims mapping.</li>
          <li>For claim updates to register dynamically on target accounts, users must refresh their credentials, or re-authenticate.</li>
        </ul>
      </div>
    </div>
  );
}
