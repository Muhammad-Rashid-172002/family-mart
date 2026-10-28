/**
 * Customer Directory, Loyalty Points & Credit Ledger
 */
import React, { useState } from 'react';
import { Users, Plus, Search, Mail, MapPin, X, CreditCard, Banknote, Check } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Customer } from '../../types';

export const CustomerManagement: React.FC = () => {
  const { customers, addCustomer, sales, repayCustomerCredit } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [repayModalCustomer, setRepayModalCustomer] = useState<Customer | null>(null);
  const [repayAmount, setRepayAmount] = useState<string>('');
  const [repayMethod, setRepayMethod] = useState<string>('cash');
  const [isSubmittingRepay, setIsSubmittingRepay] = useState(false);
  const [search, setSearch] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+92 ');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimit, setCreditLimit] = useState<number>(10000);
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setName('');
    setPhone('+92 ');
    setEmail('');
    setAddress('');
    setCreditLimit(10000);
    setNotes('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addCustomer({
      name,
      phone,
      email,
      address,
      creditBalance: 0,
      creditLimit: creditLimit || 10000,
      loyaltyPoints: 0,
      totalPurchases: 0,
      notes,
    });
    setModalOpen(false);
  };

  const handleRepaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayModalCustomer) return;
    const amount = parseFloat(repayAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid repayment amount.');
      return;
    }

    setIsSubmittingRepay(true);
    try {
      await repayCustomerCredit(repayModalCustomer.id, amount);
      setRepayModalCustomer(null);
      setRepayAmount('');
    } catch (err) {
      alert('Failed to record repayment: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmittingRepay(false);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Customer Directory & Credit Ledger (Khata)
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage customer contact records, credit limits, outstanding balances, and repayments.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>New Customer Profile</span>
        </button>
      </div>

      <div className="flex items-center bg-white p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name or phone..."
            className="w-full rounded-xl border border-neutral-300 bg-neutral-50 py-1.5 pl-9 pr-3 text-xs text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Walk-in Customer Card */}
        <div className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/40 p-5 dark:border-emerald-900 dark:bg-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-sm">
              FM
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Walk-in Customer (Default)
              </h3>
              <div className="text-xs text-neutral-500">Standard retail checkout</div>
            </div>
          </div>
          <div className="mt-4 text-xs text-neutral-600 dark:text-neutral-400">
            For rapid cashier checkout without requiring customer contact registration.
          </div>
        </div>

        {/* Registered Customers */}
        {filtered.map((cust) => {
          const customerSales = sales.filter((s) => s.customerId === cust.id || (s.customerPhone && s.customerPhone === cust.phone));
          const totalSpent = customerSales.reduce((sum, s) => sum + s.netTotal, 0);
          const limit = cust.creditLimit || 10000;

          return (
            <div
              key={cust.id}
              className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs hover:border-emerald-500 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 font-bold dark:bg-neutral-800 dark:text-neutral-300 text-xs">
                      {cust.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                        {cust.name}
                      </h3>
                      <div className="text-xs text-neutral-500 font-mono">{cust.phone}</div>
                    </div>
                  </div>

                  {cust.creditBalance > 0 && (
                    <button
                      onClick={() => {
                        setRepayModalCustomer(cust);
                        setRepayAmount(cust.creditBalance.toString());
                      }}
                      className="rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-amber-600 shadow-xs"
                    >
                      Repay
                    </button>
                  )}
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-neutral-600 dark:text-neutral-300">
                  {cust.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-neutral-400" />
                      <span>{cust.email}</span>
                    </div>
                  )}
                  {cust.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                      <span>{cust.address}</span>
                    </div>
                  )}
                </div>

                {/* Credit Balance Ledger Info */}
                <div className="mt-4 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-700/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Khata / Credit Due:</span>
                    <span
                      className={`font-mono font-bold ${
                        cust.creditBalance > 0
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-neutral-600 dark:text-neutral-300'
                      }`}
                    >
                      Rs. {cust.creditBalance.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-1">
                    <span>Credit Limit:</span>
                    <span className="font-mono">Rs. {limit.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-700 dark:text-emerald-400 font-mono">
                  Spent: Rs. {totalSpent.toLocaleString()}
                </span>
                <span className="font-mono text-neutral-600 dark:text-neutral-400 text-[11px]">
                  {customerSales.length} visits
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Register Customer Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4 dark:border-neutral-800">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Register Customer Profile
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Tariq Mehmood"
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Mobile / WhatsApp Number *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0300-1234567"
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 font-mono text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Credit Limit (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(parseFloat(e.target.value) || 0)}
                    placeholder="10000"
                    className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 font-mono text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Residential Delivery Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House #, Street #, Sector / Colony"
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-neutral-300 px-4 py-2 font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-700 shadow-sm"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Repayment Modal */}
      {repayModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4 dark:border-neutral-800">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Record Credit Repayment
              </h2>
              <button
                onClick={() => setRepayModalCustomer(null)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRepaySubmit} className="space-y-4 text-xs">
              <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                <div className="font-semibold text-neutral-900 dark:text-white">
                  {repayModalCustomer.name}
                </div>
                <div className="text-[11px] text-neutral-500 font-mono">
                  {repayModalCustomer.phone}
                </div>
                <div className="mt-2 text-xs flex justify-between">
                  <span className="text-amber-800 dark:text-amber-300">Outstanding Balance:</span>
                  <span className="font-mono font-bold text-amber-900 dark:text-amber-200">
                    Rs. {repayModalCustomer.creditBalance.toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Repayment Amount (Rs.) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={repayModalCustomer.creditBalance}
                  autoFocus
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 font-mono text-base font-bold text-neutral-900 focus:outline-none focus:border-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={repayMethod}
                  onChange={(e) => setRepayMethod(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2 text-xs text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                >
                  <option value="cash">Cash Tendered</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="easypaisa">Easypaisa</option>
                  <option value="jazzcash">JazzCash</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setRepayModalCustomer(null)}
                  disabled={isSubmittingRepay}
                  className="rounded-xl border border-neutral-300 px-4 py-2 font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRepay}
                  className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-700 shadow-sm"
                >
                  {isSubmittingRepay ? 'Recording...' : 'Confirm Repayment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
