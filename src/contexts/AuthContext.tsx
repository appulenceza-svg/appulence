import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  onIdTokenChanged, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export type UserRole = 'admin' | 'sales_rep' | 'customer';

export interface UserProfile {
  uid: string;
  email: string;
  name?: string;
  role: UserRole;
  customerId?: string | null;
}

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  customerId: string | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshClaims: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync / verify user claims and profile
  const syncClaimsAndProfile = async (currentUser: User) => {
    try {
      let idTokenResult = await currentUser.getIdTokenResult();
      let claimsRole = idTokenResult.claims.role as UserRole | undefined;
      let claimsCustomerId = idTokenResult.claims.customerId as string | undefined;

      // If no custom claim role exists, auto-provision default role
      if (!claimsRole) {
        const defaultRole = currentUser.email === 'appulenceza@gmail.com' ? 'admin' : 'customer';
        console.log(`No custom claim role found for user, initializing default '${defaultRole}'...`);
        const token = await currentUser.getIdToken();
        const response = await fetch('/api/set-user-claims', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            uid: currentUser.uid,
            role: defaultRole,
            name: currentUser.displayName || currentUser.email?.split('@')[0] || (defaultRole === 'admin' ? 'Admin' : 'Customer'),
            email: currentUser.email || ''
          })
        });

        if (response.ok) {
          // Force refresh token to get newly set claims
          idTokenResult = await currentUser.getIdTokenResult(true);
          claimsRole = idTokenResult.claims.role as UserRole | undefined;
          claimsCustomerId = idTokenResult.claims.customerId as string | undefined;
          console.log("Default claims initialized successfully:", idTokenResult.claims);
        } else {
          console.error("Failed to self-provision default claims");
        }
      }

      // Fetch Firestore profile document
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data() as UserProfile;
        setProfile(data);
        // Prioritize Firestore values, fallback to claims
        setRole(data.role || claimsRole || 'sales_rep');
        setCustomerId(data.customerId || claimsCustomerId || null);
      } else {
        // Fallback profile if Firestore is lagging
        const fallbackProfile: UserProfile = {
          uid: currentUser.uid,
          email: currentUser.email || '',
          name: currentUser.displayName || '',
          role: claimsRole || 'sales_rep',
          customerId: claimsCustomerId || null
        };
        setProfile(fallbackProfile);
        setRole(claimsRole || 'sales_rep');
        setCustomerId(claimsCustomerId || null);
      }
    } catch (err) {
      console.error("Error syncing user custom claims & profile:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        await syncClaimsAndProfile(currentUser);
      } else {
        setUser(null);
        setRole(null);
        setCustomerId(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const refreshClaims = async () => {
    if (auth.currentUser) {
      setLoading(true);
      await auth.currentUser.getIdToken(true); // Forces ID token refresh, triggers onIdTokenChanged
      await syncClaimsAndProfile(auth.currentUser);
      setLoading(false);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      role, 
      customerId, 
      profile, 
      loading, 
      signOut, 
      refreshClaims 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
