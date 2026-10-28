/**
 * Live Business Dashboard for Family Mart POS
 */
import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  CreditCard,
  Package,
  AlertTriangle,
  Clock,
  Wallet,
  ArrowUpRight,
  ShoppingBag,
  Layers,
  Calendar,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { Sale } from '../../types';
import { ReceiptModal } from '../pos/ReceiptModal';

type DateFilter = 'today' | 'yesterday' | 'last7' | 'thisMonth' | 'all';

export const Dashboard: React.FC<{ onNavigate: (tabId: string) => void }> = ({ onNavigate }) => {
  const { sales, products, expenses, settings, categories } = useStore();
  const { currentUser, canAccess } = useAuth();

  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [viewingReceipt, setViewingReceipt] = useState<Sale | null>(null);

  // Filter Sales & Expenses by Date
  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const last7Start = todayStart - 6 * 86400000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return sales.filter((sale) => {
      const saleTime = new Date(sale.timestamp).getTime();
      if (dateFilter === 'today') return saleTime >= todayStart;
      if (dateFilter === 'yesterday') return saleTime >= yesterdayStart && saleTime < todayStart;
      if (dateFilter === 'last7') return saleTime >= last7Start;
      if (dateFilter === 'thisMonth') return saleTime >= monthStart;
      return true;
    });
  }, [sales, dateFilter]);

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const last7Start = todayStart - 6 * 86400000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return expenses.filter((exp) => {
      const expTime = new Date(exp.date).getTime();
      if (dateFilter === 'today') return expTime >= todayStart;
      if (dateFilter === 'yesterday') return expTime >= yesterdayStart && expTime < todayStart;
      if (dateFilter === 'last7') return expTime >= last7Start;
      if (dateFilter === 'thisMonth') return expTime >= monthStart;
      return true;
    });
  }, [expenses, dateFilter]);

  // Financial Metrics
  const grossSales = filteredSales.reduce((sum, s) => sum + s.subtotal, 0);
  const netSales = filteredSales.reduce((sum, s) => sum + s.netTotal, 0);
  const totalCost = filteredSales.reduce((sum, s) => sum + (s.totalCost || 0), 0);
  const grossProfit = filteredSales.reduce((sum, s) => sum + (s.grossProfit || 0), 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const operatingProfit = grossProfit - totalExpenses;
  const transactionCount = filteredSales.length;

  // Inventory Metrics
  const lowStockThreshold = settings.lowStockThreshold || 10;
  const lowStockItems = products.filter((p) => p.isActive && p.currentStock > 0 && p.currentStock <= lowStockThreshold);
  const outOfStockItems = products.filter((p) => p.isActive && p.currentStock <= 0);

  // Near Expiry Items (expiring within settings.expiryWarningDays)
  const nearExpiryDays = settings.expiryWarningDays || 45;
  const nowTime = new Date().getTime();
  const nearExpiryItems = products.filter((p) => {
    if (!p.isActive || !p.expiryDate) return false;
    const expTime = new Date(p.expiryDate).getTime();
    const daysLeft = (expTime - nowTime) / (1000 * 3600 * 24);
    return daysLeft >= 0 && daysLeft <= nearExpiryDays;
  });

  // Top Selling Products Calculation
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; revenue: number; category: string }>();

    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const existing = map.get(item.productId);
        const prodCategory = products.find((p) => p.id === item.productId)?.categoryName || 'Grocery';
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += item.lineTotal;
        } else {
          map.set(item.productId, {
            name: item.name,
            quantity: item.quantity,
            revenue: item.lineTotal,
            category: prodCategory,
          });
        }
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredSales, products]);

  // Sales by Category
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();

    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const cat = products.find((p) => p.id === item.productId)?.categoryName || 'Other';
        map.set(cat, (map.get(cat) || 0) + item.lineTotal);
      });
    });

    return Array.from(map.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [filteredSales, products]);

  // Daily Trend calculation (last 7 data points)
  const salesTrend = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const buckets: { label: string; amount: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const dayEnd = dayStart + 86400000;
      const daySales = sales
        .filter((s) => {
          const t = new Date(s.timestamp).getTime();
          return t >= dayStart && t < dayEnd;
        })
        .reduce((sum, s) => sum + s.netTotal, 0);

      buckets.push({
        label: i === 0 ? 'Today' : days[d.getDay()],
        amount: daySales,
      });
    }
    return buckets;
  }, [sales]);

  const maxTrend = Math.max(...salesTrend.map((t) => t.amount), 1);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Top Banner & Date Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Business Dashboard
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Real-time financial performance and live stock indicators for {settings.storeName}
          </p>
        </div>

        {/* Date Filters */}
        <div className="flex items-center rounded-lg border border-neutral-200 bg-white p-1 text-xs font-medium dark:border-neutral-700 dark:bg-neutral-800 shadow-xs">
          {(
            [
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'last7', label: 'Last 7 Days' },
              { id: 'thisMonth', label: 'This Month' },
              { id: 'all', label: 'All Time' },
            ] as const
          ).map((btn) => (
            <button
              key={btn.id}
              onClick={() => setDateFilter(btn.id)}
              className={`rounded-md px-2.5 py-1 transition-colors ${
                dateFilter === btn.id
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Showcase Strip (Family Mart Visual) */}
      <div className="relative overflow-hidden rounded-2xl bg-neutral-900 text-white shadow-lg border border-neutral-800">
        <img
          src="/src/assets/images/familymart_store_hero_1793186182192.jpg"
          alt="Family Mart Store Interior"
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between p-6 gap-4">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              <span>Retail Operations Hub</span>
              <span aria-hidden="true">·</span>
              <span>{settings.address}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Family Mart Grocery & Convenience
            </h2>
            <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
              Standard cashier terminal active in PKR currency with live barcode scanning, EAN-13 matching, and automated inventory sync.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('pos')}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-sm transition-transform active:scale-98"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Launch POS Checkout</span>
            </button>
            <button
              onClick={() => onNavigate('inventory')}
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/20 backdrop-blur-xs transition-colors"
            >
              <Package className="h-4 w-4" />
              <span>Stock Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards Grid (8 Core Metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Gross Sales */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Gross Sales</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-neutral-900 dark:text-white">
            Rs. {grossSales.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">Before deductions</div>
        </div>

        {/* Net Sales */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Net Sales</span>
            <CreditCard className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
            Rs. {netSales.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Gross Profit (Only for authorized roles) */}
        {canAccess('view_profits') ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 text-xs">
              <span>Gross Profit</span>
              <ArrowUpRight className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
              Rs. {grossProfit.toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] text-neutral-500">
              COGS: Rs. {totalCost.toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 text-xs">
              <span>Transactions</span>
              <ShoppingBag className="h-4 w-4 text-neutral-400" />
            </div>
            <div className="mt-2 text-xl font-bold font-mono text-neutral-900 dark:text-white">
              {transactionCount}
            </div>
            <div className="mt-1 text-[11px] text-neutral-500">Customer checkouts</div>
          </div>
        )}

        {/* Operating Expenses */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Expenses</span>
            <Wallet className="h-4 w-4 text-neutral-500" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-neutral-900 dark:text-white">
            Rs. {totalExpenses.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            {filteredExpenses.length} expense record{filteredExpenses.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Low Stock Items */}
        <button
          onClick={() => onNavigate('inventory')}
          className="rounded-xl border border-neutral-200 bg-white p-4 text-left hover:border-amber-500 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Low Stock</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {lowStockItems.length}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">Below threshold ({lowStockThreshold})</div>
        </button>

        {/* Out of Stock Items */}
        <button
          onClick={() => onNavigate('inventory')}
          className="rounded-xl border border-neutral-200 bg-white p-4 text-left hover:border-rose-500 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Out of Stock</span>
            <Package className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
            {outOfStockItems.length}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">Needs replenishment</div>
        </button>

        {/* Near Expiry Products */}
        <button
          onClick={() => onNavigate('inventory')}
          className="rounded-xl border border-neutral-200 bg-white p-4 text-left hover:border-amber-500 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs transition-colors"
        >
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span>Near Expiry</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {nearExpiryItems.length}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">Within {nearExpiryDays} days</div>
        </button>

        {/* Operating Profit (for Owner / Manager) */}
        {canAccess('view_profits') ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 text-xs">
              <span>Operating Profit</span>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-xl font-bold font-mono text-emerald-800 dark:text-emerald-300">
              Rs. {operatingProfit.toLocaleString()}
            </div>
            <div className="mt-1 text-[11px] text-neutral-500">Gross profit - expenses</div>
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs">
            <div className="flex items-center justify-between text-neutral-500 text-xs">
              <span>Catalog Size</span>
              <Layers className="h-4 w-4 text-neutral-500" />
            </div>
            <div className="mt-2 text-xl font-bold font-mono text-neutral-900 dark:text-white">
              {products.length}
            </div>
            <div className="mt-1 text-[11px] text-neutral-500">Active retail SKUs</div>
          </div>
        )}
      </div>

      {/* Two Column Section: Sales Trend & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales Trend Chart (Clean SVG Bars) */}
        <div className="lg:col-span-2 rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                7-Day Sales Trajectory
              </h3>
              <p className="text-xs text-neutral-500">Daily net sales revenue in PKR</p>
            </div>
            <span className="text-xs font-semibold font-mono text-emerald-700 dark:text-emerald-400">
              Total: Rs. {salesTrend.reduce((s, i) => s + i.amount, 0).toLocaleString()}
            </span>
          </div>

          <div className="h-56 flex items-end gap-3 pt-6 pb-2 px-2">
            {salesTrend.map((day, idx) => {
              const heightPct = Math.max(6, Math.round((day.amount / maxTrend) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="text-[10px] font-mono font-medium text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    Rs. {day.amount > 1000 ? `${(day.amount / 1000).toFixed(1)}k` : day.amount}
                  </div>
                  <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-t-lg h-40 flex items-end overflow-hidden">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-emerald-600 group-hover:bg-emerald-500 rounded-t-md transition-all duration-300"
                    />
                  </div>
                  <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sales by Category Breakdown */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1">
            Top Categories
          </h3>
          <p className="text-xs text-neutral-500 mb-4">Sales volume distribution</p>

          {categoryBreakdown.length === 0 ? (
            <div className="flex h-44 items-center justify-center text-xs text-neutral-400">
              No category sales recorded yet
            </div>
          ) : (
            <div className="space-y-3">
              {categoryBreakdown.map((cat, i) => {
                const totalCatSales = categoryBreakdown.reduce((sum, c) => sum + c.amount, 0);
                const pct = totalCatSales > 0 ? Math.round((cat.amount / totalCatSales) * 100) : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {cat.name}
                      </span>
                      <span className="font-mono text-neutral-600 dark:text-neutral-400">
                        Rs. {cat.amount.toLocaleString()} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full bg-emerald-600 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Two Column Section: Top Selling Items & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Selling Products */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Best-Selling Products
              </h3>
              <p className="text-xs text-neutral-500">Highest revenue items in period</p>
            </div>
            <button
              onClick={() => onNavigate('products')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              View Catalog →
            </button>
          </div>

          {topProducts.length === 0 ? (
            <div className="flex h-36 items-center justify-center text-xs text-neutral-400">
              No product sales in selected period
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {topProducts.map((p, index) => (
                <div key={index} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold font-mono text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                      {index + 1}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-neutral-900 dark:text-white">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-neutral-500">{p.category}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-neutral-900 dark:text-white">
                      Rs. {p.revenue.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono">
                      {p.quantity} units sold
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions with Receipt Inspection */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Recent Transactions
              </h3>
              <p className="text-xs text-neutral-500">Latest cashier receipts</p>
            </div>
            <button
              onClick={() => onNavigate('sales-history')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Full History →
            </button>
          </div>

          {sales.length === 0 ? (
            <div className="flex h-36 items-center justify-center text-xs text-neutral-400">
              No transactions recorded yet. Go to POS to create a sale.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {sales.slice(0, 5).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-neutral-900 dark:text-white">
                        {sale.receiptNo}
                      </span>
                      <span className="text-[10px] uppercase font-semibold text-neutral-600 dark:text-neutral-400">
                        · {sale.paymentMethod}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      {sale.items.length} item{sale.items.length !== 1 ? 's' : ''} · Cashier: {sale.cashierName} ·{' '}
                      {new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400">
                        Rs. {sale.netTotal.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-neutral-500 capitalize">
                        {sale.paymentStatus}
                      </div>
                    </div>

                    <button
                      onClick={() => setViewingReceipt(sale)}
                      className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800"
                      title="View Receipt"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Receipt Modal if clicked */}
      {viewingReceipt && (
        <ReceiptModal
          sale={viewingReceipt}
          settings={settings}
          onClose={() => setViewingReceipt(null)}
          onNewSale={() => {
            setViewingReceipt(null);
            onNavigate('pos');
          }}
        />
      )}
    </div>
  );
};
