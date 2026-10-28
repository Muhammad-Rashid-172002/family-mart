/**
 * Production Cashier POS Screen for Family Mart
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  Percent,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  RotateCcw,
  PauseCircle,
  PlayCircle,
  AlertCircle,
  Scale,
  Sparkles,
  Check,
  X,
  Keyboard,
  User,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { Product, PaymentMethod, CartItem, Sale, Customer } from '../../types';
import { ReceiptModal } from './ReceiptModal';

interface POSScreenProps {
  soundEnabled: boolean;
  onNavigate?: (tab: string) => void;
}

export const POSScreen: React.FC<POSScreenProps> = ({ soundEnabled, onNavigate }) => {
  const { currentUser } = useAuth();
  const {
    products,
    categories,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    updateItemDiscount,
    transactionDiscount,
    setTransactionDiscount,
    clearCart,
    parkSale,
    resumeSale,
    heldSales,
    checkout,
    settings,
    findProductByBarcodeOrSku,
    customers,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [weightModalProduct, setWeightModalProduct] = useState<Product | null>(null);
  const [weightInput, setWeightInput] = useState<string>('1.00');
  const [itemDiscountModalProduct, setItemDiscountModalProduct] = useState<CartItem | null>(null);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<string>('10');
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [parkModalOpen, setParkModalOpen] = useState(false);
  const [parkLabel, setParkLabel] = useState('');
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [unknownBarcodeScanned, setUnknownBarcodeScanned] = useState<string | null>(null);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [saleNotes, setSaleNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Audio Beep Feedback via Web Audio API
  const playBeep = useCallback(
    (type: 'success' | 'error' = 'success') => {
      if (!soundEnabled) return;
      try {
        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'success') {
          osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch crisp beep
          gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.08);
        } else {
          osc.frequency.setValueAtTime(220, audioCtx.currentTime); // Low buzz for error
          gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.2);
        }
      } catch (e) {
        // AudioContext might be restricted until user interaction
      }
    },
    [soundEnabled]
  );

  // Auto-focus barcode input
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, [checkoutModalOpen, weightModalProduct]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
        barcodeInputRef.current?.select();
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0) setParkModalOpen(true);
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0 && confirm('Clear current customer cart?')) {
          clearCart();
        }
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0) {
          const sub = cart.reduce((sum, item) => sum + item.lineTotal, 0);
          const net = Math.max(0, sub - transactionDiscount);
          setCashTendered(net.toString());
          setCheckoutModalOpen(true);
        }
      } else if (e.key === 'Escape') {
        if (checkoutModalOpen) setCheckoutModalOpen(false);
        if (weightModalProduct) setWeightModalProduct(null);
        if (itemDiscountModalProduct) setItemDiscountModalProduct(null);
        if (parkModalOpen) setParkModalOpen(false);
        if (resumeModalOpen) setResumeModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, transactionDiscount, checkoutModalOpen, weightModalProduct, itemDiscountModalProduct, parkModalOpen, resumeModalOpen, clearCart]);

  // Scan or SKU lookup submission
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const queryStr = barcodeInput.trim();
    if (!queryStr) return;

    const matchedProduct = findProductByBarcodeOrSku(queryStr);

    if (matchedProduct) {
      if (matchedProduct.isWeightBased) {
        setWeightModalProduct(matchedProduct);
        setWeightInput('1.00');
      } else {
        const added = addToCart(matchedProduct, 1);
        if (added) {
          playBeep('success');
          setScanMessage({ text: `Added: ${matchedProduct.name}`, type: 'success' });
        } else {
          playBeep('error');
          setScanMessage({ text: `Insufficient stock for ${matchedProduct.name}`, type: 'error' });
        }
      }
    } else {
      playBeep('error');
      setUnknownBarcodeScanned(queryStr);
    }

    setBarcodeInput('');
    setTimeout(() => setScanMessage(null), 3000);
  };

  // Click on product card
  const handleProductCardClick = (product: Product) => {
    if (product.isWeightBased) {
      setWeightModalProduct(product);
      setWeightInput('1.00');
    } else {
      const added = addToCart(product, 1);
      if (added) {
        playBeep('success');
      } else {
        playBeep('error');
        alert(`Cannot add ${product.name}: stock level is ${product.currentStock} ${product.unit}.`);
      }
    }
  };

  // Submit weight-based addition
  const handleWeightConfirm = () => {
    if (!weightModalProduct) return;
    const qty = parseFloat(weightInput);
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid weight / quantity');
      return;
    }

    const added = addToCart(weightModalProduct, qty);
    if (added) {
      playBeep('success');
      setWeightModalProduct(null);
    } else {
      playBeep('error');
      alert(`Insufficient stock. Current stock: ${weightModalProduct.currentStock} ${weightModalProduct.unit}`);
    }
  };

  // Submit line item discount
  const handleDiscountConfirm = () => {
    if (!itemDiscountModalProduct) return;
    const val = parseFloat(discountValue) || 0;
    updateItemDiscount(itemDiscountModalProduct.product.id, discountType, val);
    setItemDiscountModalProduct(null);
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
  const totalItemDiscounts = cart.reduce((sum, item) => sum + item.lineDiscount, 0);
  const netPayable = Math.max(0, subtotal - transactionDiscount);
  const taxAmount = settings.taxRate > 0 ? (netPayable * settings.taxRate) / 100 : 0;
  const finalTotal = netPayable + taxAmount;
  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - finalTotal);

  // Commit Checkout
  const handleFinalCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'cash' && tenderedNum < finalTotal) {
      alert(`Insufficient cash tendered. Total payable is Rs. ${finalTotal.toLocaleString()}`);
      return;
    }

    if (paymentMethod === 'store_credit') {
      if (!selectedCustomer) {
        alert('Please select or create a registered customer profile for store credit / khata billing.');
        return;
      }
      const limit = selectedCustomer.creditLimit || 5000;
      const remainingCredit = Math.max(0, limit - selectedCustomer.creditBalance);
      if (finalTotal > remainingCredit) {
        const proceed = confirm(
          `Customer credit warning: Sale amount (Rs. ${finalTotal.toLocaleString()}) exceeds remaining credit of Rs. ${remainingCredit.toLocaleString()} (Credit limit: Rs. ${limit.toLocaleString()}). Authorize store credit override?`
        );
        if (!proceed) return;
      }
    }

    setIsSubmitting(true);
    try {
      const completed = await checkout({
        paymentMethod,
        amountReceived: paymentMethod === 'cash' ? tenderedNum : finalTotal,
        transactionDiscount,
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer ? selectedCustomer.name : (customerName.trim() || undefined),
        customerPhone: selectedCustomer ? selectedCustomer.phone : (customerPhone.trim() || undefined),
        notes: saleNotes.trim() || undefined,
      });

      playBeep('success');
      setCheckoutModalOpen(false);
      setActiveReceiptSale(completed);
      // Reset checkout inputs
      setCashTendered('');
      setSelectedCustomer(null);
      setCustomerName('');
      setCustomerPhone('');
      setSaleNotes('');
    } catch (err) {
      playBeep('error');
      alert('Failed to complete sale: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (!p.isActive) return false;
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesQuery =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const quickProducts = products.filter((p) => p.isActive && p.isQuickProduct);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row overflow-hidden bg-neutral-100 dark:bg-neutral-950">
      {/* LEFT SECTION: Search, Categories, Quick Items, Catalog Grid */}
      <div className="flex flex-1 flex-col overflow-hidden p-3 sm:p-4 space-y-3">
        {/* Top Control Bar: Barcode Input & Search */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 bg-white dark:bg-neutral-900 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
          {/* Barcode Scanner Input */}
          <form onSubmit={handleBarcodeSubmit} className="md:col-span-5 relative">
            <div className="relative flex items-center">
              <Barcode className="absolute left-3 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan barcode or enter SKU [F2]..."
                className="w-full rounded-lg border border-neutral-300 bg-neutral-50 py-2 pl-9 pr-14 text-xs font-mono font-medium text-neutral-900 placeholder:text-neutral-600 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:bg-neutral-900"
              />
              <button
                type="submit"
                className="absolute right-1.5 rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 transition-colors"
              >
                Enter
              </button>
            </div>
          </form>

          {/* Product Keyword Search */}
          <div className="md:col-span-5 relative">
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-4 w-4 text-neutral-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name or brand..."
                className="w-full rounded-lg border border-neutral-300 bg-neutral-50 py-2 pl-9 pr-3 text-xs text-neutral-900 placeholder:text-neutral-600 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:bg-neutral-900"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Actions (Held bills / shortcuts) */}
          <div className="md:col-span-2 flex items-center justify-end gap-1.5">
            {heldSales.length > 0 && (
              <button
                onClick={() => setResumeModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600 shadow-xs transition-colors"
                title="Resume a parked transaction"
              >
                <PlayCircle className="h-4 w-4" />
                <span>Resume ({heldSales.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Scan Status Toast Banner */}
        {scanMessage && (
          <div
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium animate-in fade-in duration-150 ${
              scanMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {scanMessage.type === 'success' ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600" />
              )}
              <span>{scanMessage.text}</span>
            </div>
            <button onClick={() => setScanMessage(null)} className="text-neutral-400 hover:text-neutral-600">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Quick Products Bar (Shopping bag, sugar, rice, milk, tea) */}
        {quickProducts.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                <Sparkles className="h-3 w-3 text-amber-500" />
                <span>Quick Grocery Items (1-Click Add)</span>
              </div>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {quickProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleProductCardClick(p)}
                  className="flex shrink-0 items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-left hover:border-emerald-500 hover:bg-emerald-50/50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-emerald-500 transition-colors group"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold">
                    {p.isWeightBased ? <Scale className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-900 dark:text-white truncate max-w-[130px]">
                      {p.name}
                    </div>
                    <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                      Rs. {p.sellingPrice.toLocaleString()}{' '}
                      <span className="text-[10px] text-neutral-500">/{p.unit}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              selectedCategory === 'all'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'bg-white text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
            }`}
          >
            All Items ({products.filter((p) => p.isActive).length})
          </button>
          {categories
            .filter((c) => c.isActive)
            .map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'bg-white text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filteredProducts.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white p-6 text-center dark:border-neutral-800 dark:bg-neutral-900">
              <Search className="h-8 w-8 text-neutral-400 mb-2" />
              <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                No matching products found
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                Try searching by different name, SKU, or clear your category filter.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.currentStock <= 0;
                const isLowStock = product.currentStock <= (settings.lowStockThreshold || 10);

                return (
                  <button
                    key={product.id}
                    onClick={() => handleProductCardClick(product)}
                    disabled={isOutOfStock && !settings.negativeStockAllowed}
                    className={`flex flex-col justify-between rounded-xl border p-3 text-left transition-all relative group ${
                      isOutOfStock && !settings.negativeStockAllowed
                        ? 'border-neutral-200 bg-neutral-100 opacity-60 cursor-not-allowed dark:border-neutral-800 dark:bg-neutral-900'
                        : 'border-neutral-200 bg-white hover:border-emerald-500 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-emerald-500'
                    }`}
                  >
                    <div>
                      {/* Brand & Category */}
                      <div className="text-[10px] text-neutral-600 dark:text-neutral-400 font-medium truncate mb-0.5">
                        {product.brand} · {product.categoryName}
                      </div>

                      {/* Product Name */}
                      <div className="text-xs font-semibold text-neutral-900 dark:text-white line-clamp-2 leading-snug">
                        {product.name}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-end justify-between">
                      {/* Price */}
                      <div>
                        <div className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400">
                          Rs. {product.sellingPrice.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-neutral-500">
                          per {product.unit}
                        </div>
                      </div>

                      {/* Stock Indicator */}
                      <div className="text-right">
                        <span
                          className={`text-[10px] font-semibold font-mono ${
                            isOutOfStock
                              ? 'text-rose-600 dark:text-rose-400'
                              : isLowStock
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-neutral-500 dark:text-neutral-400'
                          }`}
                        >
                          {isOutOfStock ? 'OUT' : `${product.currentStock} left`}
                        </span>
                        {product.isWeightBased && (
                          <div className="flex items-center justify-end text-[9px] text-emerald-600 dark:text-emerald-400 gap-0.5">
                            <Scale className="h-2.5 w-2.5" />
                            <span>Scale</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SECTION: Active Cart & Checkout Panel */}
      <div className="w-full lg:w-96 shrink-0 flex flex-col bg-white dark:bg-neutral-900 border-t lg:border-t-0 lg:border-l border-neutral-200 dark:border-neutral-800 h-[48vh] lg:h-full">
        {/* Cart Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-neutral-900 dark:text-white">Current Cart</span>
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 tabular-nums">
              {cart.reduce((s, i) => s + i.quantity, 0)} items
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {cart.length > 0 && (
              <>
                <button
                  onClick={() => setParkModalOpen(true)}
                  className="rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 flex items-center gap-1"
                  title="Park this customer's bill [F4]"
                >
                  <PauseCircle className="h-3.5 w-3.5 text-amber-600" />
                  <span className="hidden sm:inline">Hold [F4]</span>
                </button>

                <button
                  onClick={() => {
                    if (confirm('Clear current customer cart?')) clearCart();
                  }}
                  className="rounded-lg p-1.5 text-neutral-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                  title="Clear Cart [F8]"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center text-neutral-400">
              <Barcode className="h-10 w-10 stroke-[1.5] mb-2 text-neutral-300 dark:text-neutral-700" />
              <div className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                Cart is empty
              </div>
              <div className="text-[11px] text-neutral-600 mt-1">
                Scan barcode or select an item from catalog to begin checkout.
              </div>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="flex flex-col rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 dark:border-neutral-800 dark:bg-neutral-800/60"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                      {item.product.name}
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono">
                      Rs. {item.unitPrice} / {item.product.unit}
                    </div>
                  </div>

                  {/* Line Total */}
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold font-mono text-neutral-900 dark:text-white">
                      Rs. {item.lineTotal.toLocaleString()}
                    </div>
                    {item.lineDiscount > 0 && (
                      <div className="text-[10px] text-emerald-600 font-mono">
                        - Rs. {item.lineDiscount}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quantity Controls & Line Discount Button */}
                <div className="mt-2 flex items-center justify-between border-t border-neutral-200/60 pt-2 dark:border-neutral-700/60">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        updateCartQuantity(
                          item.product.id,
                          item.product.isWeightBased
                            ? Math.max(0.1, Number((item.quantity - 0.25).toFixed(2)))
                            : item.quantity - 1
                        )
                      }
                      className="flex h-6 w-6 items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200"
                    >
                      <Minus className="h-3 w-3" />
                    </button>

                    <input
                      type="number"
                      step={item.product.isWeightBased ? '0.1' : '1'}
                      min="0.1"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) updateCartQuantity(item.product.id, val);
                      }}
                      className="w-14 rounded-md border border-neutral-300 bg-white py-0.5 text-center font-mono text-xs font-semibold text-neutral-900 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                    />

                    <button
                      onClick={() =>
                        updateCartQuantity(
                          item.product.id,
                          item.product.isWeightBased
                            ? Number((item.quantity + 0.25).toFixed(2))
                            : item.quantity + 1
                        )
                      }
                      className="flex h-6 w-6 items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <span className="text-[10px] text-neutral-500 ml-1">{item.product.unit}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setItemDiscountModalProduct(item)}
                      className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                        item.lineDiscount > 0
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300 dark:bg-neutral-700 dark:text-neutral-300'
                      }`}
                      title="Add item discount"
                    >
                      <Percent className="h-2.5 w-2.5" />
                      <span>{item.lineDiscount > 0 ? 'Discounted' : 'Disc'}</span>
                    </button>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1 text-neutral-400 hover:text-rose-600 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Financial Summary & Checkout Action */}
        <div className="border-t border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/90 space-y-2">
          {/* Subtotal */}
          <div className="flex justify-between text-xs text-neutral-600 dark:text-neutral-400">
            <span>Subtotal:</span>
            <span className="font-mono font-medium text-neutral-900 dark:text-white">
              Rs. {subtotal.toLocaleString()}
            </span>
          </div>

          {/* Item Discounts */}
          {totalItemDiscounts > 0 && (
            <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
              <span>Item Discounts:</span>
              <span className="font-mono font-medium">- Rs. {totalItemDiscounts.toLocaleString()}</span>
            </div>
          )}

          {/* Bill-Level Discount */}
          <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
            <span>Bill Discount (Rs.):</span>
            <input
              type="number"
              min="0"
              value={transactionDiscount || ''}
              onChange={(e) => setTransactionDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
              placeholder="0"
              className="w-20 rounded border border-neutral-300 bg-white px-2 py-0.5 text-right font-mono text-xs font-medium text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            />
          </div>

          {/* Tax */}
          {settings.taxRate > 0 && (
            <div className="flex justify-between text-xs text-neutral-600 dark:text-neutral-400">
              <span>Tax ({settings.taxRate}%):</span>
              <span className="font-mono font-medium">Rs. {taxAmount.toLocaleString()}</span>
            </div>
          )}

          {/* Final Net Total */}
          <div className="flex items-center justify-between border-t border-neutral-200 pt-2 dark:border-neutral-800">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
                Total Payable
              </div>
              <div className="text-xl font-extrabold font-mono text-emerald-700 dark:text-emerald-400">
                Rs. {finalTotal.toLocaleString()}
              </div>
            </div>

            <button
              onClick={() => {
                setCashTendered(finalTotal.toString());
                setCheckoutModalOpen(true);
              }}
              disabled={cart.length === 0}
              className={`flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold text-white shadow-md transition-all ${
                cart.length === 0
                  ? 'bg-neutral-400 cursor-not-allowed opacity-60'
                  : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg active:scale-98'
              }`}
            >
              <span>Pay [F9]</span>
              <span className="font-mono">Rs. {finalTotal.toLocaleString()}</span>
            </button>
          </div>
        </div>
      </div>

      {/* WEIGHT-BASED PRODUCT MODAL */}
      {weightModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Scale className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Weight-Based Entry
                  </h3>
                  <div className="text-xs text-neutral-500">{weightModalProduct.name}</div>
                </div>
              </div>
              <button onClick={() => setWeightModalProduct(null)} className="text-neutral-400 hover:text-neutral-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Enter Weight / Quantity in {weightModalProduct.unit.toUpperCase()}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    autoFocus
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2.5 font-mono text-lg font-bold text-neutral-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  />
                  <span className="absolute right-3 top-3 text-xs font-semibold text-neutral-400 uppercase">
                    {weightModalProduct.unit}
                  </span>
                </div>
              </div>

              {/* Quick weight buttons */}
              <div className="grid grid-cols-4 gap-1.5 text-xs font-medium">
                {['0.25', '0.50', '1.00', '2.00', '2.50', '5.00'].map((w) => (
                  <button
                    key={w}
                    onClick={() => setWeightInput(w)}
                    className="rounded border border-neutral-200 bg-neutral-100 py-1 text-center hover:bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                  >
                    {w} {weightModalProduct.unit}
                  </button>
                ))}
              </div>

              {/* Calculated preview */}
              <div className="rounded-lg bg-emerald-50 p-2.5 text-xs dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Unit Selling Price:</span>
                  <span className="font-mono">Rs. {weightModalProduct.sellingPrice} / {weightModalProduct.unit}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-900 dark:text-emerald-300 mt-1 text-sm">
                  <span>Line Total:</span>
                  <span className="font-mono">
                    Rs. {(Math.max(0, parseFloat(weightInput) || 0) * weightModalProduct.sellingPrice).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setWeightModalProduct(null)}
                  className="flex-1 rounded-lg border border-neutral-300 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWeightConfirm}
                  className="flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ITEM DISCOUNT MODAL */}
      {itemDiscountModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1">
              Apply Item Discount
            </h3>
            <div className="text-xs text-neutral-500 mb-3 truncate">
              {itemDiscountModalProduct.product.name}
            </div>

            <div className="space-y-3">
              <div className="flex rounded-lg border border-neutral-200 bg-neutral-100 p-1 text-xs dark:border-neutral-700 dark:bg-neutral-800">
                <button
                  onClick={() => setDiscountType('percentage')}
                  className={`flex-1 py-1 rounded-md text-center font-medium transition-colors ${
                    discountType === 'percentage'
                      ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-700 dark:text-white'
                      : 'text-neutral-500'
                  }`}
                >
                  Percentage (%)
                </button>
                <button
                  onClick={() => setDiscountType('fixed')}
                  className={`flex-1 py-1 rounded-md text-center font-medium transition-colors ${
                    discountType === 'fixed'
                      ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-700 dark:text-white'
                      : 'text-neutral-500'
                  }`}
                >
                  Fixed Rupee (Rs.)
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Discount Value
                </label>
                <input
                  type="number"
                  min="0"
                  autoFocus
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2 font-mono text-sm font-bold text-neutral-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setItemDiscountModalProduct(null)}
                  className="flex-1 rounded-lg border border-neutral-300 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDiscountConfirm}
                  className="flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Apply Discount
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PARK SALE MODAL */}
      {parkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-1">
              Park / Hold Active Bill
            </h3>
            <div className="text-xs text-neutral-500 mb-3">
              Park this transaction if customer stepped away or is fetching additional grocery items.
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Reference Note (Optional)
                </label>
                <input
                  type="text"
                  autoFocus
                  value={parkLabel}
                  onChange={(e) => setParkLabel(e.target.value)}
                  placeholder="e.g. Lady in green shalwar / Cart 3"
                  className="w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2 text-xs text-neutral-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setParkModalOpen(false)}
                  className="flex-1 rounded-lg border border-neutral-300 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await parkSale(parkLabel);
                    setParkModalOpen(false);
                    setParkLabel('');
                  }}
                  className="flex-1 rounded-lg bg-amber-600 py-2 text-xs font-semibold text-white hover:bg-amber-700"
                >
                  Park Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESUME HELD SALES MODAL */}
      {resumeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                Parked Bills ({heldSales.length})
              </h3>
              <button onClick={() => setResumeModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {heldSales.map((held) => (
                <div
                  key={held.id}
                  className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-800/60"
                >
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white">
                      {held.referenceLabel}
                    </div>
                    <div className="text-[10px] text-neutral-500">
                      {held.items.length} items · Parked {new Date(held.heldAt).toLocaleTimeString()}
                    </div>
                    <div className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                      Rs. {held.subtotal.toLocaleString()}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      resumeSale(held.id);
                      setResumeModalOpen(false);
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    <PlayCircle className="h-3.5 w-3.5" />
                    <span>Resume</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL: Payment Method & Fast Cash Suggestions */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 dark:border-neutral-800">
              <div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                  Checkout & Payment
                </h2>
                <div className="text-xs text-neutral-500">
                  Select payment method and confirm tendered amount
                </div>
              </div>
              <button
                onClick={() => setCheckoutModalOpen(false)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Total Payable Banner */}
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    Net Amount Payable
                  </div>
                  <div className="text-2xl font-extrabold font-mono text-emerald-900 dark:text-emerald-300">
                    Rs. {finalTotal.toLocaleString()}
                  </div>
                </div>
                <div className="text-right text-[11px] text-neutral-500">
                  <div>{cart.length} unique line items</div>
                  <div>Tax: Rs. {taxAmount.toLocaleString()}</div>
                </div>
              </div>

              {/* Payment Methods Grid */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
                  {[
                    { id: 'cash' as PaymentMethod, label: 'Cash', icon: Banknote },
                    { id: 'card' as PaymentMethod, label: 'Card / POS', icon: CreditCard },
                    { id: 'store_credit' as PaymentMethod, label: 'Store Credit (Khata)', icon: Users },
                    { id: 'easypaisa' as PaymentMethod, label: 'Easypaisa', icon: Smartphone },
                    { id: 'jazzcash' as PaymentMethod, label: 'JazzCash', icon: Smartphone },
                    { id: 'bank_transfer' as PaymentMethod, label: 'Bank', icon: Building },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(m.id);
                          if (m.id !== 'cash') setCashTendered(finalTotal.toString());
                        }}
                        className={`flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-200 font-bold shadow-xs ring-1 ring-emerald-500'
                            : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                        }`}
                      >
                        <Icon className="h-4 w-4 mb-1" />
                        <span className="text-[10px] leading-tight font-medium">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Store Credit (Khata) Customer Account Selector */}
              {paymentMethod === 'store_credit' && (
                <div className="space-y-3 rounded-xl bg-amber-50/70 p-3.5 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                      <span>Select Registered Customer (Khata)</span>
                    </label>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                      Store Credit Account
                    </span>
                  </div>

                  <select
                    value={selectedCustomer?.id || ''}
                    onChange={(e) => {
                      const c = customers.find((cust) => cust.id === e.target.value);
                      setSelectedCustomer(c || null);
                      if (c) {
                        setCustomerName(c.name);
                        setCustomerPhone(c.phone);
                      }
                    }}
                    className="w-full rounded-lg border border-amber-300 bg-white p-2.5 text-xs font-medium text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-amber-700 dark:bg-neutral-900 dark:text-white"
                  >
                    <option value="">-- Select Customer Account --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone}) - Outstanding: Rs. {c.creditBalance.toLocaleString()}
                      </option>
                    ))}
                  </select>

                  {selectedCustomer ? (
                    <div className="grid grid-cols-3 gap-2 rounded-lg bg-white/90 p-2.5 text-[11px] dark:bg-neutral-900/90 border border-amber-200 dark:border-amber-900">
                      <div>
                        <div className="text-neutral-500 text-[10px]">Current Balance</div>
                        <div className="font-mono font-bold text-amber-700 dark:text-amber-400">
                          Rs. {selectedCustomer.creditBalance.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-neutral-500 text-[10px]">Credit Limit</div>
                        <div className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                          Rs. {(selectedCustomer.creditLimit || 5000).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-neutral-500 text-[10px]">Remaining Available</div>
                        <div
                          className={`font-mono font-bold ${
                            Math.max(0, (selectedCustomer.creditLimit || 5000) - selectedCustomer.creditBalance) >= finalTotal
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          Rs. {Math.max(0, (selectedCustomer.creditLimit || 5000) - selectedCustomer.creditBalance).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-800 dark:text-amber-300 italic">
                      * Store credit purchases require a registered customer profile to update their credit ledger.
                    </div>
                  )}
                </div>
              )}

              {/* Cash Tendered & Fast Notes (For Cash Payment) */}
              {paymentMethod === 'cash' && (
                <div className="space-y-2 rounded-xl bg-neutral-50 p-3.5 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      Cash Received from Customer (Rs.)
                    </label>
                    <span className="text-[11px] text-neutral-500 font-mono">
                      Change Due: <strong className="text-emerald-700 dark:text-emerald-400">Rs. {changeDue.toLocaleString()}</strong>
                    </span>
                  </div>

                  <input
                    type="number"
                    autoFocus
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    placeholder="Enter cash received..."
                    className="w-full rounded-lg border border-neutral-300 bg-white p-2.5 font-mono text-lg font-bold text-neutral-900 focus:border-emerald-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-900 dark:text-white"
                  />

                  {/* Fast Pakistani Rupee Note Buttons */}
                  <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                    {[
                      { label: 'Exact', value: finalTotal },
                      { label: 'Rs. 500', value: 500 },
                      { label: 'Rs. 1,000', value: 1000 },
                      { label: 'Rs. 2,000', value: 2000 },
                      { label: 'Rs. 5,000', value: 5000 },
                      { label: 'Rs. 10,000', value: 10000 },
                    ]
                      .filter((note) => note.value >= finalTotal || note.label === 'Exact')
                      .slice(0, 5)
                      .map((note) => (
                        <button
                          key={note.label}
                          type="button"
                          onClick={() => setCashTendered(note.value.toString())}
                          className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs font-mono font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200"
                        >
                          {note.label}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Optional Customer Information */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    Customer Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Walk-in Customer"
                    className="w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2 text-xs text-neutral-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2 text-xs text-neutral-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setCheckoutModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl border border-neutral-300 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  Back to POS
                </button>

                <button
                  type="button"
                  onClick={handleFinalCheckout}
                  disabled={isSubmitting || (paymentMethod === 'cash' && tenderedNum < finalTotal)}
                  className={`flex-1 rounded-xl py-2.5 text-xs font-bold text-white shadow-md transition-all ${
                    isSubmitting || (paymentMethod === 'cash' && tenderedNum < finalTotal)
                      ? 'bg-neutral-400 cursor-not-allowed opacity-60'
                      : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98'
                  }`}
                >
                  {isSubmitting ? 'Committing Sale...' : 'Confirm & Complete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UNKNOWN BARCODE DIALOG (Section 8.E) */}
      {unknownBarcodeScanned && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Barcode Not Registered
                </h3>
                <div className="text-xs text-neutral-500">Unrecognized Item Scan</div>
              </div>
            </div>

            <div className="rounded-xl bg-neutral-100 dark:bg-neutral-800/80 p-3 mb-4">
              <div className="text-[11px] text-neutral-500 font-medium">Scanned Code / Barcode:</div>
              <div className="font-mono text-sm font-bold text-neutral-900 dark:text-white mt-0.5 tracking-wider">
                {unknownBarcodeScanned}
              </div>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-5">
              Barcode not registered. Search for the product or ask an authorized user to register it.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setUnknownBarcodeScanned(null);
                  barcodeInputRef.current?.focus();
                }}
                className="w-full sm:w-auto flex-1 rounded-xl border border-neutral-300 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  setUnknownBarcodeScanned(null);
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="w-full sm:w-auto flex-1 rounded-xl bg-neutral-800 py-2.5 text-xs font-semibold text-white hover:bg-neutral-900 shadow-sm"
              >
                Search Product
              </button>

              {['owner', 'manager', 'inventory_staff'].includes(currentUser?.role || '') && (
                <button
                  type="button"
                  onClick={() => {
                    setUnknownBarcodeScanned(null);
                    onNavigate?.('products');
                  }}
                  className="w-full sm:w-auto flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm"
                >
                  Register Product
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* COMPLETED SALE RECEIPT MODAL */}
      {activeReceiptSale && (
        <ReceiptModal
          sale={activeReceiptSale}
          settings={settings}
          onClose={() => setActiveReceiptSale(null)}
          onNewSale={() => {
            setActiveReceiptSale(null);
            barcodeInputRef.current?.focus();
          }}
        />
      )}
    </div>
  );
};
