/**
 * Store Configuration, Thermal Receipt Layout & First-Run Demo Data Settings
 */
import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Store,
  Printer,
  ShieldCheck,
  RefreshCw,
  Trash2,
  Check,
  Building,
  Sliders,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';

export const SettingsScreen: React.FC = () => {
  const { settings, updateSettings, seedDemoData, clearAllDemoData } = useStore();
  const { currentUser } = useAuth();

  const [formState, setFormState] = useState({
    storeName: settings.storeName,
    tagline: settings.tagline,
    address: settings.address,
    phone: settings.phone,
    email: settings.email,
    taxNumber: settings.taxNumber,
    taxRate: settings.taxRate,
    receiptFooter: settings.receiptFooter,
    receiptWidth: settings.receiptWidth,
    negativeStockAllowed: settings.negativeStockAllowed,
    lowStockThreshold: settings.lowStockThreshold,
    expiryWarningDays: settings.expiryWarningDays,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(formState);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleClearDemo = async () => {
    if (
      confirm(
        'WARNING: This will clear all demo sales, purchases, and expenses for a fresh live store opening. Do you want to proceed?'
      )
    ) {
      setIsResetting(true);
      await clearAllDemoData();
      setIsResetting(false);
      alert('Demo transactional records cleared.');
    }
  };

  const handleSeedDemo = async () => {
    if (confirm('Re-seed authentic Pakistani grocery sample catalog and suppliers?')) {
      setIsResetting(true);
      await seedDemoData();
      setIsResetting(false);
      alert('Sample Pakistani grocery dataset loaded.');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Store & POS Settings
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Configure Family Mart business information, tax rules, thermal printing, and stock policies.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
            <Check className="h-4 w-4" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Profile Information */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <Store className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
              Family Mart Business Profile
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Store Name *
              </label>
              <input
                type="text"
                required
                value={formState.storeName}
                onChange={(e) => setFormState({ ...formState, storeName: e.target.value })}
                className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Tagline / Slogan
              </label>
              <input
                type="text"
                value={formState.tagline}
                onChange={(e) => setFormState({ ...formState, tagline: e.target.value })}
                className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Store Physical Address (Printed on Receipts)
              </label>
              <input
                type="text"
                value={formState.address}
                onChange={(e) => setFormState({ ...formState, address: e.target.value })}
                className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Store Phone / WhatsApp Helpline
              </label>
              <input
                type="text"
                value={formState.phone}
                onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Official Email
              </label>
              <input
                type="email"
                value={formState.email}
                onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Currency, Timezone & Taxation */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <Building className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
              Currency, Timezone & Tax Configuration
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Operating Currency
              </label>
              <input
                type="text"
                disabled
                value="PKR (Rs. - Pakistani Rupee)"
                className="w-full rounded-xl border border-neutral-200 bg-neutral-100 p-2.5 text-neutral-500 font-mono dark:border-neutral-800 dark:bg-neutral-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Store Timezone
              </label>
              <input
                type="text"
                disabled
                value="Asia/Karachi (GMT+5)"
                className="w-full rounded-xl border border-neutral-200 bg-neutral-100 p-2.5 text-neutral-500 font-mono dark:border-neutral-800 dark:bg-neutral-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                General Sales Tax Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={formState.taxRate}
                onChange={(e) => setFormState({ ...formState, taxRate: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 font-mono text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Tax Registration Number (NTN / STRN)
              </label>
              <input
                type="text"
                value={formState.taxNumber}
                onChange={(e) => setFormState({ ...formState, taxNumber: e.target.value })}
                placeholder="e.g. NTN: 8943210-7"
                className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 font-mono text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Thermal Receipt & Hardware Settings */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <Printer className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
              Thermal Receipt & POS Hardware
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Default Thermal Printer Width
              </label>
              <select
                value={formState.receiptWidth}
                onChange={(e) => setFormState({ ...formState, receiptWidth: e.target.value as '80mm' | '58mm' })}
                className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              >
                <option value="80mm">80 mm Standard POS Roll (Recommended)</option>
                <option value="58mm">58 mm Compact Thermal Roll</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Receipt Footer Message
              </label>
              <textarea
                rows={2}
                value={formState.receiptFooter}
                onChange={(e) => setFormState({ ...formState, receiptFooter: e.target.value })}
                className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Inventory Control Policies */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
            <Sliders className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
              Inventory & Negative Stock Control
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formState.negativeStockAllowed}
                onChange={(e) => setFormState({ ...formState, negativeStockAllowed: e.target.checked })}
                className="mt-0.5 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  Allow Negative Stock Sales
                </span>
                <p className="text-neutral-500 mt-0.5">
                  When enabled, cashiers can sell products even if recorded stock is zero (useful if goods arrived on shelf before supplier invoice is entered). When disabled, out-of-stock items cannot be added to cart.
                </p>
              </div>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Default Low Stock Alert Threshold (Units)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formState.lowStockThreshold}
                  onChange={(e) => setFormState({ ...formState, lowStockThreshold: parseInt(e.target.value) || 10 })}
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 font-mono text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Expiry Warning Window (Days Before Expiry)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formState.expiryWarningDays}
                  onChange={(e) => setFormState({ ...formState, expiryWarningDays: parseInt(e.target.value) || 30 })}
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 font-mono text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Changes Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
          >
            <Check className="h-4 w-4" />
            <span>Save All Configuration</span>
          </button>
        </div>
      </form>

      {/* Demo Data Management & Live Reset Zone */}
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900/50 space-y-3">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
          First-Run Demo Data & Live Store Handover
        </h3>
        <p className="text-xs text-neutral-500 leading-relaxed">
          The database currently contains realistic Pakistani grocery items (Tapal, Dalda, National, Basmati Rice, etc.). You can reset demo sales transactions when opening Family Mart for live commercial operation.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleClearDemo}
            disabled={isResetting}
            className="flex items-center gap-2 rounded-xl border border-rose-300 bg-white px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:bg-neutral-800 dark:text-rose-400 dark:hover:bg-rose-950/40"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear Demo Transactions</span>
          </button>

          <button
            type="button"
            onClick={handleSeedDemo}
            disabled={isResetting}
            className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Re-seed Sample Pakistani Grocery Catalog</span>
          </button>
        </div>
      </div>
    </div>
  );
};
