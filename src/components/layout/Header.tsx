/**
 * Top Navigation Header adhering to domain design rules
 */
import React from 'react';
import {
  ShoppingBag,
  User,
  ShieldCheck,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Store,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { UserRole } from '../../types';

interface HeaderProps {
  currentTab: string;
  onNavigate: (tabId: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  darkMode,
  onToggleDarkMode,
  soundEnabled,
  onToggleSound,
}) => {
  const { currentUser, switchUserRole, logout, signInWithGoogle, firebaseUser } = useAuth();
  const { settings, heldSales, cart } = useStore();
  const [roleMenuOpen, setRoleMenuOpen] = React.useState(false);

  const roles: { role: UserRole; label: string; desc: string }[] = [
    { role: 'owner', label: 'Owner / Super Admin', desc: 'Full store access & config' },
    { role: 'manager', label: 'Store Manager', desc: 'Products, inventory & reports' },
    { role: 'cashier', label: 'Cashier', desc: 'POS checkout & receipt print' },
    { role: 'inventory_staff', label: 'Inventory Staff', desc: 'Stock intake & adjustments' },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-neutral-200 bg-white px-4 sm:px-6 dark:border-neutral-800 dark:bg-neutral-900 transition-colors">
      {/* Zone 1: Single text element wordmark with emerald accent */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate('pos')}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-sm transition-transform group-hover:scale-105">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-neutral-900 dark:text-white whitespace-nowrap">
                {settings.storeName}
              </span>
              <span className="hidden sm:inline-block text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                POS
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-neutral-600 dark:text-neutral-400">
              <span>Terminal 01</span>
              <span aria-hidden="true">·</span>
              <span>{settings.currency}</span>
              <span aria-hidden="true">·</span>
              <span>Karachi (PKT)</span>
            </div>
          </div>
        </button>
      </div>

      {/* Zone 2: Fast Action Indicators & Quick Navigation */}
      <div className="hidden lg:flex items-center gap-4 text-xs font-medium text-neutral-600 dark:text-neutral-300">
        <button
          onClick={() => onNavigate('pos')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
            currentTab === 'pos'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 font-semibold'
              : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>POS Register</span>
          {cart.length > 0 && (
            <span className="ml-1 rounded bg-emerald-600 px-1.5 py-0.2 text-[10px] font-bold text-white tabular-nums">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>

        {heldSales.length > 0 && (
          <button
            onClick={() => onNavigate('pos')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100 transition-colors"
            title="Held sales waiting to be resumed"
          >
            <span className="font-semibold tabular-nums">{heldSales.length}</span>
            <span>Parked Bills</span>
          </button>
        )}

        <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-700" />

        <div className="text-[11px] text-neutral-600 dark:text-neutral-400">
          <span>Shortcuts: </span>
          <kbd className="rounded border border-neutral-300 bg-neutral-100 px-1 py-0.5 text-[10px] font-mono text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">F2</kbd> Search
          <span className="mx-1">·</span>
          <kbd className="rounded border border-neutral-300 bg-neutral-100 px-1 py-0.5 text-[10px] font-mono text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">F9</kbd> Pay
        </div>
      </div>

      {/* Zone 3: Utility Controls & User Profile Dropdown */}
      <div className="flex items-center gap-2.5">
        {/* Sound toggle */}
        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Barcode scanner beeps enabled' : 'Muted'}
          className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>

        {/* Theme toggle */}
        <button
          onClick={onToggleDarkMode}
          title="Toggle Dark Mode"
          className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-700" />

        {/* Role & User Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-800 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <div className="text-left hidden md:block">
              <div className="font-medium capitalize">{currentUser?.displayName || 'Staff'}</div>
              <div className="text-[10px] text-neutral-600 dark:text-neutral-400 uppercase tracking-wider font-semibold">
                {currentUser?.role.replace('_', ' ')}
              </div>
            </div>
            <ChevronDown className="h-3 w-3 text-neutral-400" />
          </button>

          {roleMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-72 rounded-xl border border-neutral-200 bg-white p-2 shadow-lg dark:border-neutral-700 dark:bg-neutral-800 z-50 animate-in fade-in zoom-in-95 duration-100"
              onClick={() => setRoleMenuOpen(false)}
            >
              <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-700/60">
                <div className="text-xs font-semibold text-neutral-900 dark:text-white">Active Session</div>
                <div className="text-[11px] text-neutral-500 truncate">{currentUser?.email}</div>
              </div>

              <div className="py-1">
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  Switch Active Role (Demo & Testing)
                </div>
                {roles.map((item) => (
                  <button
                    key={item.role}
                    onClick={() => switchUserRole(item.role)}
                    className={`flex w-full flex-col items-start px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                      currentUser?.role === item.role
                        ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300 font-medium'
                        : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700/50'
                    }`}
                  >
                    <span className="font-semibold">{item.label}</span>
                    <span className="text-[11px] text-neutral-500">{item.desc}</span>
                  </button>
                ))}
              </div>

              <div className="border-t border-neutral-100 dark:border-neutral-700/60 pt-1">
                {!firebaseUser ? (
                  <button
                    onClick={signInWithGoogle}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700/50 rounded-lg"
                  >
                    <User className="h-3.5 w-3.5 text-neutral-500" />
                    <span>Sign In with Google Account</span>
                  </button>
                ) : (
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
