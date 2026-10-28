/**
 * Persistent 15-Item Navigation Sidebar with Role-Based Visibility
 */
import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Layers,
  Boxes,
  Barcode,
  Truck,
  Building2,
  Users,
  Wallet,
  BarChart3,
  UserCheck,
  Settings,
  FileText,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { UserRole } from '../../types';

interface SidebarProps {
  currentTab: string;
  onNavigate: (tabId: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: UserRole[];
  badge?: () => React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { currentUser } = useAuth();
  const { products, heldSales, settings } = useStore();

  const lowStockCount = products.filter(
    (p) => p.isActive && p.currentStock <= (settings.lowStockThreshold || 10)
  ).length;

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      allowedRoles: ['owner', 'manager'],
    },
    {
      id: 'pos',
      label: 'POS / New Sale',
      icon: ShoppingCart,
      allowedRoles: ['owner', 'manager', 'cashier'],
      badge: () =>
        heldSales.length > 0 ? (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 tabular-nums">
            {heldSales.length} held
          </span>
        ) : null,
    },
    {
      id: 'sales-history',
      label: 'Sales History',
      icon: Receipt,
      allowedRoles: ['owner', 'manager', 'cashier'],
    },
    {
      id: 'products',
      label: 'Products',
      icon: Package,
      allowedRoles: ['owner', 'manager', 'inventory_staff'],
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: Layers,
      allowedRoles: ['owner', 'manager', 'inventory_staff'],
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Boxes,
      allowedRoles: ['owner', 'manager', 'inventory_staff'],
      badge: () =>
        lowStockCount > 0 ? (
          <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300 tabular-nums">
            {lowStockCount} low
          </span>
        ) : null,
    },
    {
      id: 'barcode-labels',
      label: 'Barcode Labels',
      icon: Barcode,
      allowedRoles: ['owner', 'manager', 'inventory_staff'],
    },
    {
      id: 'purchases',
      label: 'Purchases',
      icon: Truck,
      allowedRoles: ['owner', 'manager', 'inventory_staff'],
    },
    {
      id: 'suppliers',
      label: 'Suppliers',
      icon: Building2,
      allowedRoles: ['owner', 'manager', 'inventory_staff'],
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
      allowedRoles: ['owner', 'manager', 'cashier'],
    },
    {
      id: 'expenses',
      label: 'Expenses',
      icon: Wallet,
      allowedRoles: ['owner', 'manager'],
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart3,
      allowedRoles: ['owner', 'manager'],
    },
    {
      id: 'staff',
      label: 'Staff & Permissions',
      icon: UserCheck,
      allowedRoles: ['owner'],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      allowedRoles: ['owner', 'manager'],
    },
    {
      id: 'audit-logs',
      label: 'Audit Logs',
      icon: FileText,
      allowedRoles: ['owner', 'manager'],
    },
  ];

  const currentRole = currentUser?.role || 'cashier';
  const visibleItems = navItems.filter((item) => item.allowedRoles.includes(currentRole));

  const content = (
    <div className="flex h-full flex-col justify-between bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 select-none">
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
          Navigation
        </div>

        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                onCloseMobile();
              }}
              className={`flex w-full items-center justify-between gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-600 font-semibold'
                  : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-neutral-500 dark:text-neutral-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && item.badge()}
            </button>
          );
        })}
      </div>

      {/* Store Quick Status Footer */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
        <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="font-medium text-neutral-700 dark:text-neutral-300">Live Database</span>
          </div>
          <span className="tabular-nums font-mono text-[10px]">Cloud Firestore</span>
        </div>
        <div className="mt-1 text-[10px] text-neutral-600 dark:text-neutral-400 truncate">
          Role: <span className="font-semibold text-neutral-700 dark:text-neutral-300 capitalize">{currentRole.replace('_', ' ')}</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-[calc(100vh-4rem)] sticky top-16 z-20">
        {content}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Slide-over Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-200 ease-in-out lg:hidden ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {content}
      </div>
    </>
  );
};
