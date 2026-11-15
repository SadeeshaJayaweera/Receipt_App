import React from 'react';
import { formatCurrency } from '../utils/calcEngine';

export default function ReceiptThermalPreview({ receipt, business = {}, onPrint, onDownloadPdf }) {
  if (!receipt) return null;

  const currency = receipt.currency || business.defaultCurrency || 'LKR';
  const subtotalVal = receipt.pricing?.subtotal ?? receipt.subtotal ?? 0;
  const discountVal = receipt.pricing?.discount ?? receipt.discount ?? 0;
  const taxVal = receipt.pricing?.tax ?? receipt.tax ?? 0;
  const totalVal = receipt.pricing?.grandTotal ?? receipt.totalAmount ?? 0;

  const dateObj = receipt.createdAt ? new Date(receipt.createdAt) : new Date();
  const dateFormatted = dateObj.toLocaleDateString();
  const timeFormatted = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const bName = (business.businessName || 'Juice Receipt App').toUpperCase();
  const footerMsg = business.receiptFooter || 'Thank you for your business!';
  const customerName = receipt.customer?.name || receipt.customerName;
  const customerPhone = receipt.customer?.phone || receipt.customerPhone;
  const paymentMethod = (receipt.payment?.method || receipt.paymentMethod || 'cash').toUpperCase();

  return (
    <div className="flex flex-col items-center">
      {/* 80mm Paper Container */}
      <div
        className="thermal-receipt-container bg-white text-black p-4 rounded shadow-lg border border-gray-200"
        style={{
          width: '78mm',
          maxWidth: '100%',
          fontFamily: "'Courier New', Courier, 'Lucida Console', Monaco, monospace",
          fontSize: '11px',
          lineHeight: '1.25'
        }}
      >
        {/* Business Header */}
        <div className="text-center mb-2">
          {business.showLogo !== false && (
            <div className="text-2xl mb-1">{business.logoIcon || '🧃'}</div>
          )}
          <div className="text-sm font-bold tracking-wider">{bName}</div>
          {business.tagline && <div className="text-[10.5px] italic font-semibold text-gray-800">{business.tagline}</div>}
          {business.address && <div className="text-[10px] text-gray-700">{business.address}</div>}
          {business.phone && <div className="text-[10px] text-gray-700">Tel: {business.phone}</div>}
          {business.email && <div className="text-[10px] text-gray-700">{business.email}</div>}
          {business.website && <div className="text-[10px] text-gray-700">{business.website}</div>}
        </div>

        {/* Status notice */}
        {receipt.status === 'voided' && (
          <div className="text-center font-bold text-red-600 border-y border-dashed border-red-600 my-1 py-0.5 text-xs">
            *** VOIDED RECEIPT ***
          </div>
        )}
        {receipt.status === 'draft' && (
          <div className="text-center font-bold text-amber-600 border-y border-dashed border-amber-600 my-1 py-0.5 text-xs">
            *** DRAFT RECEIPT ***
          </div>
        )}

        <div className="border-t border-dashed border-black my-2" />

        {/* Metadata */}
        <div className="flex justify-between text-[10.5px]">
          <span>Receipt #:</span>
          <span className="font-bold">{receipt.receiptNumber || 'DRAFT'}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span>Date:</span>
          <span>{dateFormatted}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span>Time:</span>
          <span>{timeFormatted}</span>
        </div>
        {customerName && (
          <div className="flex justify-between text-[10px]">
            <span>Customer:</span>
            <span>{customerName}</span>
          </div>
        )}
        {customerPhone && (
          <div className="flex justify-between text-[10px]">
            <span>Contact:</span>
            <span>{customerPhone}</span>
          </div>
        )}

        <div className="border-t border-dashed border-black my-2" />

        {/* Items Table */}
        <div className="flex font-bold text-[10px] pb-1 border-b border-black">
          <span className="flex-1">ITEM</span>
          <span className="w-8 text-center">QTY</span>
          <span className="w-16 text-right">AMOUNT</span>
        </div>

        <div className="divide-y divide-dotted divide-gray-300">
          {(receipt.items || []).map((item, idx) => (
            <div key={idx} className="flex py-1 text-[10.5px]">
              <span className="flex-1 pr-1 truncate">{item.flavourName || 'Item'}</span>
              <span className="w-8 text-center">{item.quantity || 1}</span>
              <span className="w-16 text-right">{formatCurrency(item.subtotal || 0, currency)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-black my-1" />

        {/* Financial Summaries */}
        <div className="flex justify-between text-[10.5px]">
          <span>Subtotal:</span>
          <span>{formatCurrency(subtotalVal, currency)}</span>
        </div>
        {discountVal > 0 && (
          <div className="flex justify-between text-[10.5px] text-gray-700">
            <span>Discount:</span>
            <span>-{formatCurrency(discountVal, currency)}</span>
          </div>
        )}
        {(taxVal > 0 || receipt.pricing?.tax > 0) && (
          <div className="flex justify-between text-[10.5px] text-gray-700">
            <span>Tax:</span>
            <span>{formatCurrency(taxVal, currency)}</span>
          </div>
        )}

        <div className="border-t-2 border-black my-1.5" />

        <div className="flex justify-between font-bold text-sm">
          <span>TOTAL:</span>
          <span>{formatCurrency(totalVal, currency)}</span>
        </div>

        <div className="border-t border-black my-1" />

        {/* Payment */}
        <div className="flex justify-between text-[10.5px]">
          <span>Payment:</span>
          <span className="font-bold">{paymentMethod}</span>
        </div>
        {receipt.payment?.amountPaid > 0 && (
          <div className="flex justify-between text-[10px]">
            <span>Tendered:</span>
            <span>{formatCurrency(receipt.payment.amountPaid, currency)}</span>
          </div>
        )}
        {receipt.payment?.changeGiven !== undefined && receipt.payment?.changeGiven >= 0 && paymentMethod === 'CASH' && (
          <div className="flex justify-between text-[10px]">
            <span>Change:</span>
            <span>{formatCurrency(receipt.payment.changeGiven, currency)}</span>
          </div>
        )}

        <div className="border-t border-dashed border-black mt-3 pt-2 text-center">
          <div className="font-bold text-[10px]">*** {footerMsg} ***</div>
          {receipt.notes && <div className="text-[9px] italic text-gray-600 mt-1">Note: {receipt.notes}</div>}
        </div>
      </div>

      {/* Action buttons if handlers provided */}
      {(onPrint || onDownloadPdf) && (
        <div className="no-print flex gap-2 mt-4 w-full justify-center">
          {onPrint && (
            <button
              onClick={() => onPrint(receipt)}
              className="bg-primary hover:bg-green-600 text-white font-medium py-2 px-4 rounded text-sm flex items-center gap-1 shadow"
            >
              🖨️ Print 80mm
            </button>
          )}
          {onDownloadPdf && (
            <button
              onClick={() => onDownloadPdf(receipt)}
              className="bg-gray-800 hover:bg-black text-white font-medium py-2 px-4 rounded text-sm flex items-center gap-1 shadow"
            >
              📄 Download PDF
            </button>
          )}
        </div>
      )}
    </div>
  );
}
