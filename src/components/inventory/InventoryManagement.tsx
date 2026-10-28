/**
 * Inventory Ledger, Stock Adjustments, Valuation & Expiry Monitor
 */
import React, { useState } from 'react';
import {
  Boxes,
  AlertTriangle,
  Clock,
  TrendingUp,
  Search,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Filter,
  Check,
  X,
  Scale,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Product, MovementType } from '../../types';

export const InventoryManagement: React.FC = () => {
  const { products, inventoryMovements, adjustStock, settings } = useStore();

  const [activeTab, setActiveTab] = useState<'valuation' | 'movements' | 'low_stock' | 'near_expiry'>('valuation');
  const [search, setSearch] = useState('');
  const [movementFilter, setMovementFilter] = useState<string>('all');
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Adjustment Form
  const [adjustmentType, setAdjustmentType] = useState<MovementType>('adjustment');
  const [newStockVal, setNewStockVal] = useState<string>('10');
  const [adjustmentReason, setAdjustmentReason] = useState<string>('Physical stock take count discrepancy');

  // Valuation metrics
  const totalCostValuation = products.reduce((sum, p) => sum + p.purchaseCost * p.currentStock, 0);
  const totalRetailValuation = products.reduce((sum, p) => sum + p.sellingPrice * p.currentStock, 0);
  const estimatedGrossMargin = totalRetailValuation - totalCostValuation;

  // Alerts
  const lowStockThreshold = settings.lowStockThreshold || 10;
  const lowStockProducts = products.filter((p) => p.isActive && p.currentStock > 0 && p.currentStock <= lowStockThreshold);
  const outOfStockProducts = products.filter((p) => p.isActive && p.currentStock <= 0);

  const expiryWarningDays = settings.expiryWarningDays || 45;
  const now = new Date().getTime();
  const expiringProducts = products.filter((p) => {
    if (!p.isActive || !p.expiryDate) return false;
    const exp = new Date(p.expiryDate).getTime();
    const days = (exp - now) / (1000 * 3600 * 24);
    return days <= expiryWarningDays;
  });

  const openAdjustmentModal = (prod: Product) => {
    setSelectedProduct(prod);
    setNewStockVal(prod.currentStock.toString());
    setAdjustmentType('adjustment');
    setAdjustmentReason('Physical stock count update');
    setAdjustmentModalOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const qty = parseFloat(newStockVal);
    if (isNaN(qty)) return;

    await adjustStock(selectedProduct.id, qty, adjustmentReason, adjustmentType);
    setAdjustmentModalOpen(false);
  };

  const filteredMovements = inventoryMovements.filter((mov) => {
    const matchesFilter = movementFilter === 'all' || mov.movementType === movementFilter;
    const matchesSearch =
      search === '' ||
      mov.productName.toLowerCase().includes(search.toLowerCase()) ||
      mov.sku.toLowerCase().includes(search.toLowerCase()) ||
      mov.reason.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Inventory & Stock Ledger
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Audit stock intake, deductions, valuations, and discrepancy adjustments.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center rounded-xl border border-neutral-200 bg-white p-1 text-xs font-medium dark:border-neutral-700 dark:bg-neutral-800 shadow-xs">
          {[
            { id: 'valuation', label: 'Valuation & Stock' },
            { id: 'movements', label: `Movement Ledger (${inventoryMovements.length})` },
            { id: 'low_stock', label: `Low Stock (${lowStockProducts.length + outOfStockProducts.length})` },
            { id: 'near_expiry', label: `Expiring (${expiringProducts.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Valuation Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs">
          <div className="text-xs text-neutral-500 font-medium">Total Cost Valuation</div>
          <div className="mt-2 text-xl font-bold font-mono text-neutral-900 dark:text-white">
            Rs. {totalCostValuation.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">Asset value based on purchase costs</div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs">
          <div className="text-xs text-neutral-500 font-medium">Total Retail Valuation</div>
          <div className="mt-2 text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
            Rs. {totalRetailValuation.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">Estimated gross retail realizable value</div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs">
          <div className="text-xs text-neutral-500 font-medium">Potential Retail Margin</div>
          <div className="mt-2 text-xl font-bold font-mono text-emerald-800 dark:text-emerald-300">
            Rs. {estimatedGrossMargin.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">
            {totalRetailValuation > 0
              ? `${((estimatedGrossMargin / totalRetailValuation) * 100).toFixed(1)}% gross margin`
              : '0%'}
          </div>
        </div>
      </div>

      {/* TAB 1: Valuation & Current Stock Table */}
      {activeTab === 'valuation' && (
        <div className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
              Live Product Stock List
            </h2>
            <div className="text-xs text-neutral-500">
              Click "Adjust" on any item to record an auditable count update
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-400">
                <tr>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3 text-right">In Stock</th>
                  <th className="px-4 py-3 text-right">Unit Cost</th>
                  <th className="px-4 py-3 text-right">Total Cost</th>
                  <th className="px-4 py-3 text-right">Selling Price</th>
                  <th className="px-4 py-3 text-right">Total Value</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {products.map((p) => {
                  const lineCostVal = p.purchaseCost * p.currentStock;
                  const lineRetailVal = p.sellingPrice * p.currentStock;
                  const isLow = p.currentStock <= p.minStockLevel;
                  const isOut = p.currentStock <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50">
                      <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-white">
                        {p.name}
                        {p.isWeightBased && (
                          <span className="text-[10px] text-emerald-600 ml-1.5 font-normal">
                            (by weight)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-neutral-600 dark:text-neutral-300">
                        {p.sku}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        <span
                          className={`font-bold ${
                            isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-neutral-900 dark:text-white'
                          }`}
                        >
                          {p.currentStock} {p.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-neutral-600 dark:text-neutral-400">
                        Rs. {p.purchaseCost.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-neutral-600 dark:text-neutral-400">
                        Rs. {lineCostVal.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                        Rs. {p.sellingPrice.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                        Rs. {lineRetailVal.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openAdjustmentModal(p)}
                          className="rounded-lg border border-neutral-300 px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Auditable Stock Movement Ledger */}
      {activeTab === 'movements' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ledger by product, SKU, or reason..."
                className="w-full rounded-xl border border-neutral-300 bg-neutral-50 py-2 pl-9 pr-3 text-xs text-neutral-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
            </div>

            <div className="w-full sm:w-48">
              <select
                value={movementFilter}
                onChange={(e) => setMovementFilter(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-neutral-50 py-2 px-3 text-xs text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              >
                <option value="all">All Movement Types</option>
                <option value="sale">Sales Deductions</option>
                <option value="purchase">Purchase Intake</option>
                <option value="adjustment">Manual Adjustments</option>
                <option value="return">Customer Returns</option>
                <option value="damage">Damage / Spoilage</option>
                <option value="expiry">Expired Stock</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-400">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Product Name & SKU</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 text-right">Change</th>
                    <th className="px-4 py-3 text-right">Prev → New</th>
                    <th className="px-4 py-3">Reason / Reference</th>
                    <th className="px-4 py-3">Staff Member</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-neutral-400">
                        No inventory movements recorded.
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((mov) => {
                      const isPositive = mov.quantityChange > 0;
                      return (
                        <tr key={mov.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50">
                          <td className="px-4 py-3 font-mono text-neutral-500 text-[11px]">
                            {new Date(mov.timestamp).toLocaleString('en-PK', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-semibold text-neutral-900 dark:text-white">
                              {mov.productName}
                            </div>
                            <div className="font-mono text-[10px] text-neutral-500">{mov.sku}</div>
                          </td>

                          <td className="px-4 py-3">
                            <span className="capitalize font-medium text-neutral-700 dark:text-neutral-300">
                              {mov.movementType}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right font-mono font-bold">
                            <span className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                              {isPositive ? `+${mov.quantityChange}` : mov.quantityChange}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right font-mono text-neutral-500">
                            {mov.previousQuantity} → <strong className="text-neutral-900 dark:text-white">{mov.newQuantity}</strong>
                          </td>

                          <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                            {mov.reason}
                          </td>

                          <td className="px-4 py-3 text-neutral-500">
                            {mov.performedByName}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Low & Out of Stock Alerts */}
      {activeTab === 'low_stock' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 p-5 shadow-xs">
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white mb-1">
              Low Stock Replenishment Alerts
            </h2>
            <p className="text-xs text-neutral-500 mb-4">
              Items currently at or below the minimum stock threshold ({lowStockThreshold})
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...outOfStockProducts, ...lowStockProducts].map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 dark:border-neutral-800 dark:bg-neutral-800/60 flex items-start justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white">{p.name}</div>
                    <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                      SKU: {p.sku} · Supplier: {p.supplierName || 'General'}
                    </div>
                    <div className="mt-2 text-xs font-bold font-mono">
                      Current Stock:{' '}
                      <span className={p.currentStock <= 0 ? 'text-rose-600' : 'text-amber-600'}>
                        {p.currentStock} {p.unit}
                      </span>{' '}
                      (Threshold: {p.minStockLevel})
                    </div>
                  </div>

                  <button
                    onClick={() => openAdjustmentModal(p)}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs"
                  >
                    Adjust Stock
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Near Expiry Items */}
      {activeTab === 'near_expiry' && (
        <div className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 p-5 shadow-xs">
          <h2 className="text-sm font-bold text-neutral-900 dark:text-white mb-1">
            Products Approaching Expiry
          </h2>
          <p className="text-xs text-neutral-500 mb-4">
            Items expiring within the configured {expiryWarningDays}-day warning window
          </p>

          {expiringProducts.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              No products approaching expiry in the next {expiryWarningDays} days.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {expiringProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white">{p.name}</div>
                    <div className="text-[11px] text-neutral-500 font-mono">
                      SKU: {p.sku} · Batch: {p.batchNumber || 'N/A'} · In Stock: {p.currentStock} {p.unit}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-bold text-amber-600 font-mono">
                        Expires: {p.expiryDate}
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        Suggest clearance discount
                      </div>
                    </div>
                    <button
                      onClick={() => openAdjustmentModal(p)}
                      className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300"
                    >
                      Record Expiry
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manual Stock Adjustment Modal */}
      {adjustmentModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4 dark:border-neutral-800">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Adjust Inventory Stock
                </h3>
                <div className="text-xs text-neutral-500">{selectedProduct.name}</div>
              </div>
              <button
                onClick={() => setAdjustmentModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div className="rounded-xl bg-neutral-50 p-3 text-xs dark:bg-neutral-800">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Current Recorded Stock:</span>
                  <span className="font-mono font-bold text-neutral-900 dark:text-white">
                    {selectedProduct.currentStock} {selectedProduct.unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  New Physical Stock Count ({selectedProduct.unit}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  autoFocus
                  value={newStockVal}
                  onChange={(e) => setNewStockVal(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 font-mono text-sm font-bold text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Movement Classification
                </label>
                <select
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value as MovementType)}
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-xs text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                >
                  <option value="adjustment">Stock Count Calibration / Audit</option>
                  <option value="damage">Damaged Goods / Spoilage</option>
                  <option value="expiry">Expired Stock Write-off</option>
                  <option value="purchase">Unrecorded Goods Delivery</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Reason & Audit Note *
                </label>
                <input
                  type="text"
                  required
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="e.g. Broken packaging found in aisle 3"
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-xs text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setAdjustmentModalOpen(false)}
                  className="rounded-xl border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
                >
                  Save Stock Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
