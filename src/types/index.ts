/**
 * Family Mart POS & Inventory System Type Definitions
 */

export type UserRole = 'owner' | 'manager' | 'cashier' | 'inventory_staff';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  phone?: string;
  pin?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export interface StoreSettings {
  id: string;
  storeName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  taxNumber: string; // e.g. NTN / STRN
  taxRate: number; // percentage, e.g. 0% or standard sales tax
  currency: string; // PKR
  currencySymbol: string; // Rs.
  timezone: string; // Asia/Karachi
  receiptFooter: string;
  receiptWidth: '80mm' | '58mm';
  negativeStockAllowed: boolean;
  lowStockThreshold: number;
  expiryWarningDays: number;
  isInitialized: boolean;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  alternativeBarcodes?: string[];
  categoryId: string;
  categoryName: string;
  brand: string;
  description?: string;
  unit: string; // 'piece' | 'kg' | 'g' | 'litre' | 'pack' | 'dozen' | 'box'
  isWeightBased: boolean;
  isQuickProduct: boolean;
  purchaseCost: number;
  sellingPrice: number;
  wholesalePrice?: number;
  currentStock: number;
  minStockLevel: number;
  supplierId?: string;
  supplierName?: string;
  taxRate: number;
  isDiscountEligible: boolean;
  expiryDate?: string;
  batchNumber?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  lineDiscount: number;
  lineTotal: number;
  notes?: string;
}

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'easypaisa' | 'jazzcash' | 'store_credit';

export interface SaleItem {
  productId: string;
  name: string;
  sku: string;
  barcode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  purchaseCost: number;
  lineDiscount: number;
  lineTotal: number;
}

export interface Sale {
  id: string;
  receiptNo: string;
  cashierId: string;
  cashierName: string;
  registerId: string;
  timestamp: string;
  items: SaleItem[];
  subtotal: number;
  itemDiscountsTotal: number;
  transactionDiscount: number;
  taxTotal: number;
  netTotal: number;
  totalCost: number; // Snapshot of cost for profit calculation
  grossProfit: number; // netTotal - totalCost
  paymentMethod: PaymentMethod;
  paymentStatus: 'completed' | 'refunded' | 'partially_refunded';
  amountReceived: number;
  changeDue: number;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  isReprint?: boolean;
  createdAt: string;
}

export interface HeldSale {
  id: string;
  referenceLabel: string;
  items: CartItem[];
  subtotal: number;
  transactionDiscount: number;
  cashierId: string;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  heldAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  openingBalance: number;
  currentBalance: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PurchaseItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number; // e.g. 10 cartons
  packagingType?: 'unit' | 'carton' | 'box';
  packSizeMultiplier?: number; // e.g. 24 units per carton -> 240 units total
  totalUnitsReceived?: number;
  unitCost: number;
  lineTotal: number;
}

export interface Purchase {
  id: string;
  purchaseOrderNo: string;
  supplierId: string;
  supplierName: string;
  status: 'draft' | 'pending' | 'received' | 'cancelled';
  items: PurchaseItem[];
  totalAmount: number;
  amountPaid: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  paymentMethod?: string;
  receivedAt?: string;
  receivedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalPurchases: number;
  loyaltyPoints: number;
  creditBalance: number;
  creditLimit?: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type MovementType = 'sale' | 'purchase' | 'adjustment' | 'return' | 'damage' | 'expiry';

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantityChange: number; // positive or negative
  previousQuantity: number;
  newQuantity: number;
  movementType: MovementType;
  reason: string;
  referenceId?: string; // saleId or purchaseId or returnId
  performedBy: string;
  performedByName: string;
  timestamp: string;
}

export type ExpenseCategory =
  | 'rent'
  | 'electricity'
  | 'salaries'
  | 'transport'
  | 'packaging'
  | 'repairs'
  | 'utilities'
  | 'miscellaneous';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  description: string;
  paymentMethod: string;
  recordedBy: string;
  recordedByName: string;
  createdAt: string;
}

export interface ReturnItem {
  productId: string;
  name: string;
  returnQuantity: number;
  unitPrice: number;
  unitCost: number;
  refundAmount: number;
  condition: 'resalable' | 'damaged' | 'expired';
}

export interface ReturnRecord {
  id: string;
  returnNo: string;
  originalSaleId: string;
  originalReceiptNo: string;
  items: ReturnItem[];
  totalRefundAmount: number;
  refundPaymentMethod: PaymentMethod;
  reason: string;
  approvedBy: string;
  approvedByName: string;
  restocked: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  userId: string;
  userName: string;
  userRole: string;
  timestamp: string;
}
