/**
 * Store & Inventory Core State Machine & Firestore Persistence Engine
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  Product,
  Category,
  Supplier,
  Customer,
  Sale,
  HeldSale,
  Purchase,
  InventoryMovement,
  Expense,
  ReturnRecord,
  StoreSettings,
  AuditLog,
  CartItem,
  PaymentMethod,
  MovementType,
} from '../types';
import {
  DEFAULT_STORE_SETTINGS,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_SUPPLIERS,
} from '../data/seedData';
import { useAuth } from './AuthContext';

interface CheckoutParams {
  paymentMethod: PaymentMethod;
  amountReceived: number;
  transactionDiscount: number;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
}

interface StoreContextType {
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
  categories: Category[];
  addCategory: (category: Omit<Category, 'id' | 'createdAt'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  products: Product[];
  addProduct: (prod: Omit<Product, 'id' | 'createdAt'>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  toggleProductStatus: (id: string) => Promise<void>;
  suppliers: Supplier[];
  addSupplier: (sup: Omit<Supplier, 'id' | 'createdAt'>) => Promise<void>;
  updateSupplier: (id: string, updates: Partial<Supplier>) => Promise<void>;
  customers: Customer[];
  addCustomer: (cust: Omit<Customer, 'id' | 'createdAt'>) => Promise<void>;
  repayCustomerCredit: (customerId: string, amount: number, notes?: string) => Promise<void>;
  sales: Sale[];
  heldSales: HeldSale[];
  purchases: Purchase[];
  addPurchase: (po: Omit<Purchase, 'id' | 'createdAt'>) => Promise<void>;
  receivePurchase: (purchaseId: string) => Promise<void>;
  inventoryMovements: InventoryMovement[];
  adjustStock: (productId: string, newStock: number, reason: string, movementType?: MovementType) => Promise<void>;
  expenses: Expense[];
  addExpense: (exp: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  returns: ReturnRecord[];
  processReturn: (params: {
    originalSaleId: string;
    originalReceiptNo: string;
    items: { productId: string; name: string; returnQuantity: number; unitPrice: number; refundAmount: number; condition: 'resalable' | 'damaged' | 'expired' }[];
    totalRefundAmount: number;
    refundPaymentMethod: PaymentMethod;
    reason: string;
  }) => Promise<void>;
  auditLogs: AuditLog[];
  // Active POS Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => boolean;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  updateItemDiscount: (productId: string, type: 'percentage' | 'fixed', value: number) => void;
  transactionDiscount: number;
  setTransactionDiscount: (amount: number) => void;
  clearCart: () => void;
  parkSale: (referenceLabel?: string) => Promise<void>;
  resumeSale: (heldSaleId: string) => void;
  checkout: (params: CheckoutParams) => Promise<Sale>;
  lastCompletedSale: Sale | null;
  setLastCompletedSale: (sale: Sale | null) => void;
  // Administrative Operations
  seedDemoData: () => Promise<void>;
  clearAllDemoData: () => Promise<void>;
  findProductByBarcodeOrSku: (code: string) => Product | undefined;
  isLoading: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [heldSales, setHeldSales] = useState<HeldSale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactionDiscount, setTransactionDiscount] = useState<number>(0);
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);

  // Helper to log audit events
  const logAudit = useCallback(
    async (action: string, entityType: string, entityId: string, details: string) => {
      const logEntry: AuditLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        action,
        entityType,
        entityId,
        details,
        userId: currentUser?.id || 'system',
        userName: currentUser?.displayName || 'System User',
        userRole: currentUser?.role || 'cashier',
        timestamp: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'auditLogs', logEntry.id), logEntry);
      } catch (e) {
        console.warn('Audit log write error, caching locally:', e);
      }
      setAuditLogs((prev) => [logEntry, ...prev]);
    },
    [currentUser]
  );

  // Initialize data from Firestore or use seed data
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        // Load Settings
        const settingsSnap = await getDocs(collection(db, 'storeSettings'));
        if (!settingsSnap.empty) {
          const loadedSettings = settingsSnap.docs[0].data() as StoreSettings;
          if (isMounted) setSettings(loadedSettings);
        } else {
          // Initialize default store settings in DB
          await setDoc(doc(db, 'storeSettings', 'main'), DEFAULT_STORE_SETTINGS);
        }

        // Load Categories
        const catSnap = await getDocs(collection(db, 'categories'));
        if (!catSnap.empty) {
          const list = catSnap.docs.map((d) => d.data() as Category);
          list.sort((a, b) => a.displayOrder - b.displayOrder);
          if (isMounted) setCategories(list);
        } else {
          // Seed categories
          for (const cat of INITIAL_CATEGORIES) {
            await setDoc(doc(db, 'categories', cat.id), cat);
          }
        }

        // Load Products
        const prodSnap = await getDocs(collection(db, 'products'));
        if (!prodSnap.empty) {
          const list = prodSnap.docs.map((d) => d.data() as Product);
          if (isMounted) setProducts(list);
        } else {
          // Seed products
          for (const prod of INITIAL_PRODUCTS) {
            await setDoc(doc(db, 'products', prod.id), prod);
          }
        }

        // Load Suppliers
        const supSnap = await getDocs(collection(db, 'suppliers'));
        if (!supSnap.empty) {
          const list = supSnap.docs.map((d) => d.data() as Supplier);
          if (isMounted) setSuppliers(list);
        } else {
          for (const sup of INITIAL_SUPPLIERS) {
            await setDoc(doc(db, 'suppliers', sup.id), sup);
          }
        }

        // Load Sales (Order by timestamp desc)
        const salesSnap = await getDocs(query(collection(db, 'sales'), orderBy('timestamp', 'desc'), limit(150)));
        if (!salesSnap.empty && isMounted) {
          setSales(salesSnap.docs.map((d) => d.data() as Sale));
        }

        // Load Held Sales
        const heldSnap = await getDocs(collection(db, 'heldSales'));
        if (!heldSnap.empty && isMounted) {
          setHeldSales(heldSnap.docs.map((d) => d.data() as HeldSale));
        }

        // Load Purchases
        const poSnap = await getDocs(query(collection(db, 'purchases'), orderBy('createdAt', 'desc'), limit(100)));
        if (!poSnap.empty && isMounted) {
          setPurchases(poSnap.docs.map((d) => d.data() as Purchase));
        }

        // Load Inventory Movements
        const movSnap = await getDocs(
          query(collection(db, 'inventoryMovements'), orderBy('timestamp', 'desc'), limit(200))
        );
        if (!movSnap.empty && isMounted) {
          setInventoryMovements(movSnap.docs.map((d) => d.data() as InventoryMovement));
        }

        // Load Expenses
        const expSnap = await getDocs(query(collection(db, 'expenses'), orderBy('date', 'desc'), limit(100)));
        if (!expSnap.empty && isMounted) {
          setExpenses(expSnap.docs.map((d) => d.data() as Expense));
        }

        // Load Customers
        const custSnap = await getDocs(collection(db, 'customers'));
        if (!custSnap.empty && isMounted) {
          setCustomers(custSnap.docs.map((d) => d.data() as Customer));
        }

        // Load Returns
        const retSnap = await getDocs(query(collection(db, 'returns'), orderBy('createdAt', 'desc'), limit(50)));
        if (!retSnap.empty && isMounted) {
          setReturns(retSnap.docs.map((d) => d.data() as ReturnRecord));
        }

        // Load Audit Logs
        const logsSnap = await getDocs(query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(150)));
        if (!logsSnap.empty && isMounted) {
          setAuditLogs(logsSnap.docs.map((d) => d.data() as AuditLog));
        }
      } catch (err) {
        console.warn('Initial data load completed with local cache fallback:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Barcode / SKU lookup
  const findProductByBarcodeOrSku = useCallback(
    (code: string): Product | undefined => {
      const clean = code.trim().toLowerCase();
      if (!clean) return undefined;

      return products.find(
        (p) =>
          p.isActive &&
          (p.barcode.toLowerCase() === clean ||
            p.sku.toLowerCase() === clean ||
            p.alternativeBarcodes?.some((alt) => alt.toLowerCase() === clean))
      );
    },
    [products]
  );

  // Settings update
  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    const updated = { ...settings, ...newSettings, updatedAt: new Date().toISOString() };
    setSettings(updated);
    try {
      await updateDoc(doc(db, 'storeSettings', 'main'), updated);
      await logAudit('UPDATE_SETTINGS', 'StoreSettings', 'main', 'Store configuration updated');
    } catch (e) {
      console.warn('Settings write:', e);
    }
  };

  // Categories
  const addCategory = async (catData: Omit<Category, 'id' | 'createdAt'>) => {
    const newCat: Category = {
      ...catData,
      id: `cat-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setCategories((prev) => [...prev, newCat]);
    try {
      await setDoc(doc(db, 'categories', newCat.id), newCat);
      await logAudit('CREATE_CATEGORY', 'Category', newCat.id, `Created category ${newCat.name}`);
    } catch (e) {
      console.warn('Category write:', e);
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c)));
    try {
      await updateDoc(doc(db, 'categories', id), updates);
      await logAudit('UPDATE_CATEGORY', 'Category', id, `Updated category ${id}`);
    } catch (e) {
      console.warn('Category update:', e);
    }
  };

  // Products
  const addProduct = async (prodData: Omit<Product, 'id' | 'createdAt'>): Promise<Product> => {
    const newProd: Product = {
      ...prodData,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setProducts((prev) => [newProd, ...prev]);

    try {
      await setDoc(doc(db, 'products', newProd.id), newProd);

      // Record initial inventory movement if currentStock > 0
      if (newProd.currentStock > 0) {
        const movement: InventoryMovement = {
          id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          productId: newProd.id,
          productName: newProd.name,
          sku: newProd.sku,
          quantityChange: newProd.currentStock,
          previousQuantity: 0,
          newQuantity: newProd.currentStock,
          movementType: 'adjustment',
          reason: 'Initial stock intake on product creation',
          performedBy: currentUser?.id || 'system',
          performedByName: currentUser?.displayName || 'Staff',
          timestamp: new Date().toISOString(),
        };
        await setDoc(doc(db, 'inventoryMovements', movement.id), movement);
        setInventoryMovements((prev) => [movement, ...prev]);
      }

      await logAudit('CREATE_PRODUCT', 'Product', newProd.id, `Created product ${newProd.name} (${newProd.sku})`);
    } catch (e) {
      console.warn('Product create:', e);
    }
    return newProd;
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const existing = products.find((p) => p.id === id);
    if (!existing) return;

    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));

    try {
      await updateDoc(doc(db, 'products', id), updates);

      // If price was modified, record audit
      if (updates.sellingPrice !== undefined && updates.sellingPrice !== existing.sellingPrice) {
        await logAudit(
          'UPDATE_PRICE',
          'Product',
          id,
          `Selling price of ${existing.name} changed from Rs. ${existing.sellingPrice} to Rs. ${updates.sellingPrice}`
        );
      }
      if (updates.purchaseCost !== undefined && updates.purchaseCost !== existing.purchaseCost) {
        await logAudit(
          'UPDATE_COST',
          'Product',
          id,
          `Purchase cost of ${existing.name} changed from Rs. ${existing.purchaseCost} to Rs. ${updates.purchaseCost}`
        );
      }
    } catch (e) {
      console.warn('Product update:', e);
    }
  };

  const toggleProductStatus = async (id: string) => {
    const p = products.find((item) => item.id === id);
    if (!p) return;
    const newStatus = !p.isActive;
    await updateProduct(id, { isActive: newStatus });
    await logAudit('TOGGLE_PRODUCT_STATUS', 'Product', id, `Product status changed to ${newStatus ? 'active' : 'inactive'}`);
  };

  // Suppliers
  const addSupplier = async (supData: Omit<Supplier, 'id' | 'createdAt'>) => {
    const newSup: Supplier = {
      ...supData,
      id: `sup-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setSuppliers((prev) => [...prev, newSup]);
    try {
      await setDoc(doc(db, 'suppliers', newSup.id), newSup);
      await logAudit('CREATE_SUPPLIER', 'Supplier', newSup.id, `Created supplier ${newSup.name}`);
    } catch (e) {
      console.warn('Supplier write:', e);
    }
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s)));
    try {
      await updateDoc(doc(db, 'suppliers', id), updates);
      await logAudit('UPDATE_SUPPLIER', 'Supplier', id, `Updated supplier ${id}`);
    } catch (e) {
      console.warn('Supplier update:', e);
    }
  };

  // Customers
  const addCustomer = async (custData: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCust: Customer = {
      ...custData,
      id: `cust-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => [...prev, newCust]);
    try {
      await setDoc(doc(db, 'customers', newCust.id), newCust);
      await logAudit('CREATE_CUSTOMER', 'Customer', newCust.id, `Created customer ${newCust.name}`);
    } catch (e) {
      console.warn('Customer write:', e);
    }
  };

  const repayCustomerCredit = async (customerId: string, amount: number, notes = '') => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust || amount <= 0) return;

    const newBalance = Math.max(0, cust.creditBalance - amount);
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, creditBalance: newBalance, updatedAt: new Date().toISOString() } : c))
    );

    try {
      await updateDoc(doc(db, 'customers', customerId), {
        creditBalance: newBalance,
        updatedAt: new Date().toISOString(),
      });
      await logAudit(
        'CUSTOMER_CREDIT_REPAYMENT',
        'Customer',
        customerId,
        `Credit repayment of Rs. ${amount.toLocaleString()} recorded for ${cust.name}. Remaining balance: Rs. ${newBalance.toLocaleString()}`
      );
    } catch (e) {
      console.warn('Repay credit write:', e);
    }
  };

  // Cart operations
  const addToCart = (product: Product, quantityToAdd = 1): boolean => {
    if (!product.isActive) return false;

    // Negative stock policy check
    if (!settings.negativeStockAllowed && product.currentStock <= 0) {
      return false;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);

      if (existingIndex >= 0) {
        const item = prev[existingIndex];
        const newQty = item.quantity + quantityToAdd;

        // Check stock boundary if negative stock forbidden
        if (!settings.negativeStockAllowed && newQty > product.currentStock) {
          return prev;
        }

        const discount =
          item.discountType === 'percentage'
            ? (newQty * item.unitPrice * item.discountValue) / 100
            : item.discountValue;

        const updated = [...prev];
        updated[existingIndex] = {
          ...item,
          quantity: newQty,
          lineDiscount: discount,
          lineTotal: Math.max(0, newQty * item.unitPrice - discount),
        };
        return updated;
      } else {
        const lineTotal = quantityToAdd * product.sellingPrice;
        return [
          ...prev,
          {
            product,
            quantity: quantityToAdd,
            unitPrice: product.sellingPrice,
            discountType: 'percentage',
            discountValue: 0,
            lineDiscount: 0,
            lineTotal,
          },
        ];
      }
    });

    return true;
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;
        const discount =
          item.discountType === 'percentage'
            ? (quantity * item.unitPrice * item.discountValue) / 100
            : item.discountValue;
        return {
          ...item,
          quantity,
          lineDiscount: discount,
          lineTotal: Math.max(0, quantity * item.unitPrice - discount),
        };
      })
    );
  };

  const updateItemDiscount = (productId: string, type: 'percentage' | 'fixed', value: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;
        const discount =
          type === 'percentage' ? (item.quantity * item.unitPrice * value) / 100 : value;
        return {
          ...item,
          discountType: type,
          discountValue: value,
          lineDiscount: discount,
          lineTotal: Math.max(0, item.quantity * item.unitPrice - discount),
        };
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    setTransactionDiscount(0);
  };

  // Park / Resume Held Sales
  const parkSale = async (referenceLabel = '') => {
    if (cart.length === 0) return;

    const label = referenceLabel.trim() || `Customer ${heldSales.length + 1} (${cart.length} items)`;
    const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);

    const heldItem: HeldSale = {
      id: `held-${Date.now()}`,
      referenceLabel: label,
      items: [...cart],
      subtotal,
      transactionDiscount,
      cashierId: currentUser?.id || 'cashier',
      cashierName: currentUser?.displayName || 'Cashier',
      heldAt: new Date().toISOString(),
    };

    setHeldSales((prev) => [heldItem, ...prev]);
    clearCart();

    try {
      await setDoc(doc(db, 'heldSales', heldItem.id), heldItem);
      await logAudit('HOLD_SALE', 'HeldSale', heldItem.id, `Held bill parked: "${label}" with Rs. ${subtotal}`);
    } catch (e) {
      console.warn('Park sale:', e);
    }
  };

  const resumeSale = (heldSaleId: string) => {
    const target = heldSales.find((h) => h.id === heldSaleId);
    if (!target) return;

    setCart(target.items);
    setTransactionDiscount(target.transactionDiscount || 0);
    setHeldSales((prev) => prev.filter((h) => h.id !== heldSaleId));

    deleteDoc(doc(db, 'heldSales', heldSaleId)).catch((e) => console.warn('Remove held sale:', e));
    logAudit('RESUME_SALE', 'HeldSale', heldSaleId, `Resumed parked bill: "${target.referenceLabel}"`);
  };

  // CHECKOUT: Atomic Stock Deduction, Historical Cost Snapshots, Receipt Generation
  const checkout = async ({
    paymentMethod,
    amountReceived,
    transactionDiscount: txDiscount,
    customerId,
    customerName,
    customerPhone,
    notes,
  }: CheckoutParams): Promise<Sale> => {
    if (cart.length === 0) {
      throw new Error('Cart is empty');
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const receiptNo = `FM-${dateStr}-${randomSuffix}`;
    const saleId = `sale-${Date.now()}`;

    // Calculate totals & snapshots
    let subtotal = 0;
    let itemDiscountsTotal = 0;
    let totalCost = 0;

    const saleItems = cart.map((item) => {
      subtotal += item.quantity * item.unitPrice;
      itemDiscountsTotal += item.lineDiscount;
      const costForThisLine = item.quantity * item.product.purchaseCost;
      totalCost += costForThisLine;

      return {
        productId: item.product.id,
        name: item.product.name,
        sku: item.product.sku,
        barcode: item.product.barcode,
        quantity: item.quantity,
        unit: item.product.unit,
        unitPrice: item.unitPrice,
        purchaseCost: item.product.purchaseCost, // Critical: historical cost snapshot
        lineDiscount: item.lineDiscount,
        lineTotal: item.lineTotal,
      };
    });

    const netPayable = Math.max(0, subtotal - itemDiscountsTotal - txDiscount);
    const taxTotal = settings.taxRate > 0 ? (netPayable * settings.taxRate) / 100 : 0;
    const finalNetTotal = netPayable + taxTotal;
    const changeDue = Math.max(0, amountReceived - finalNetTotal);
    const grossProfit = finalNetTotal - taxTotal - totalCost;

    const completedSale: Sale = {
      id: saleId,
      receiptNo,
      cashierId: currentUser?.id || 'cashier',
      cashierName: currentUser?.displayName || 'Cashier',
      registerId: 'REG-01',
      timestamp: now.toISOString(),
      items: saleItems,
      subtotal,
      itemDiscountsTotal,
      transactionDiscount: txDiscount,
      taxTotal,
      netTotal: finalNetTotal,
      totalCost,
      grossProfit,
      paymentMethod,
      paymentStatus: 'completed',
      amountReceived,
      changeDue,
      customerId,
      customerName: customerName || 'Walk-in Customer',
      customerPhone,
      notes,
      createdAt: now.toISOString(),
    };

    // 1. Update In-Memory Sales & Products
    setSales((prev) => [completedSale, ...prev]);
    setLastCompletedSale(completedSale);

    // 2. Atomically Deduct Product Stocks & Create Inventory Movement Records
    const newMovements: InventoryMovement[] = [];
    const updatedProductsMap = new Map<string, number>();

    setProducts((prev) =>
      prev.map((p) => {
        const soldItem = saleItems.find((s) => s.productId === p.id);
        if (!soldItem) return p;

        const previousQuantity = p.currentStock;
        const newQuantity = Number((previousQuantity - soldItem.quantity).toFixed(2));
        updatedProductsMap.set(p.id, newQuantity);

        const movement: InventoryMovement = {
          id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          quantityChange: -soldItem.quantity,
          previousQuantity,
          newQuantity,
          movementType: 'sale',
          reason: `Sale ${receiptNo}`,
          referenceId: saleId,
          performedBy: currentUser?.id || 'cashier',
          performedByName: currentUser?.displayName || 'Cashier',
          timestamp: now.toISOString(),
        };
        newMovements.push(movement);

        return { ...p, currentStock: newQuantity, updatedAt: now.toISOString() };
      })
    );

    setInventoryMovements((prev) => [...newMovements, ...prev]);
    clearCart();

    // 3. Persist to Firestore
    try {
      await setDoc(doc(db, 'sales', completedSale.id), completedSale);

      for (const [prodId, newStock] of updatedProductsMap.entries()) {
        await updateDoc(doc(db, 'products', prodId), {
          currentStock: newStock,
          updatedAt: now.toISOString(),
        });
      }

      for (const mov of newMovements) {
        await setDoc(doc(db, 'inventoryMovements', mov.id), mov);
      }

      await logAudit(
        'CHECKOUT_SALE',
        'Sale',
        completedSale.id,
        `Receipt ${receiptNo} committed: Rs. ${finalNetTotal} (${saleItems.length} items) via ${paymentMethod}`
      );

      // If paid via Store Credit / Khata, increase customer outstanding balance
      if (paymentMethod === 'store_credit' && customerId) {
        const cust = customers.find((c) => c.id === customerId);
        if (cust) {
          const newCreditBal = cust.creditBalance + finalNetTotal;
          setCustomers((prev) =>
            prev.map((c) => (c.id === customerId ? { ...c, creditBalance: newCreditBal, updatedAt: now.toISOString() } : c))
          );
          await updateDoc(doc(db, 'customers', customerId), {
            creditBalance: newCreditBal,
            updatedAt: now.toISOString(),
          });
          await logAudit(
            'STORE_CREDIT_SALE',
            'Customer',
            customerId,
            `Sale ${receiptNo} added Rs. ${finalNetTotal} to ${cust.name}'s store credit balance. Current balance: Rs. ${newCreditBal}`
          );
        }
      }
    } catch (e) {
      console.warn('Firestore checkout persistence:', e);
    }

    return completedSale;
  };

  // Manual Stock Adjustment
  const adjustStock = async (
    productId: string,
    newStock: number,
    reason: string,
    movementType: MovementType = 'adjustment'
  ) => {
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) return;

    const previousQuantity = targetProduct.currentStock;
    const quantityChange = Number((newStock - previousQuantity).toFixed(2));

    const updated = { ...targetProduct, currentStock: newStock, updatedAt: new Date().toISOString() };
    setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));

    const movement: InventoryMovement = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: targetProduct.id,
      productName: targetProduct.name,
      sku: targetProduct.sku,
      quantityChange,
      previousQuantity,
      newQuantity: newStock,
      movementType,
      reason,
      performedBy: currentUser?.id || 'staff',
      performedByName: currentUser?.displayName || 'Staff',
      timestamp: new Date().toISOString(),
    };

    setInventoryMovements((prev) => [movement, ...prev]);

    try {
      await updateDoc(doc(db, 'products', productId), {
        currentStock: newStock,
        updatedAt: new Date().toISOString(),
      });
      await setDoc(doc(db, 'inventoryMovements', movement.id), movement);
      await logAudit(
        'STOCK_ADJUSTMENT',
        'Product',
        productId,
        `Stock of ${targetProduct.name} adjusted from ${previousQuantity} to ${newStock} (${reason})`
      );
    } catch (e) {
      console.warn('Stock adjustment:', e);
    }
  };

  // Purchases & Receiving
  const addPurchase = async (poData: Omit<Purchase, 'id' | 'createdAt'>) => {
    const newPO: Purchase = {
      ...poData,
      id: `po-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setPurchases((prev) => [newPO, ...prev]);
    try {
      await setDoc(doc(db, 'purchases', newPO.id), newPO);
      await logAudit('CREATE_PURCHASE', 'Purchase', newPO.id, `Created PO ${newPO.purchaseOrderNo} for Rs. ${newPO.totalAmount}`);
    } catch (e) {
      console.warn('Purchase write:', e);
    }
  };

  const receivePurchase = async (purchaseId: string) => {
    const po = purchases.find((p) => p.id === purchaseId);
    if (!po || po.status === 'received') return;

    const now = new Date().toISOString();
    const updatedPO: Purchase = {
      ...po,
      status: 'received',
      receivedAt: now,
      receivedBy: currentUser?.displayName || 'Inventory Staff',
      updatedAt: now,
    };

    setPurchases((prev) => prev.map((p) => (p.id === purchaseId ? updatedPO : p)));

    // Increment stocks & record movements
    const newMovements: InventoryMovement[] = [];
    const stockUpdates = new Map<string, number>();

    setProducts((prev) =>
      prev.map((prod) => {
        const item = po.items.find((i) => i.productId === prod.id);
        if (!item) return prod;

        // Accurate Carton to Base Unit conversion
        const multiplier = item.packSizeMultiplier && item.packSizeMultiplier > 1 ? item.packSizeMultiplier : 1;
        const totalReceivedUnits = Number((item.quantity * multiplier).toFixed(2));

        const prevQty = prod.currentStock;
        const newQty = Number((prevQty + totalReceivedUnits).toFixed(2));
        stockUpdates.set(prod.id, newQty);

        const movement: InventoryMovement = {
          id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          quantityChange: totalReceivedUnits,
          previousQuantity: prevQty,
          newQuantity: newQty,
          movementType: 'purchase',
          reason: `Goods receipt from ${po.supplierName} (PO: ${po.purchaseOrderNo}) - ${item.quantity} ${item.packagingType || 'cartons'} x ${multiplier} = ${totalReceivedUnits} ${prod.unit}`,
          referenceId: po.id,
          performedBy: currentUser?.id || 'staff',
          performedByName: currentUser?.displayName || 'Inventory Staff',
          timestamp: now,
        };
        newMovements.push(movement);

        return { ...prod, currentStock: newQty, updatedAt: now };
      })
    );

    setInventoryMovements((prev) => [...newMovements, ...prev]);

    try {
      await updateDoc(doc(db, 'purchases', purchaseId), {
        status: 'received',
        receivedAt: now,
        receivedBy: currentUser?.displayName || 'Inventory Staff',
        updatedAt: now,
      });

      for (const [pId, newStock] of stockUpdates.entries()) {
        await updateDoc(doc(db, 'products', pId), {
          currentStock: newStock,
          updatedAt: now,
        });
      }

      for (const m of newMovements) {
        await setDoc(doc(db, 'inventoryMovements', m.id), m);
      }

      await logAudit(
        'RECEIVE_PURCHASE',
        'Purchase',
        purchaseId,
        `Goods received for ${po.purchaseOrderNo}: ${po.items.length} items added to inventory`
      );
    } catch (e) {
      console.warn('Purchase receive:', e);
    }
  };

  // Expenses
  const addExpense = async (expData: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExp: Expense = {
      ...expData,
      id: `exp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [newExp, ...prev]);
    try {
      await setDoc(doc(db, 'expenses', newExp.id), newExp);
      await logAudit('ADD_EXPENSE', 'Expense', newExp.id, `Recorded ${newExp.category} expense of Rs. ${newExp.amount}`);
    } catch (e) {
      console.warn('Expense write:', e);
    }
  };

  const deleteExpense = async (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    try {
      await deleteDoc(doc(db, 'expenses', id));
      await logAudit('DELETE_EXPENSE', 'Expense', id, `Deleted expense ${id}`);
    } catch (e) {
      console.warn('Expense delete:', e);
    }
  };

  // Returns and Refunds
  const processReturn = async ({
    originalSaleId,
    originalReceiptNo,
    items,
    totalRefundAmount,
    refundPaymentMethod,
    reason,
  }: {
    originalSaleId: string;
    originalReceiptNo: string;
    items: {
      productId: string;
      name: string;
      returnQuantity: number;
      unitPrice: number;
      refundAmount: number;
      condition: 'resalable' | 'damaged' | 'expired';
    }[];
    totalRefundAmount: number;
    refundPaymentMethod: PaymentMethod;
    reason: string;
  }) => {
    const now = new Date().toISOString();
    const returnRecord: ReturnRecord = {
      id: `ret-${Date.now()}`,
      returnNo: `RET-${Date.now().toString().slice(-6)}`,
      originalSaleId,
      originalReceiptNo,
      items: items.map((i) => ({
        ...i,
        unitCost: products.find((p) => p.id === i.productId)?.purchaseCost || 0,
      })),
      totalRefundAmount,
      refundPaymentMethod,
      reason,
      approvedBy: currentUser?.id || 'manager',
      approvedByName: currentUser?.displayName || 'Manager',
      restocked: items.some((i) => i.condition === 'resalable'),
      createdAt: now,
    };

    setReturns((prev) => [returnRecord, ...prev]);

    // Update sale status to refunded or partially_refunded
    setSales((prev) =>
      prev.map((s) => (s.id === originalSaleId ? { ...s, paymentStatus: 'refunded' } : s))
    );

    // Restock resalable items
    const newMovements: InventoryMovement[] = [];
    setProducts((prev) =>
      prev.map((prod) => {
        const item = items.find((i) => i.productId === prod.id && i.condition === 'resalable');
        if (!item) return prod;

        const prevQty = prod.currentStock;
        const newQty = Number((prevQty + item.returnQuantity).toFixed(2));

        const movement: InventoryMovement = {
          id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          quantityChange: item.returnQuantity,
          previousQuantity: prevQty,
          newQuantity: newQty,
          movementType: 'return',
          reason: `Customer return from ${originalReceiptNo} (${reason})`,
          referenceId: returnRecord.id,
          performedBy: currentUser?.id || 'staff',
          performedByName: currentUser?.displayName || 'Staff',
          timestamp: now,
        };
        newMovements.push(movement);

        return { ...prod, currentStock: newQty, updatedAt: now };
      })
    );

    setInventoryMovements((prev) => [...newMovements, ...prev]);

    try {
      await setDoc(doc(db, 'returns', returnRecord.id), returnRecord);
      await updateDoc(doc(db, 'sales', originalSaleId), { paymentStatus: 'refunded' });

      for (const m of newMovements) {
        await setDoc(doc(db, 'inventoryMovements', m.id), m);
        await updateDoc(doc(db, 'products', m.productId), { currentStock: m.newQuantity });
      }

      await logAudit(
        'PROCESS_RETURN',
        'Return',
        returnRecord.id,
        `Refund of Rs. ${totalRefundAmount} processed for sale ${originalReceiptNo}`
      );
    } catch (e) {
      console.warn('Process return:', e);
    }
  };

  // Seed demo catalog
  const seedDemoData = async () => {
    setIsLoading(true);
    try {
      for (const cat of INITIAL_CATEGORIES) {
        await setDoc(doc(db, 'categories', cat.id), cat);
      }
      for (const prod of INITIAL_PRODUCTS) {
        await setDoc(doc(db, 'products', prod.id), prod);
      }
      for (const sup of INITIAL_SUPPLIERS) {
        await setDoc(doc(db, 'suppliers', sup.id), sup);
      }
      await setDoc(doc(db, 'storeSettings', 'main'), DEFAULT_STORE_SETTINGS);

      setCategories(INITIAL_CATEGORIES);
      setProducts(INITIAL_PRODUCTS);
      setSuppliers(INITIAL_SUPPLIERS);
      setSettings(DEFAULT_STORE_SETTINGS);

      await logAudit('SEED_DEMO_DATA', 'System', 'all', 'Seeded realistic Family Mart grocery catalog');
    } catch (e) {
      console.warn('Seed demo data error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear demo data
  const clearAllDemoData = async () => {
    setIsLoading(true);
    try {
      setSales([]);
      setHeldSales([]);
      setPurchases([]);
      setInventoryMovements([]);
      setExpenses([]);
      setReturns([]);
      clearCart();
      await logAudit('CLEAR_DEMO_DATA', 'System', 'all', 'Cleared demo sales and operational transactions');
    } catch (e) {
      console.warn('Clear data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StoreContext.Provider
      value={{
        settings,
        updateSettings,
        categories,
        addCategory,
        updateCategory,
        products,
        addProduct,
        updateProduct,
        toggleProductStatus,
        suppliers,
        addSupplier,
        updateSupplier,
        customers,
        addCustomer,
        repayCustomerCredit,
        sales,
        heldSales,
        purchases,
        addPurchase,
        receivePurchase,
        inventoryMovements,
        adjustStock,
        expenses,
        addExpense,
        deleteExpense,
        returns,
        processReturn,
        auditLogs,
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
        checkout,
        lastCompletedSale,
        setLastCompletedSale,
        seedDemoData,
        clearAllDemoData,
        findProductByBarcodeOrSku,
        isLoading,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
