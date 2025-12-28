/**
 * Shared invoice calculation utilities
 * Used across both authenticated and public invoice routes
 */

export type InvoiceStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID";

/**
 * Calculate invoice totals from line items
 */
export function calculateInvoiceTotals(lineItems: any[], discount: number) {
  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const discountAmount = subtotal * (discount / 100);
  const subtotalAfterDiscount = subtotal - discountAmount;
  const tax = lineItems.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.rate;
    const itemAfterDiscount = subtotal === 0 ? 0 : itemSubtotal * (subtotalAfterDiscount / subtotal);
    return sum + (itemAfterDiscount * (item.tax / 100));
  }, 0);
  const total = subtotalAfterDiscount + tax;

  return { subtotal, discountAmount, tax, total };
}

/**
 * Calculate payment status based on payments and total
 */
export function calculatePaymentStatus(
  amountPaid: number,
  total: number
): InvoiceStatus {
  if (amountPaid === 0) {
    return "UNPAID";
  } else if (amountPaid >= total) {
    return "PAID";
  } else {
    return "PARTIALLY_PAID";
  }
}

/**
 * Calculate payment info from payment records
 */
export function calculateInvoiceWithPayments(invoice: any) {
  const { total } = calculateInvoiceTotals(invoice.lineItems, invoice.discount);
  const amountPaid = invoice.paymentRecords?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
  const balanceDue = Math.max(0, total - amountPaid);
  const status = calculatePaymentStatus(amountPaid, total);
  
  return { ...invoice, amountPaid, balanceDue, status, total };
}
