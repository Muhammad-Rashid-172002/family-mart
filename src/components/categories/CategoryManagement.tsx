/**
 * Category Classification Management
 */
import React, { useState } from 'react';
import { Layers, Plus, Edit2, Check, X, Search } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Category } from '../../types';

export const CategoryManagement: React.FC = () => {
  const { categories, addCategory, updateCategory, products } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState(true);

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setDisplayOrder(categories.length + 1);
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setDisplayOrder(cat.displayOrder);
    setIsActive(cat.isActive);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalSlug = slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (editingCategory) {
      await updateCategory(editingCategory.id, {
        name,
        slug: finalSlug,
        description,
        displayOrder,
        isActive,
      });
    } else {
      await addCategory({
        name,
        slug: finalSlug,
        description,
        displayOrder,
        isActive,
      });
    }
    setModalOpen(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Product Categories
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Organize retail departments, shelves, and quick navigation groups ({categories.length} categories)
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add Category</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {categories.map((cat) => {
          const productCount = products.filter((p) => p.categoryId === cat.id && p.isActive).length;

          return (
            <div
              key={cat.id}
              className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs hover:border-emerald-500 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-neutral-400">Order #{cat.displayOrder}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      cat.isActive
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-neutral-900 dark:text-white mt-1">
                  {cat.name}
                </h3>
                <p className="text-xs text-neutral-500 line-clamp-2 mt-1">
                  {cat.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  {productCount} Products
                </span>

                <button
                  onClick={() => openEditModal(cat)}
                  className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
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
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingCategory) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }
                  }}
                  placeholder="e.g. Dairy & Eggs"
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-xs text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 font-mono text-xs text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  min="1"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 font-mono text-xs text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Items included in this department..."
                  className="w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-xs text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                    Active category visible in POS
                  </span>
                </label>
              </div>

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
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
                >
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
