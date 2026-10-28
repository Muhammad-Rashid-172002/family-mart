/**
 * Purchases Procurement & Goods Receiving Workflow
 */
import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  Check,
  X,
  Clock,
  Printer,
  PackageCheck,
  Building2,
  Trash2,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Purchase, PurchaseItem } from '../../types';

export const PurchaseManagement: React.FC = () => {
  const { purchases, suppliers, products, addPurchase, receivePurchase, settings } = useStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [notes, setNotes] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [itemQty, setItemQty] = useState<number>(10);
  const [itemPackagingType, setItemPackagingType] = useState<'carton' | 'box' | 'unit'>('carton');
  const [itemPackSizeMultiplier, setItemPackSizeMultiplier] = useState<number>(24);
  const [itemUnitCost, setItemUnitCost] = useState<number>(100);
  const [search, setSearch] = useState('');
  const [viewingPO, setViewingPO] = useState<Purchase | null>(null);

  const openNewPOModal = () => {
    setSelectedSupplierId(suppliers[0]?.id || '');
    setPurchaseItems([]);
    setNotes('');
    if (products[0]) {
      setSelectedProductId(products[0].id);
      setItemUnitCost(products[0].purchaseCost);
      setItemQty(10);
      setItemPackagingType('carton');
      setItemPackSizeMultiplier(24);
    }
    setModalOpen(true);
  };

  const handleAddItemToPO = () => {
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    const mult = itemPackagingType === 'unit' ? 1 : Math.max(1, itemPackSizeMultiplier);
    const lineTotal = itemQty * itemUnitCost;
    setPurchaseItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        name: prod.name,
        sku: prod.sku,
        quantity: itemQty,
        packagingType: itemPackagingType,
        packSizeMultiplier: mult,
        totalUnitsReceived: itemQty * mult,
        unitCost: itemUnitCost,
        lineTotal,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setPurchaseItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalAmount = purchaseItems.reduce((sum, item) => sum + item.lineTotal, 0);

  const handleSubmitPO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (purchaseItems.length === 0) {
      alert('Please add at least one product to the purchase order.');
      return;
    }

    const sup = suppliers.find((s) => s.id === selectedSupplierId);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const poNumber = `PO-${dateStr}-${Math.floor(100 + Math.random() * 900)}`;

    await addPurchase({
      purchaseOrderNo: poNumber,
      supplierId: selectedSupplierId,
      supplierName: sup?.name || 'General Supplier',
      status: 'pending',
      items: purchaseItems,
      totalAmount,
      amountPaid: totalAmount, // Paid upfront or on delivery
      paymentStatus: 'paid',
      paymentMethod: 'Bank Transfer',
      notes,
    });

    setModalOpen(false);
  };

  const filteredPurchases = purchases.filter(
    (po) =>
      po.purchaseOrderNo.toLowerCase().includes(search.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Purchases & Goods Receiving
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Create supplier procurement orders and receive stock into inventory ledger.
          </p>
        </div>

        <button
          onClick={openNewPOModal}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>New Purchase Order</span>
        </button>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter purchase orders..."
              className="w-full rounded-xl border border-neutral-300 bg-neutral-50 py-1.5 pl-8 pr-3 text-xs text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            />
          </div>
          <span className="text-xs text-neutral-500 font-medium">
            {purchases.length} Purchase Orders
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3">PO Number</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Created Date</th>
                <th className="px-4 py-3">Items Count</th>
                <th className="px-4 py-3 text-right">Total Amount (Rs.)</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    No purchase orders recorded yet.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((po) => (
                  <tr key={po.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50">
                    <td className="px-4 py-3 font-mono font-bold text-neutral-900 dark:text-white">
                      {po.purchaseOrderNo}
                    </td>

                    <td className="px-4 py-3 font-medium text-neutral-800 dark:text-neutral-200">
                      {po.supplierName}
                    </td>

                    <td className="px-4 py-3 text-neutral-500 font-mono text-[11px]">
                      {new Date(po.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                      {po.items.length} line item{po.items.length !== 1 ? 's' : ''}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-neutral-900 dark:text-white">
                      Rs. {po.totalAmount.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                          po.status === 'received'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : po.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-neutral-200 text-neutral-700'
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {po.status === 'pending' && (
                          <button
                            onClick={() => receivePurchase(po.id)}
                            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs"
                          >
                            <PackageCheck className="h-3.5 w-3.5" />
                            <span>Receive Goods</span>
                          </button>
                        )}
                        <button
                          onClick={() => setViewingPO(po)}
                          className="rounded-lg border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300"
                        >
                          View PO
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Order Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4 dark:border-neutral-800">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Create Purchase Order
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPO} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Supplier *
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-xs text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.contactPerson})
                    </option>
                  ))}
                </select>
              </div>

              {/* Add item to PO bar */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-800/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Add Item to Order
                  </div>
                  <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                    Calculated Intake:{' '}
                    <strong>
                      {itemQty} {itemPackagingType}{itemQty > 1 ? 's' : ''} ×{' '}
                      {itemPackagingType === 'unit' ? 1 : itemPackSizeMultiplier} ={' '}
                      {itemQty * (itemPackagingType === 'unit' ? 1 : itemPackSizeMultiplier)} base units
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] text-neutral-500 mb-0.5">Product</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => {
                        setSelectedProductId(e.target.value);
                        const p = products.find((prod) => prod.id === e.target.value);
                        if (p) setItemUnitCost(p.purchaseCost);
                      }}
                      className="w-full rounded-lg border border-neutral-300 bg-white p-2 text-xs text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (SKU: {p.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-neutral-500 mb-0.5">Packaging</label>
                    <select
                      value={itemPackagingType}
                      onChange={(e) => setItemPackagingType(e.target.value as 'carton' | 'box' | 'unit')}
                      className="w-full rounded-lg border border-neutral-300 bg-white p-2 text-xs text-neutral-900 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    >
                      <option value="carton">Carton</option>
                      <option value="box">Box</option>
                      <option value="unit">Single Unit</option>
                    </select>
                  </div>

                  {itemPackagingType !== 'unit' && (
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] text-neutral-500 mb-0.5">Units / Pack</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Pack Size"
                        value={itemPackSizeMultiplier}
                        onChange={(e) => setItemPackSizeMultiplier(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full rounded-lg border border-neutral-300 bg-white p-2 font-mono text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                      />
                    </div>
                  )}

                  <div className={itemPackagingType !== 'unit' ? 'sm:col-span-1' : 'sm:col-span-2'}>
                    <label className="block text-[10px] text-neutral-500 mb-0.5">Order Qty</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={itemQty}
                      onChange={(e) => setItemQty(parseFloat(e.target.value) || 1)}
                      className="w-full rounded-lg border border-neutral-300 bg-white p-2 font-mono text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-end gap-1.5">
                    <div className="flex-1">
                      <label className="block text-[10px] text-neutral-500 mb-0.5">Cost (Rs.)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Cost"
                        value={itemUnitCost}
                        onChange={(e) => setItemUnitCost(parseFloat(e.target.value) || 0)}
                        className="w-full rounded-lg border border-neutral-300 bg-white p-2 font-mono text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddItemToPO}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 shrink-0 mb-0.5 shadow-xs"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="border rounded-xl border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-800 text-[10px] uppercase font-bold text-neutral-500">
                    <tr>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2 text-center">Packaging & Multiplier</th>
                      <th className="px-3 py-2 text-center">Base Units Intake</th>
                      <th className="px-3 py-2 text-right">Cost</th>
                      <th className="px-3 py-2 text-right">Line Total</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {purchaseItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-neutral-400">
                          No items added to order yet.
                        </td>
                      </tr>
                    ) : (
                      purchaseItems.map((item, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 font-semibold text-neutral-900 dark:text-white">
                            {item.name}
                          </td>
                          <td className="px-3 py-2 text-center font-mono text-neutral-600 dark:text-neutral-300">
                            {item.quantity} {item.packagingType || 'carton'}{item.quantity > 1 ? 's' : ''}{' '}
                            ({item.packSizeMultiplier || 1} units/pk)
                          </td>
                          <td className="px-3 py-2 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            {item.totalUnitsReceived || item.quantity * (item.packSizeMultiplier || 1)} units
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-neutral-600">
                            Rs. {item.unitCost}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-neutral-900 dark:text-white">
                            Rs. {item.lineTotal.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-neutral-400 hover:text-rose-600"
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

              {/* Total Banner */}
              <div className="flex justify-between items-center rounded-xl bg-neutral-50 p-3 dark:bg-neutral-800/60 text-xs">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                  Total Order Amount:
                </span>
                <span className="font-mono text-base font-bold text-emerald-700 dark:text-emerald-400">
                  Rs. {totalAmount.toLocaleString()}
                </span>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={purchaseItems.length === 0}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-sm"
                >
                  Submit Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View PO Detail Modal */}
      {viewingPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4 dark:border-neutral-800">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Purchase Order #{viewingPO.purchaseOrderNo}
                </h3>
                <div className="text-xs text-neutral-500">Supplier: {viewingPO.supplierName}</div>
              </div>
              <button onClick={() => setViewingPO(null)} className="text-neutral-400 hover:text-neutral-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500">Order Status:</span>
                <span className="capitalize font-bold text-emerald-600">{viewingPO.status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500">Created Date:</span>
                <span className="font-mono">{new Date(viewingPO.createdAt).toLocaleString()}</span>
              </div>
              {viewingPO.receivedAt && (
                <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                  <span className="text-neutral-500">Received Date:</span>
                  <span className="font-mono">{new Date(viewingPO.receivedAt).toLocaleString()}</span>
                </div>
              )}

              <div className="font-bold pt-2">Ordered Products:</div>
              <div className="border rounded-lg overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800">
                {viewingPO.items.map((it, i) => (
                  <div key={i} className="flex justify-between p-2">
                    <div>
                      <div className="font-semibold">{it.name}</div>
                      <div className="text-[10px] text-neutral-500">{it.quantity} units @ Rs. {it.unitCost}</div>
                    </div>
                    <div className="font-mono font-bold text-right">
                      Rs. {it.lineTotal.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-2 text-sm font-bold">
                <span>Total Amount:</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400">
                  Rs. {viewingPO.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-neutral-200 dark:border-neutral-800 mt-4">
              <button
                onClick={() => setViewingPO(null)}
                className="rounded-xl border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
