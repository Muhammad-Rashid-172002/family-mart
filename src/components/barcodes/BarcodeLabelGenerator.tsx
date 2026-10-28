/**
 * Barcode Label Generator & Thermal Printing Component using JSBarcode
 */
import React, { useState, useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Barcode as BarcodeIcon, Printer, Search, Check, RefreshCw, LayoutGrid } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';

export const BarcodeLabelGenerator: React.FC = () => {
  const { products, settings } = useStore();
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [labelQuantity, setLabelQuantity] = useState<number>(12);
  const [layoutMode, setLayoutMode] = useState<'a4_sheet' | 'shelf_edge' | 'sticker_roll'>('a4_sheet');
  const [searchFilter, setSearchFilter] = useState('');
  const [includePrice, setIncludePrice] = useState(true);
  const [includeStoreName, setIncludeStoreName] = useState(true);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // Render SVG barcodes with JSBarcode
  useEffect(() => {
    if (!selectedProduct) return;
    const code = selectedProduct.barcode || selectedProduct.sku;

    // Use querySelectorAll to render on all barcode SVGs in the preview
    const svgElements = document.querySelectorAll('.barcode-svg-target');
    svgElements.forEach((el) => {
      try {
        JsBarcode(el, code, {
          format: 'CODE128',
          width: 1.4,
          height: 38,
          displayValue: true,
          font: 'monospace',
          fontSize: 10,
          margin: 4,
          background: 'transparent',
          lineColor: '#000000',
        });
      } catch (err) {
        console.warn('JSBarcode error:', err);
      }
    });
  }, [selectedProduct, labelQuantity, layoutMode, includePrice, includeStoreName]);

  const handlePrint = () => {
    window.print();
  };

  const filteredProducts = products.filter(
    (p) =>
      p.isActive &&
      (p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.barcode.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Barcode Labels & Tags
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Generate and print scannable retail barcode labels with Family Mart branding for packaged and loose items.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 shadow-sm"
        >
          <Printer className="h-4 w-4" />
          <span>Print Barcode Sheet</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-4 space-y-4">
          {/* Select Product */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs">
            <h2 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-2">
              Select Product
            </h2>

            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter by name or SKU..."
                className="w-full rounded-lg border border-neutral-300 bg-neutral-50 py-1.5 pl-8 pr-3 text-xs text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
            </div>

            <div className="max-h-52 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProductId(p.id)}
                  className={`flex w-full items-center justify-between py-2 px-2 rounded-lg text-left text-xs transition-colors ${
                    selectedProductId === p.id
                      ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold'
                      : 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
                  }`}
                >
                  <div className="truncate mr-2">
                    <div className="truncate">{p.name}</div>
                    <div className="text-[10px] text-neutral-500 font-mono">
                      SKU: {p.sku} · Barcode: {p.barcode}
                    </div>
                  </div>
                  <div className="font-mono text-xs font-bold shrink-0">
                    Rs. {p.sellingPrice}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Layout Configuration */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              Label Format & Layout
            </h2>

            <div>
              <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Print Format
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {[
                  { id: 'a4_sheet', label: 'A4 Sheet (24-up)' },
                  { id: 'shelf_edge', label: 'Shelf Tag (50x30mm)' },
                  { id: 'sticker_roll', label: 'Thermal Roll' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setLayoutMode(mode.id as typeof layoutMode)}
                    className={`rounded-lg border p-2 text-center text-[11px] font-medium transition-colors ${
                      layoutMode === mode.id
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-300 font-bold'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Number of Labels to Print
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={labelQuantity}
                onChange={(e) => setLabelQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2 text-xs font-mono font-medium text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeStoreName}
                  onChange={(e) => setIncludeStoreName(e.target.checked)}
                  className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-neutral-700 dark:text-neutral-300">
                  Include "{settings.storeName}" Header
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePrice}
                  onChange={(e) => setIncludePrice(e.target.checked)}
                  className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-neutral-700 dark:text-neutral-300">
                  Include Retail Selling Price (Rs.)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Live Printable Preview Canvas */}
        <div className="lg:col-span-8">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 shadow-xs">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <BarcodeIcon className="h-4 w-4 text-emerald-600" />
                <h2 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  Live Print Preview ({labelQuantity} label{labelQuantity !== 1 ? 's' : ''})
                </h2>
              </div>
              <span className="text-xs text-neutral-500 font-mono">
                Code: {selectedProduct?.barcode || selectedProduct?.sku}
              </span>
            </div>

            {/* Print Container */}
            <div
              id="thermal-receipt"
              className={`p-4 bg-neutral-100 dark:bg-neutral-950 rounded-xl overflow-x-auto ${
                layoutMode === 'a4_sheet'
                  ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'
                  : layoutMode === 'shelf_edge'
                  ? 'flex flex-wrap gap-4'
                  : 'flex flex-col items-center gap-3'
              }`}
            >
              {Array.from({ length: labelQuantity }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white text-black p-2.5 rounded-lg border border-neutral-300 shadow-xs flex flex-col items-center justify-between text-center select-none"
                  style={{
                    width: layoutMode === 'shelf_edge' ? '200px' : '175px',
                    minHeight: '115px',
                  }}
                >
                  {includeStoreName && (
                    <div className="text-[10px] font-extrabold uppercase tracking-wide text-neutral-900 border-b border-neutral-200 w-full pb-0.5">
                      {settings.storeName}
                    </div>
                  )}

                  <div className="text-[11px] font-bold text-neutral-900 line-clamp-1 mt-1">
                    {selectedProduct?.name}
                  </div>

                  <div className="w-full flex justify-center py-1">
                    <svg className="barcode-svg-target" />
                  </div>

                  <div className="w-full flex items-center justify-between border-t border-neutral-200 pt-1 text-[10px]">
                    <span className="font-mono text-neutral-600">
                      {selectedProduct?.sku}
                    </span>
                    {includePrice && (
                      <span className="font-extrabold font-mono text-neutral-900 text-xs">
                        Rs. {selectedProduct?.sellingPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
