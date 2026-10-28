/**
 * Financial Reports, Profit & Loss, Cashier Performance & CSV Export
 */
import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  CreditCard,
  DollarSign,
  Users,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  ShieldCheck,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';

type ReportTab = 'pnl' | 'cashiers' | 'payment_methods' | 'reconciliation';

export const ReportsScreen: React.FC = () => {
  const { sales, expenses, settings, returns } = useStore();
  const { canAccess } = useAuth();

  const [activeTab, setActiveTab] = useState<ReportTab>('pnl');
  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days' | 'all'>('30days');

  // Filter sales and expenses by date range
  const filteredSales = useMemo(() => {
    const now = new Date().getTime();
    const dayMs = 86400000;

    return sales.filter((s) => {
      const time = new Date(s.timestamp).getTime();
      if (dateRange === 'today') return now - time <= dayMs;
      if (dateRange === '7days') return now - time <= 7 * dayMs;
      if (dateRange === '30days') return now - time <= 30 * dayMs;
      return true;
    });
  }, [sales, dateRange]);

  const filteredExpenses = useMemo(() => {
    const now = new Date().getTime();
    const dayMs = 86400000;

    return expenses.filter((e) => {
      const time = new Date(e.date).getTime();
      if (dateRange === 'today') return now - time <= dayMs;
      if (dateRange === '7days') return now - time <= 7 * dayMs;
      if (dateRange === '30days') return now - time <= 30 * dayMs;
      return true;
    });
  }, [expenses, dateRange]);

  // Financial aggregates
  const grossSales = filteredSales.reduce((sum, s) => sum + s.subtotal, 0);
  const discountsTotal = filteredSales.reduce(
    (sum, s) => sum + s.itemDiscountsTotal + s.transactionDiscount,
    0
  );
  const netSales = filteredSales.reduce((sum, s) => sum + s.netTotal, 0);
  const totalCOGS = filteredSales.reduce((sum, s) => sum + (s.totalCost || 0), 0);
  const grossProfit = filteredSales.reduce((sum, s) => sum + (s.grossProfit || 0), 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const operatingProfit = grossProfit - totalExpenses;

  // Cashier Performance Metrics
  const cashierMetrics = useMemo(() => {
    const map = new Map<string, { name: string; count: number; total: number }>();

    filteredSales.forEach((s) => {
      const existing = map.get(s.cashierId) || { name: s.cashierName, count: 0, total: 0 };
      existing.count += 1;
      existing.total += s.netTotal;
      map.set(s.cashierId, existing);
    });

    return Array.from(map.values()).map((c) => ({
      ...c,
      avgBasket: c.count > 0 ? Math.round(c.total / c.count) : 0,
    }));
  }, [filteredSales]);

  // Payment Methods Breakdown
  const paymentMetrics = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();

    filteredSales.forEach((s) => {
      const existing = map.get(s.paymentMethod) || { count: 0, total: 0 };
      existing.count += 1;
      existing.total += s.netTotal;
      map.set(s.paymentMethod, existing);
    });

    return Array.from(map.entries()).map(([method, data]) => ({
      method,
      ...data,
      pct: netSales > 0 ? Math.round((data.total / netSales) * 100) : 0,
    }));
  }, [filteredSales, netSales]);

  // Cash Reconciliation (Expected cash collected in drawer)
  const cashSales = filteredSales
    .filter((s) => s.paymentMethod === 'cash')
    .reduce((sum, s) => sum + s.netTotal, 0);

  const cashRefunds = returns
    .filter((r) => r.refundPaymentMethod === 'cash')
    .reduce((sum, r) => sum + r.totalRefundAmount, 0);

  const cashExpenses = filteredExpenses
    .filter((e) => e.paymentMethod === 'Cash')
    .reduce((sum, e) => sum + e.amount, 0);

  const expectedCashInDrawer = cashSales - cashRefunds - cashExpenses;

  // Export report to CSV
  const handleExportReport = () => {
    const rows = [
      ['Family Mart POS Financial Report'],
      [`Date Range: ${dateRange}`],
      [''],
      ['Metric', 'Amount (PKR)'],
      ['Gross Sales', grossSales],
      ['Total Discounts', discountsTotal],
      ['Net Sales Revenue', netSales],
      ['Cost of Goods Sold (COGS)', totalCOGS],
      ['Gross Profit', grossProfit],
      ['Operating Expenses', totalExpenses],
      ['Estimated Operating Profit', operatingProfit],
      ['Expected Cash in Drawer', expectedCashInDrawer],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((r) => r.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FamilyMart_Report_${dateRange}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Financial & Operations Reports
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Strict accounting definitions distinguishing Gross Sales, COGS, Gross Profit, and Operating Profit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Date Range Selector */}
          <div className="flex items-center rounded-xl border border-neutral-200 bg-white p-1 text-xs font-medium dark:border-neutral-700 dark:bg-neutral-800 shadow-xs">
            {[
              { id: 'today', label: 'Today' },
              { id: '7days', label: 'Last 7 Days' },
              { id: '30days', label: 'Last 30 Days' },
              { id: 'all', label: 'All Time' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setDateRange(btn.id as typeof dateRange)}
                className={`rounded-lg px-2.5 py-1 transition-colors ${
                  dateRange === btn.id
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportReport}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
        {[
          { id: 'pnl', label: 'Profit & Loss Statement' },
          { id: 'reconciliation', label: 'Cash Drawer Reconciliation' },
          { id: 'payment_methods', label: 'Payment Channels Breakdown' },
          { id: 'cashiers', label: 'Cashier Staff Performance' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ReportTab)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Profit & Loss Statement */}
      {activeTab === 'pnl' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs">
              <div className="text-xs text-neutral-500 font-medium">Net Sales Revenue</div>
              <div className="mt-2 text-xl font-bold font-mono text-neutral-900 dark:text-white">
                Rs. {netSales.toLocaleString()}
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">After customer discounts</div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs">
              <div className="text-xs text-neutral-500 font-medium">Cost of Goods Sold (COGS)</div>
              <div className="mt-2 text-xl font-bold font-mono text-neutral-900 dark:text-white">
                Rs. {totalCOGS.toLocaleString()}
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">Historical procurement cost</div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs">
              <div className="text-xs text-neutral-500 font-medium">Gross Profit</div>
              <div className="mt-2 text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                Rs. {grossProfit.toLocaleString()}
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">Net Sales minus COGS</div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs">
              <div className="text-xs text-neutral-500 font-medium">Operating Profit</div>
              <div className="mt-2 text-xl font-bold font-mono text-emerald-800 dark:text-emerald-300">
                Rs. {operatingProfit.toLocaleString()}
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">After operating expenses</div>
            </div>
          </div>

          {/* Detailed Statement Table */}
          <div className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-xs p-6 space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-800 pb-3">
              Income Statement Breakdown ({dateRange})
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-800">
                <span className="font-sans font-medium text-neutral-700 dark:text-neutral-300">
                  Gross Sales (Catalog Prices)
                </span>
                <span className="font-bold text-neutral-900 dark:text-white">
                  Rs. {grossSales.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-800 text-rose-600">
                <span className="font-sans font-medium">
                  Less: Customer Discounts & Concessions
                </span>
                <span>- Rs. {discountsTotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between py-2 border-b-2 border-neutral-300 dark:border-neutral-700 text-sm font-bold">
                <span className="font-sans">NET SALES REVENUE</span>
                <span className="text-emerald-700 dark:text-emerald-400">
                  Rs. {netSales.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400">
                <span className="font-sans font-medium">
                  Less: Cost of Goods Sold (Procurement Cost)
                </span>
                <span>- Rs. {totalCOGS.toLocaleString()}</span>
              </div>

              <div className="flex justify-between py-2 border-b-2 border-neutral-300 dark:border-neutral-700 text-sm font-bold">
                <span className="font-sans">GROSS PROFIT</span>
                <span className="text-emerald-700 dark:text-emerald-400">
                  Rs. {grossProfit.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400">
                <span className="font-sans font-medium">
                  Less: Shop Overheads & Operating Expenses
                </span>
                <span>- Rs. {totalExpenses.toLocaleString()}</span>
              </div>

              <div className="flex justify-between py-3 bg-emerald-50 dark:bg-emerald-950/40 px-4 rounded-xl text-base font-extrabold text-emerald-900 dark:text-emerald-200">
                <span className="font-sans">ESTIMATED OPERATING PROFIT</span>
                <span>Rs. {operatingProfit.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Cash Reconciliation */}
      {activeTab === 'reconciliation' && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Cash Drawer Reconciliation & Balancing
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Reconciles total physical cash received minus cash refunds and paid-out cash expenses.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/60">
              <div className="text-xs text-neutral-500 font-medium">Cash Sales Inflow</div>
              <div className="mt-1 text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                + Rs. {cashSales.toLocaleString()}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/60">
              <div className="text-xs text-neutral-500 font-medium">Cash Refunds & Expenses Outflow</div>
              <div className="mt-1 text-xl font-bold font-mono text-rose-600">
                - Rs. {(cashRefunds + cashExpenses).toLocaleString()}
              </div>
            </div>

            <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
              <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                Expected Cash Balance in Drawer
              </div>
              <div className="mt-1 text-2xl font-bold font-mono text-emerald-900 dark:text-emerald-200">
                Rs. {expectedCashInDrawer.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Payment Methods */}
      {activeTab === 'payment_methods' && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
            Payment Methods Distribution
          </h3>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {paymentMetrics.map((pm) => (
              <div key={pm.method} className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                    {pm.method}
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    {pm.count} transactions ({pm.pct}% of total revenue)
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold font-mono text-neutral-900 dark:text-white">
                    Rs. {pm.total.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Cashier Performance */}
      {activeTab === 'cashiers' && (
        <div className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Cashier Checkout Throughput
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-3">Cashier Name</th>
                  <th className="px-4 py-3 text-center">Transactions</th>
                  <th className="px-4 py-3 text-right">Total Net Sales</th>
                  <th className="px-4 py-3 text-right">Avg Basket Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {cashierMetrics.map((c, i) => (
                  <tr key={i} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50">
                    <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-white">
                      {c.name}
                    </td>
                    <td className="px-4 py-3 text-center font-mono">{c.count}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      Rs. {c.total.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-neutral-600 dark:text-neutral-400">
                      Rs. {c.avgBasket.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
