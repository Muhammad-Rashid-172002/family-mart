/**
 * Thermal Receipt Modal & Browser Print Layout (80mm & 58mm)
 */
import React, { useRef, useState } from 'react';
import { Printer, Check, X, Store, ArrowLeft } from 'lucide-react';
import { Sale, StoreSettings } from '../../types';

interface ReceiptModalProps {
  sale: Sale;
  settings: StoreSettings;
  isDuplicate?: boolean;
  onClose: () => void;
  onNewSale: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  sale,
  settings,
  isDuplicate = false,
  onClose,
  onNewSale,
}) => {
  const [receiptWidth, setReceiptWidth] = useState<'80mm' | '58mm'>(settings.receiptWidth || '80mm');
  const [printSuccess, setPrintSuccess] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
    setPrintSuccess(true);
  };

  const formattedDate = new Date(sale.timestamp).toLocaleString('en-PK', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[92vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <Check className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                {isDuplicate || sale.isReprint ? 'Receipt Copy (Reprint)' : 'Sale Completed'}
              </h2>
              <div className="text-xs text-neutral-500 font-mono">
                Receipt #{sale.receiptNo}
              </div>
            </div>
          </div>

          {/* Width Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-neutral-200 bg-neutral-100 p-0.5 text-xs font-medium dark:border-neutral-700 dark:bg-neutral-800">
              <button
                onClick={() => setReceiptWidth('80mm')}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  receiptWidth === '80mm'
                    ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-700 dark:text-white'
                    : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400'
                }`}
              >
                80 mm Standard
              </button>
              <button
                onClick={() => setReceiptWidth('58mm')}
                className={`rounded-md px-2.5 py-1 transition-colors ${
                  receiptWidth === '58mm'
                    ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-700 dark:text-white'
                    : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400'
                }`}
              >
                58 mm Compact
              </button>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Preview */}
        <div className="flex-1 overflow-y-auto bg-neutral-100 p-6 dark:bg-neutral-950 flex justify-center">
          {/* Printable Thermal Receipt Card */}
          <div
            id="thermal-receipt"
            ref={receiptRef}
            style={{ width: receiptWidth === '80mm' ? '320px' : '240px' }}
            className="bg-white p-4 text-black shadow-md font-mono text-xs leading-relaxed border border-dashed border-neutral-300"
          >
            {/* Header branding */}
            <div className="text-center pb-3 border-b border-dashed border-neutral-300">
              <div className="font-extrabold text-base tracking-wide uppercase text-neutral-900">
                {settings.storeName}
              </div>
              <div className="text-[11px] text-neutral-600 mt-0.5">
                {settings.tagline}
              </div>
              {(isDuplicate || sale.isReprint) && (
                <div className="my-1 py-0.5 px-2 bg-black text-white font-extrabold text-[10px] uppercase tracking-widest text-center">
                  *** DUPLICATE / REPRINT ***
                </div>
              )}
              <div className="text-[10px] text-neutral-500 mt-1">
                {settings.address}
              </div>
              <div className="text-[10px] text-neutral-500">
                Tel: {settings.phone}
              </div>
              {settings.taxNumber && (
                <div className="text-[10px] text-neutral-500">
                  {settings.taxNumber}
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="py-2 border-b border-dashed border-neutral-300 text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span>Receipt:</span>
                <span className="font-bold">{sale.receiptNo}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{sale.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span>{sale.customerName || 'Walk-in'}</span>
              </div>
              {sale.customerPhone && (
                <div className="flex justify-between">
                  <span>Phone:</span>
                  <span>{sale.customerPhone}</span>
                </div>
              )}
            </div>

            {/* Line items table */}
            <div className="py-2 border-b border-dashed border-neutral-300">
              <div className="flex justify-between font-bold text-[10px] pb-1 border-b border-neutral-200">
                <span className="w-1/2">Item</span>
                <span className="w-1/4 text-center">Qty x Rate</span>
                <span className="w-1/4 text-right">Total</span>
              </div>

              <div className="pt-1 space-y-1.5">
                {sale.items.map((item, index) => (
                  <div key={index} className="text-[11px]">
                    <div className="font-semibold truncate">{item.name}</div>
                    <div className="flex justify-between text-[10px] text-neutral-600">
                      <span>
                        {item.quantity} {item.unit} @ Rs. {item.unitPrice}
                      </span>
                      <span className="font-medium text-black">
                        Rs. {item.lineTotal.toLocaleString()}
                      </span>
                    </div>
                    {item.lineDiscount > 0 && (
                      <div className="text-[9px] text-emerald-700 text-right">
                        - Disc Rs. {item.lineDiscount}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Totals */}
            <div className="py-2 border-b border-dashed border-neutral-300 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>Rs. {sale.subtotal.toLocaleString()}</span>
              </div>

              {sale.itemDiscountsTotal > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Item Discounts:</span>
                  <span>- Rs. {sale.itemDiscountsTotal.toLocaleString()}</span>
                </div>
              )}

              {sale.transactionDiscount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Bill Discount:</span>
                  <span>- Rs. {sale.transactionDiscount.toLocaleString()}</span>
                </div>
              )}

              {sale.taxTotal > 0 && (
                <div className="flex justify-between">
                  <span>Sales Tax ({settings.taxRate}%):</span>
                  <span>Rs. {sale.taxTotal.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-bold border-t border-neutral-300 pt-1 text-black">
                <span>NET TOTAL:</span>
                <span>Rs. {sale.netTotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-[10px] pt-1">
                <span>Payment ({sale.paymentMethod.toUpperCase()}):</span>
                <span>Rs. {sale.amountReceived.toLocaleString()}</span>
              </div>

              {sale.paymentMethod === 'cash' && (
                <div className="flex justify-between text-[10px] font-bold text-neutral-800">
                  <span>Change Due:</span>
                  <span>Rs. {sale.changeDue.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Footer message */}
            <div className="pt-3 text-center text-[10px] text-neutral-600 space-y-1">
              <div>Total Items: {sale.items.reduce((s, i) => s + i.quantity, 0)}</div>
              <div className="pt-1 font-medium">{settings.receiptFooter}</div>
              <div className="text-[9px] text-neutral-400 pt-1">
                Powered by Family Mart POS
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900/80">
          <button
            onClick={onClose}
            className="flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Close Preview</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 shadow-sm"
            >
              <Printer className="h-4 w-4" />
              <span>Print Thermal Receipt</span>
            </button>

            <button
              onClick={onNewSale}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm"
            >
              <Check className="h-4 w-4" />
              <span>Start Next Customer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
