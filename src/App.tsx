/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { POSScreen } from './components/pos/POSScreen';
import { Dashboard } from './components/dashboard/Dashboard';
import { SalesHistory } from './components/sales/SalesHistory';
import { ProductManagement } from './components/products/ProductManagement';
import { CategoryManagement } from './components/categories/CategoryManagement';
import { InventoryManagement } from './components/inventory/InventoryManagement';
import { BarcodeLabelGenerator } from './components/barcodes/BarcodeLabelGenerator';
import { PurchaseManagement } from './components/purchases/PurchaseManagement';
import { SupplierManagement } from './components/suppliers/SupplierManagement';
import { CustomerManagement } from './components/customers/CustomerManagement';
import { ExpenseManagement } from './components/expenses/ExpenseManagement';
import { ReportsScreen } from './components/reports/ReportsScreen';
import { StaffManagement } from './components/staff/StaffManagement';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { AuditLogs } from './components/audit/AuditLogs';
import { Menu, Loader2, Store } from 'lucide-react';

const AppContent: React.FC = () => {
  const { currentUser } = useAuth();
  const { isLoading, settings } = useStore();

  const [currentTab, setCurrentTab] = useState<string>('pos');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('fm_theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('fm_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('fm_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);
  const toggleSound = () => setSoundEnabled(!soundEnabled);

  // Fallback tab if unauthorized
  useEffect(() => {
    if (currentUser?.role === 'cashier' && !['pos', 'sales-history', 'customers'].includes(currentTab)) {
      setCurrentTab('pos');
    } else if (currentUser?.role === 'inventory_staff' && ['reports', 'staff', 'settings', 'expenses'].includes(currentTab)) {
      setCurrentTab('inventory');
    }
  }, [currentUser, currentTab]);

  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentTab} />;
      case 'pos':
        return <POSScreen soundEnabled={soundEnabled} onNavigate={setCurrentTab} />;
      case 'sales-history':
        return <SalesHistory />;
      case 'products':
        return <ProductManagement />;
      case 'categories':
        return <CategoryManagement />;
      case 'inventory':
        return <InventoryManagement />;
      case 'barcode-labels':
        return <BarcodeLabelGenerator />;
      case 'purchases':
        return <PurchaseManagement />;
      case 'suppliers':
        return <SupplierManagement />;
      case 'customers':
        return <CustomerManagement />;
      case 'expenses':
        return <ExpenseManagement />;
      case 'reports':
        return <ReportsScreen />;
      case 'staff':
        return <StaffManagement />;
      case 'settings':
        return <SettingsScreen />;
      case 'audit-logs':
        return <AuditLogs />;
      default:
        return <POSScreen soundEnabled={soundEnabled} onNavigate={setCurrentTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 font-sans text-neutral-900 dark:text-neutral-100 flex flex-col">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onNavigate={setCurrentTab}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
      />

      {/* Mobile Sticky Bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-2 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300"
        >
          <Menu className="h-4 w-4" />
          <span>Menu ({currentTab})</span>
        </button>

        <button
          onClick={() => setCurrentTab('pos')}
          className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-xs"
        >
          POS Checkout
        </button>
      </div>

      {/* Main Workspace: Sidebar + Viewport */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onNavigate={setCurrentTab}
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <main className="flex-1 flex flex-col overflow-hidden bg-neutral-50 dark:bg-neutral-950">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </AuthProvider>
  );
}
