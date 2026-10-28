/**
 * Supplier Management & Vendor Ledger
 */
import React, { useState } from 'react';
import { Building2, Plus, Edit2, Search, Phone, Mail, MapPin, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Supplier } from '../../types';

export const SupplierManagement: React.FC = () => {
  const { suppliers, addSupplier, updateSupplier, products } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    openingBalance: 0,
    currentBalance: 0,
    isActive: true,
    notes: '',
  });

  const openAddModal = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      contactPerson: '',
      phone: '+92 ',
      email: '',
      address: '',
      openingBalance: 0,
      currentBalance: 0,
      isActive: true,
      notes: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (sup: Supplier) => {
    setEditingSupplier(sup);
    setFormData({
      name: sup.name,
      contactPerson: sup.contactPerson,
      phone: sup.phone,
      email: sup.email || '',
      address: sup.address || '',
      openingBalance: sup.openingBalance,
      currentBalance: sup.currentBalance,
      isActive: sup.isActive,
      notes: sup.notes || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) {
      await updateSupplier(editingSupplier.id, formData);
    } else {
      await addSupplier(formData);
    }
    setModalOpen(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Suppliers & Vendors
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage authorized distributors, procurement channels, and contact information.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((sup) => {
          const suppliedProducts = products.filter((p) => p.supplierId === sup.id);

          return (
            <div
              key={sup.id}
              className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs hover:border-emerald-500 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                        {sup.name}
                      </h3>
                      <div className="text-xs text-neutral-500">{sup.contactPerson}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => openEditModal(sup)}
                    className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-neutral-600 dark:text-neutral-300">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                    <span>{sup.phone}</span>
                  </div>
                  {sup.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                      <span className="truncate">{sup.email}</span>
                    </div>
                  )}
                  {sup.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-neutral-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{sup.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                <span className="text-neutral-500 font-medium">
                  {suppliedProducts.length} Linked Catalog Items
                </span>
                <span className="font-mono font-bold text-neutral-900 dark:text-white">
                  Bal: Rs. {sup.currentBalance.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4 dark:border-neutral-800">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                {editingSupplier ? 'Edit Supplier' : 'Register New Supplier'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Company / Distributor Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Tapal Tea Pakistan Ltd"
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Contact Person *
                </label>
                <input
                  type="text"
                  required
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="e.g. Muhammad Aslam"
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Warehouse / Office Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Industrial Area, City"
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
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
                  {editingSupplier ? 'Save Updates' : 'Add Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
