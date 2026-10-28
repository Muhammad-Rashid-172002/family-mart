/**
 * Product Catalog Management with CSV Import/Export & Barcode Generator
 */
import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Download,
  Upload,
  Edit2,
  Trash2,
  Check,
  X,
  Barcode,
  Layers,
  ArrowUpDown,
  Filter,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';

export const ProductManagement: React.FC = () => {
  const { products, categories, suppliers, addProduct, updateProduct, toggleProductStatus } = useStore();

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    categoryId: categories[0]?.id || 'cat-grocery',
    brand: '',
    description: '',
    unit: 'piece',
    isWeightBased: false,
    isQuickProduct: false,
    purchaseCost: 0,
    sellingPrice: 0,
    wholesalePrice: 0,
    currentStock: 10,
    minStockLevel: 5,
    supplierId: suppliers[0]?.id || '',
    taxRate: 0,
    isDiscountEligible: true,
    expiryDate: '',
    batchNumber: '',
    isActive: true,
  });

  const openAddModal = () => {
    setEditingProduct(null);
    const randomSkuNum = Math.floor(1000 + Math.random() * 9000);
    setFormData({
      name: '',
      sku: `FM-SKU-${randomSkuNum}`,
      barcode: `896${Math.floor(100000000 + Math.random() * 900000000)}`,
      categoryId: categories[0]?.id || 'cat-grocery',
      brand: 'Family Mart',
      description: '',
      unit: 'piece',
      isWeightBased: false,
      isQuickProduct: false,
      purchaseCost: 100,
      sellingPrice: 120,
      wholesalePrice: 110,
      currentStock: 25,
      minStockLevel: 10,
      supplierId: suppliers[0]?.id || '',
      taxRate: 0,
      isDiscountEligible: true,
      expiryDate: '',
      batchNumber: '',
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      sku: prod.sku,
      barcode: prod.barcode,
      categoryId: prod.categoryId,
      brand: prod.brand,
      description: prod.description || '',
      unit: prod.unit,
      isWeightBased: prod.isWeightBased,
      isQuickProduct: prod.isQuickProduct,
      purchaseCost: prod.purchaseCost,
      sellingPrice: prod.sellingPrice,
      wholesalePrice: prod.wholesalePrice || 0,
      currentStock: prod.currentStock,
      minStockLevel: prod.minStockLevel,
      supplierId: prod.supplierId || '',
      taxRate: prod.taxRate,
      isDiscountEligible: prod.isDiscountEligible,
      expiryDate: prod.expiryDate || '',
      batchNumber: prod.batchNumber || '',
      isActive: prod.isActive,
    });
    setModalOpen(true);
  };

  const generateInternalBarcode = () => {
    const internalBarcode = `896${Math.floor(100000000 + Math.random() * 900000000)}`;
    setFormData((prev) => ({ ...prev, barcode: internalBarcode }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const category = categories.find((c) => c.id === formData.categoryId);
    const supplier = suppliers.find((s) => s.id === formData.supplierId);

    const payload = {
      ...formData,
      categoryName: category?.name || 'General',
      supplierName: supplier?.name || '',
      purchaseCost: Number(formData.purchaseCost),
      sellingPrice: Number(formData.sellingPrice),
      wholesalePrice: Number(formData.wholesalePrice),
      currentStock: Number(formData.currentStock),
      minStockLevel: Number(formData.minStockLevel),
    };

    if (editingProduct) {
      await updateProduct(editingProduct.id, payload);
    } else {
      await addProduct(payload);
    }
    setModalOpen(false);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Name',
      'SKU',
      'Barcode',
      'Category',
      'Brand',
      'Unit',
      'Cost',
      'SellingPrice',
      'CurrentStock',
      'MinStock',
      'Status',
    ];
    const rows = products.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      p.sku,
      p.barcode,
      `"${p.categoryName}"`,
      `"${p.brand}"`,
      p.unit,
      p.purchaseCost,
      p.sellingPrice,
      p.currentStock,
      p.minStockLevel,
      p.isActive ? 'Active' : 'Inactive',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FamilyMart_Products_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = products.filter((p) => {
    const matchesCategory = selectedCat === 'all' || p.categoryId === selectedCat;
    const matchesSearch =
      search === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Product Catalog
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage merchandise items, barcodes, prices, and stock thresholds ({products.length} registered SKUs)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, SKU, manufacturer barcode, or brand..."
            className="w-full rounded-xl border border-neutral-300 bg-neutral-50 py-2 pl-9 pr-3 text-xs text-neutral-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 bg-neutral-50 py-2 px-3 text-xs text-neutral-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
          >
            <option value="all">All Categories ({products.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3">Product Name & Brand</th>
                <th className="px-4 py-3">SKU / Barcode</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Cost (Rs.)</th>
                <th className="px-4 py-3 text-right">Selling (Rs.)</th>
                <th className="px-4 py-3 text-right">Current Stock</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400">
                    No products matched your search filter.
                  </td>
                </tr>
              ) : (
                filtered.map((prod) => {
                  const isLow = prod.currentStock <= prod.minStockLevel;
                  const isOut = prod.currentStock <= 0;

                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-neutral-900 dark:text-white">
                          {prod.name}
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          {prod.brand} {prod.isWeightBased && '· (Weight-based)'}{' '}
                          {prod.isQuickProduct && '· [Quick Item]'}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono">
                        <div className="text-neutral-800 dark:text-neutral-200 font-medium">
                          {prod.sku}
                        </div>
                        <div className="text-[10px] text-neutral-500">
                          {prod.barcode}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                        {prod.categoryName}
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-neutral-600 dark:text-neutral-400">
                        Rs. {prod.purchaseCost.toLocaleString()}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        Rs. {prod.sellingPrice.toLocaleString()}
                      </td>

                      <td className="px-4 py-3 text-right font-mono">
                        <span
                          className={`font-semibold ${
                            isOut
                              ? 'text-rose-600'
                              : isLow
                              ? 'text-amber-600'
                              : 'text-neutral-800 dark:text-neutral-200'
                          }`}
                        >
                          {prod.currentStock} {prod.unit}
                        </span>
                        {isLow && !isOut && (
                          <div className="text-[9px] text-amber-600">Low stock</div>
                        )}
                        {isOut && <div className="text-[9px] text-rose-600">Out of stock</div>}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleProductStatus(prod.id)}
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                            prod.isActive
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          {prod.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(prod)}
                            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-white"
                            title="Edit Product"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4 dark:border-neutral-800">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                {editingProduct ? 'Edit Product' : 'Add New Retail Product'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Product Name */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Tapal Danedar Black Tea 475g"
                    className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-xs text-neutral-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  />
                </div>

                {/* SKU */}
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Store SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 font-mono text-xs text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  />
                </div>

                {/* Barcode & Internal Generator */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                      Manufacturer Barcode / EAN-13
                    </label>
                    <button
                      type="button"
                      onClick={generateInternalBarcode}
                      className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-700"
                    >
                      Generate Internal
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="e.g. 896101100012"
                    className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 font-mono text-xs text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-xs text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Brand */}
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g. Dalda, National, Tapal"
                    className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-xs text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  />
                </div>

                {/* Unit of measure */}
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Unit of Measure
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-xs text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  >
                    <option value="piece">Piece (Pack / Item)</option>
                    <option value="kg">Kilogram (KG)</option>
                    <option value="litre">Litre (L)</option>
                    <option value="dozen">Dozen</option>
                    <option value="box">Carton / Box</option>
                  </select>
                </div>

                {/* Supplier */}
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Primary Supplier
                  </label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-xs text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  >
                    <option value="">None / Open Market</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Purchase Cost */}
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Purchase Cost (Rs.) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.purchaseCost}
                    onChange={(e) => setFormData({ ...formData, purchaseCost: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 font-mono text-xs text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  />
                </div>

                {/* Retail Selling Price */}
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Selling Price (Rs.) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 font-mono text-xs text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  />
                </div>

                {/* Current Stock */}
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Initial / Current Stock *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 font-mono text-xs text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  />
                </div>

                {/* Min Stock Alert Level */}
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStockLevel}
                    onChange={(e) => setFormData({ ...formData, minStockLevel: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 font-mono text-xs text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  />
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-xs text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  />
                </div>

                {/* Batch Number */}
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Batch / Lot Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    placeholder="e.g. B-2026-10"
                    className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 font-mono text-xs text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-neutral-200 dark:border-neutral-800 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isWeightBased}
                    onChange={(e) => setFormData({ ...formData, isWeightBased: e.target.checked })}
                    className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                    Sold by Weight / Volume (Scale Required)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isQuickProduct}
                    onChange={(e) => setFormData({ ...formData, isQuickProduct: e.target.checked })}
                    className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                    Pin to Quick Products Bar in POS
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                    Active in Catalog
                  </span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
