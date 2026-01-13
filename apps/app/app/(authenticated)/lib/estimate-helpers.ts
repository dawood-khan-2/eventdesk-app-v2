/**
 * Shared helpers for estimate calculations
 */

interface LineItem {
  quantity: number;
  rate: number;
  tax: number;
}

/**
 * Calculate the total amount for an estimate including tax and discount
 * 
 * @param lineItems - Array of line items with quantity, rate, and tax
 * @param discount - Discount percentage (0-100)
 * @returns Total amount after discount and tax
 */
export function calculateEstimateTotal(lineItems: any[], discount: number = 0): number {
  // Calculate subtotal
  const subtotal = lineItems.reduce((sum, item) => {
    return sum + (item.quantity * item.rate);
  }, 0);
  
  // Calculate discount amount
  const discountAmount = subtotal * (discount / 100);
  
  // Calculate subtotal after discount
  const subtotalAfterDiscount = subtotal - discountAmount;
  
  // Calculate tax on discounted amount (if tax exists)
  const tax = subtotal === 0 ? 0 : lineItems.reduce((sum, item) => {
    // Default to 0 if tax field is missing
    const itemTax = item.tax || 0;
    const itemSubtotal = item.quantity * item.rate;
    const itemAfterDiscount = itemSubtotal * (subtotalAfterDiscount / subtotal);
    return sum + (itemAfterDiscount * (itemTax / 100));
  }, 0);
  
  // Return total: subtotal - discount + tax
  return subtotal - discountAmount + tax;
}
