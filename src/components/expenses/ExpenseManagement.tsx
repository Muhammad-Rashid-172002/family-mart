/**
 * Store Operational Expense Management
 */
import React, { useState } from 'react';
import { Wallet, Plus, Search, Trash2, Calendar, X, TrendingDown } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { ExpenseCategory } from '../../types';

export const ExpenseManagement: React.FC = () => {
  const { expenses, addExpense, deleteExpense } = useStore();
  const { currentUser } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>('utilities');
  const [amount, setAmount] = useState<number>(1500);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const categories: { id: ExpenseCategory; label: string }[] = [
    { id: 'electricity', label: 'Electricity & Generator Fuel' },
    { id: 'rent', label: 'Store Space Rent' },
    { id: 'salaries', label: 'Staff Salaries & Wages' },
    { id: 'packaging', label: 'Shopping Bags & Packaging' },
    { id: 'transport', label: 'Transportation & Logistics' },
    { id: 'repairs', label: 'Repairs & Maintenance' },
    { id: 'utilities', label: 'Water, Internet & Telecom' },
    { id: 'miscellaneous', label: 'Miscellaneous Supplies' },
  ];

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    await addExpense({
      category,
      amount: Number(amount),
      date,
      description: description.trim() || `${category} expense`,
      paymentMethod,
      recordedBy: currentUser?.id || 'staff',
      recordedByName: currentUser?.displayName || 'Staff',
    });

    setModalOpen(false);
    setDescription('');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Operating Expenses
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Record shop overheads, utilities, and payroll deducted from gross profits.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* KPI Card */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs flex items-center justify-between">
        <div>
          <div className="text-xs text-neutral-500 uppercase tracking-wider font-semibold">
            Total Recorded Expenses
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-neutral-900 dark:text-white">
            Rs. {totalExpenseAmount.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">
            {expenses.length} operating records tracked
          </div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
          <TrendingDown className="h-6 w-6" />
        </div>
      </div>

      {/* Expenses Table */}
      <div className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Payment Method</th>
                <th className="px-4 py-3 text-right">Amount (Rs.)</th>
                <th className="px-4 py-3">Recorded By</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    No operating expenses recorded yet. Click "Record Expense" to add utility or overhead bills.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50">
                    <td className="px-4 py-3 font-mono text-neutral-600 dark:text-neutral-400 text-[11px]">
                      {exp.date}
                    </td>

                    <td className="px-4 py-3 capitalize font-semibold text-neutral-800 dark:text-neutral-200">
                      {exp.category}
                    </td>

                    <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                      {exp.description}
                    </td>

                    <td className="px-4 py-3 text-neutral-500">
                      {exp.paymentMethod}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-neutral-900 dark:text-white">
                      Rs. {exp.amount.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-neutral-500 text-[11px]">
                      {exp.recordedByName}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          if (confirm('Delete this expense record?')) deleteExpense(exp.id);
                        }}
                        className="p-1 text-neutral-400 hover:text-rose-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4 dark:border-neutral-800">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Record Store Expense
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Expense Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Amount in PKR (Rs.) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  autoFocus
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 font-mono text-base font-bold text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 font-mono text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  >
                    <option value="Cash">Cash Drawer</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Easypaisa">Easypaisa</option>
                    <option value="JazzCash">JazzCash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Description / Vendor Note
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. WAPDA Electricity Bill Oct 2026"
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
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
