/**
 * Sales History, Receipt Reprinting & Controlled Returns/Refunds
 */
import React, { useState } from 'react';
import {
  Receipt,
  Search,
  Eye,
  RotateCcw,
  Printer,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Sale, PaymentMethod } from '../../types';
import { ReceiptModal } from '../pos/ReceiptModal';

export const SalesHistory: React.FC = () => {
  const { sales, settings, processReturn } = useStore();

  const [search, setSearch] = useState('');
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);
  const [returnModalSale, setReturnModalSale] = useState<Sale | null>(null);

  // Return workflow state
  const [returnItems, setReturnItems] = useState<{
    productId: string;
    name: string;
    maxQty: number;
    returnQty: number;
    unitPrice: number;
    condition: 'resalable' | 'damaged' | 'expired';
  }[]>([]);
  const [returnReason, setReturnReason] = useState('Customer changed mind / unopened');
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>('cash');
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);

  const openReturnModal = (sale: Sale) => {
    setReturnModalSale(sale);
    setRefundMethod(sale.paymentMethod || 'cash');
    setReturnReason('Customer returned unopened item with receipt');
    setReturnItems(
      sale.items.map((i) => ({
        productId: i.productId,
        name: i.name,
        maxQty: i.quantity,
        returnQty: 0,
        unitPrice: i.unitPrice,
        condition: 'resalable',
      }))
    );
  };

  const handleReturnQtyChange = (index: number, qty: number) => {
    setReturnItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, returnQty: Math.max(0, Math.min(item.maxQty, qty)) } : item))
    );
  };

  const handleReturnConditionChange = (index: number, condition: 'resalable' | 'damaged' | 'expired') => {
    setReturnItems((prev) => prev.map((item, i) => (i === index ? { ...item, condition } : item)));
  };

  const totalRefundAmount = returnItems.reduce((sum, item) => sum + item.returnQty * item.unitPrice, 0);

  const handleExecuteReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalSale || totalRefundAmount <= 0) {
      alert('Please select at least 1 item to return.');
      return;
    }

    setIsProcessingReturn(true);
    try {
      const validItems = returnItems
        .filter((i) => i.returnQty > 0)
        .map((i) => ({
          productId: i.productId,
          name: i.name,
          returnQuantity: i.returnQty,
          unitPrice: i.unitPrice,
          refundAmount: i.returnQty * i.unitPrice,
          condition: i.condition,
        }));

      await processReturn({
        originalSaleId: returnModalSale.id,
        originalReceiptNo: returnModalSale.receiptNo,
        items: validItems,
        totalRefundAmount,
        refundPaymentMethod: refundMethod,
        reason: returnReason,
      });

      alert(`Refund of Rs. ${totalRefundAmount.toLocaleString()} completed successfully.`);
      setReturnModalSale(null);
    } catch (err) {
      alert('Return failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsProcessingReturn(false);
    }
  };

  const filteredSales = sales.filter(
    (s) =>
      s.receiptNo.toLowerCase().includes(search.toLowerCase()) ||
      s.cashierName.toLowerCase().includes(search.toLowerCase()) ||
      (s.customerName && s.customerName.toLowerCase().includes(search.toLowerCase())) ||
      (s.customerPhone && s.customerPhone.includes(search))
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Sales & Transaction Ledger
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Audit historical customer receipts, reprint thermal bills, and process returns.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search receipt #, cashier, or customer..."
            className="w-full rounded-xl border border-neutral-300 bg-white py-2 pl-9 pr-3 text-xs text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white shadow-xs"
          />
        </div>
      </div>

      {/* Sales Table */}
      <div className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3">Receipt No</th>
                <th className="px-4 py-3">Date & Time</th>
                <th className="px-4 py-3">Cashier</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3 text-right">Net Total (Rs.)</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-neutral-400">
                    No transactions recorded yet. Complete checkouts in the POS screen to populate this ledger.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50">
                    <td className="px-4 py-3 font-mono font-bold text-neutral-900 dark:text-white">
                      {sale.receiptNo}
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px] text-neutral-500">
                      {new Date(sale.timestamp).toLocaleString('en-PK', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="px-4 py-3 font-medium text-neutral-700 dark:text-neutral-300">
                      {sale.cashierName}
                    </td>

                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                      {sale.customerName || 'Walk-in'}
                    </td>

                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                      {sale.items.length} lines
                    </td>

                    <td className="px-4 py-3 uppercase text-[10px] font-semibold text-neutral-600 dark:text-neutral-400">
                      {sale.paymentMethod}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      Rs. {sale.netTotal.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                          sale.paymentStatus === 'completed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {sale.paymentStatus}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedSaleForReceipt(sale)}
                          className="flex items-center gap-1 rounded-lg border border-neutral-300 px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 shadow-xs"
                          title="Reprint receipt"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          <span>Reprint</span>
                        </button>

                        {sale.paymentStatus === 'completed' && (
                          <button
                            onClick={() => openReturnModal(sale)}
                            className="flex items-center gap-1 rounded-lg border border-neutral-300 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 dark:border-neutral-700 dark:text-rose-400 dark:hover:bg-rose-950/40"
                            title="Process return or refund"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Return</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REPRINT RECEIPT MODAL */}
      {selectedSaleForReceipt && (
        <ReceiptModal
          sale={selectedSaleForReceipt}
          settings={settings}
          onClose={() => setSelectedSaleForReceipt(null)}
          onNewSale={() => setSelectedSaleForReceipt(null)}
        />
      )}

      {/* RETURN & REFUND WORKFLOW MODAL */}
      {returnModalSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4 dark:border-neutral-800">
              <div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                  Process Return & Refund
                </h2>
                <div className="text-xs text-neutral-500 font-mono">
                  Receipt #{returnModalSale.receiptNo}
                </div>
              </div>
              <button
                onClick={() => setReturnModalSale(null)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteReturn} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                  Select Items & Return Quantities
                </label>

                <div className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800 overflow-hidden">
                  {returnItems.map((item, index) => (
                    <div key={item.productId} className="p-3 bg-neutral-50/50 dark:bg-neutral-800/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-neutral-900 dark:text-white">
                            {item.name}
                          </div>
                          <div className="text-[11px] text-neutral-500">
                            Purchased: {item.maxQty} @ Rs. {item.unitPrice}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-[11px] text-neutral-500">Return Qty:</label>
                          <input
                            type="number"
                            min="0"
                            max={item.maxQty}
                            value={item.returnQty}
                            onChange={(e) => handleReturnQtyChange(index, parseFloat(e.target.value) || 0)}
                            className="w-16 rounded-lg border border-neutral-300 bg-white p-1 text-center font-mono font-bold text-neutral-900 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                          />
                        </div>
                      </div>

                      {item.returnQty > 0 && (
                        <div className="flex items-center justify-between pt-1 border-t border-neutral-200/60 dark:border-neutral-700/60">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-neutral-500">Condition:</span>
                            <select
                              value={item.condition}
                              onChange={(e) => handleReturnConditionChange(index, e.target.value as typeof item.condition)}
                              className="rounded border border-neutral-300 bg-white py-0.5 px-2 text-[11px] text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                            >
                              <option value="resalable">Resalable (Return to Stock)</option>
                              <option value="damaged">Damaged (Do Not Restock)</option>
                              <option value="expired">Expired (Write-off)</option>
                            </select>
                          </div>

                          <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            Refund: Rs. {(item.returnQty * item.unitPrice).toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Return Reason *
                </label>
                <input
                  type="text"
                  required
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-xs text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>

              {/* Total Refund Summary */}
              <div className="flex items-center justify-between rounded-xl bg-rose-50 p-3.5 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
                <div>
                  <div className="text-[10px] uppercase font-bold text-rose-800 dark:text-rose-300">
                    Total Amount to Refund
                  </div>
                  <div className="text-xl font-mono font-extrabold text-rose-900 dark:text-rose-200">
                    Rs. {totalRefundAmount.toLocaleString()}
                  </div>
                </div>
                <div className="text-right text-[11px] text-neutral-500">
                  Via {refundMethod.toUpperCase()}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setReturnModalSale(null)}
                  className="rounded-xl border border-neutral-300 px-4 py-2 font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={totalRefundAmount <= 0 || isProcessingReturn}
                  className="rounded-xl bg-rose-600 px-5 py-2 font-bold text-white hover:bg-rose-700 disabled:opacity-50 shadow-sm"
                >
                  {isProcessingReturn ? 'Processing...' : 'Authorize Refund & Update Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
