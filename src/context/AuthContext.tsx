/**
 * Authentication and Role-Based Access Control Context
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  switchUserRole: (role: UserRole) => void;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
  canAccess: (permission: Permission) => boolean;
}

export type Permission =
  | 'pos_access'
  | 'manage_products'
  | 'adjust_stock'
  | 'manage_purchases'
  | 'view_profits'
  | 'manage_expenses'
  | 'manage_staff'
  | 'manage_settings'
  | 'process_refunds'
  | 'view_audit_logs';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: [
    'pos_access',
    'manage_products',
    'adjust_stock',
    'manage_purchases',
    'view_profits',
    'manage_expenses',
    'manage_staff',
    'manage_settings',
    'process_refunds',
    'view_audit_logs',
  ],
  manager: [
    'pos_access',
    'manage_products',
    'adjust_stock',
    'manage_purchases',
    'view_profits',
    'manage_expenses',
    'process_refunds',
    'view_audit_logs',
  ],
  inventory_staff: [
    'manage_products',
    'adjust_stock',
    'manage_purchases',
  ],
  cashier: [
    'pos_access',
  ],
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Bootstrapped administrator email from environment
const BOOTSTRAP_ADMIN_EMAIL = 'muhammadrashid172002@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    // Check if we have an active session in local storage for cashier/demo profile
    const saved = localStorage.getItem('fm_active_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    // Default initial owner profile for immediate testing
    return {
      id: 'usr-owner-01',
      email: BOOTSTRAP_ADMIN_EMAIL,
      displayName: 'Muhammad Rashid (Owner)',
      role: 'owner',
      status: 'active',
      createdAt: new Date().toISOString(),
    };
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userDocRef);
          const isBootstrapAdmin = user.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            const profile: UserProfile = {
              ...data,
              id: user.uid,
              email: user.email || data.email,
              displayName: user.displayName || data.displayName || 'Staff Member',
              role: isBootstrapAdmin ? 'owner' : data.role || 'cashier',
            };
            setCurrentUser(profile);
            localStorage.setItem('fm_active_user', JSON.stringify(profile));
          } else {
            // New user registration
            const newProfile: UserProfile = {
              id: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'Family Mart Staff',
              role: isBootstrapAdmin ? 'owner' : 'cashier',
              status: 'active',
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            setCurrentUser(newProfile);
            localStorage.setItem('fm_active_user', JSON.stringify(newProfile));
          }
        } catch (err) {
          console.warn('Could not sync user profile with Firestore, running local session profile:', err);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'users');
    }
  };

  const switchUserRole = (role: UserRole) => {
    const roleLabels: Record<UserRole, string> = {
      owner: 'Muhammad Rashid (Owner)',
      manager: 'Hamza Khan (Store Manager)',
      cashier: 'Bilal Ahmed (Cashier Terminal 01)',
      inventory_staff: 'Usman Ali (Stock Supervisor)',
    };

    const updatedUser: UserProfile = {
      id: currentUser?.id || `usr-${role}-local`,
      email: role === 'owner' ? BOOTSTRAP_ADMIN_EMAIL : `${role}@familymart.pk`,
      displayName: roleLabels[role],
      role,
      status: 'active',
      createdAt: currentUser?.createdAt || new Date().toISOString(),
    };

    setCurrentUser(updatedUser);
    localStorage.setItem('fm_active_user', JSON.stringify(updatedUser));
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out:', e);
    }
    // Set to cashier or prompt login
    const cashierUser: UserProfile = {
      id: 'usr-cashier-01',
      email: 'cashier1@familymart.pk',
      displayName: 'Bilal Ahmed (Cashier)',
      role: 'cashier',
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(cashierUser);
    localStorage.setItem('fm_active_user', JSON.stringify(cashierUser));
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!currentUser) return false;
    return roles.includes(currentUser.role);
  };

  const canAccess = (permission: Permission): boolean => {
    if (!currentUser) return false;
    const permitted = ROLE_PERMISSIONS[currentUser.role] || [];
    return permitted.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        isLoading,
        signInWithGoogle,
        switchUserRole,
        logout,
        hasRole,
        canAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
