/**
 * Shared bill calculation utilities
 */

export type BillStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID";

/**
 * Calculate payment status based on payments and total
 */
export function calculateBillPaymentStatus(
  amountPaid: number,
  total: number
): BillStatus {
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
export function calculateBillWithPayments(bill: any) {
  const total = bill.amount;
  const amountPaid = bill.paymentRecords?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
  const balanceDue = Math.max(0, total - amountPaid);
  const status = calculateBillPaymentStatus(amountPaid, total);
  
  return { ...bill, amountPaid, balanceDue, status };
}
