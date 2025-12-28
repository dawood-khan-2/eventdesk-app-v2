"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Card } from "@repo/design-system/components/ui/card";

type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  tax: number;
};

type Invoice = {
  id: string;
  number: string;
  status: "UNPAID" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";
  invoiceDate: string | null;
  dueDate: string | null;
  poNumber: string | null;
  paymentTerms: string | null;
  notes: string | null;
  terms: string | null;
  billTo: string | null;
  shipTo: string | null;
  lineItems: LineItem[];
  discount: number;
  amountPaid: number;
  balanceDue: number;
  client?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  } | null;
  event?: {
    id: string;
    name: string;
    venue: string | null;
    startDate: string | null;
    endDate: string | null;
  } | null;
};

type Organization = {
  name: string;
  imageUrl: string | null;
  address: string | null;
  phone: string | null;
  currencyCode: string;
} | null;

type InvoiceViewProps = {
  invoice: Invoice;
  organization: Organization;
};

const statusColors = {
  UNPAID: "bg-yellow-500",
  PARTIALLY_PAID: "bg-blue-500",
  PAID: "bg-green-500",
  OVERDUE: "bg-red-500",
} as const;

const statusLabels = {
  UNPAID: "Unpaid",
  PARTIALLY_PAID: "Partially Paid",
  PAID: "Paid",
  OVERDUE: "Overdue",
} as const;

function formatCurrency(amount: number, currencyCode: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
}

function formatDate(date: string | null): string {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function calculateSubtotal(lineItems: LineItem[]): number {
  return lineItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
}

function calculateDiscount(lineItems: LineItem[], discountPercent: number): number {
  const subtotal = calculateSubtotal(lineItems);
  return subtotal * (discountPercent / 100);
}

function calculateTax(lineItems: LineItem[], discountPercent: number): number {
  const subtotal = calculateSubtotal(lineItems);
  const discount = calculateDiscount(lineItems, discountPercent);
  const subtotalAfterDiscount = subtotal - discount;

  if (subtotal === 0) return 0;

  return lineItems.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.rate;
    const itemAfterDiscount = itemSubtotal * (subtotalAfterDiscount / subtotal);
    return sum + itemAfterDiscount * (item.tax / 100);
  }, 0);
}

function calculateTotal(lineItems: LineItem[], discountPercent: number): number {
  const subtotal = calculateSubtotal(lineItems);
  const discount = calculateDiscount(lineItems, discountPercent);
  const tax = calculateTax(lineItems, discountPercent);
  return subtotal - discount + tax;
}

export function InvoiceView({ invoice, organization }: InvoiceViewProps) {
  const subtotal = calculateSubtotal(invoice.lineItems);
  const discount = calculateDiscount(invoice.lineItems, invoice.discount);
  const tax = calculateTax(invoice.lineItems, invoice.discount);
  const total = calculateTotal(invoice.lineItems, invoice.discount);

  const companyName = organization?.name || "Company Name";
  const companyLogo = organization?.imageUrl || null;
  const companyAddress = organization?.address || null;
  const companyPhone = organization?.phone || null;
  const currencyCode = organization?.currencyCode || "USD";

  return (
    <div className="min-h-screen bg-zinc-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="p-8 md:p-12 shadow-lg">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-stretch mb-8 pb-6 border-b-2 border-zinc-200">
            {/* Left Side: Company Logo/Name + Address + Phone + Bill To / Ship To */}
            <div className="mb-6 md:mb-0 flex-1 flex flex-col justify-between">
              {/* Company Logo/Name and Contact Info */}
              <div className="mb-6">
                {companyLogo ? (
                  <img
                    src={companyLogo}
                    alt={companyName}
                    className="h-16 w-auto object-contain mb-2"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-zinc-900 mb-2">{companyName}</h1>
                )}
                {companyAddress && (
                  <p className="text-sm text-zinc-600 whitespace-pre-line">{companyAddress}</p>
                )}
                {companyPhone && (
                  <p className="text-sm text-zinc-600">{companyPhone}</p>
                )}
              </div>

              {/* Bill To / Ship To */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bill To */}
                {invoice.billTo && (
                  <div>
                    <h3 className="font-semibold text-zinc-900 mb-1 text-xs uppercase tracking-wide">
                      Bill To
                    </h3>
                    <div className="text-sm text-zinc-600 whitespace-pre-line">
                      {invoice.billTo}
                    </div>
                  </div>
                )}

                {/* Ship To */}
                {invoice.shipTo && (
                  <div>
                    <h3 className="font-semibold text-zinc-900 mb-1 text-xs uppercase tracking-wide">
                      Ship To
                    </h3>
                    <div className="text-sm text-zinc-600 whitespace-pre-line">
                      {invoice.shipTo}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Invoice Info */}
            <div className="text-left md:text-right flex flex-col justify-between">
              {/* Invoice Info */}
              <div>
                <h2 className="text-4xl font-bold text-zinc-900 mb-2">INVOICE</h2>
                <Badge variant="secondary" className={`text-white ${statusColors[invoice.status]}`}>
                  {statusLabels[invoice.status]}
                </Badge>
              </div>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-semibold">Invoice #:</span> {invoice.number}
                </div>
                <div>
                  <span className="font-semibold">Date:</span> {formatDate(invoice.invoiceDate)}
                </div>
                <div>
                  <span className="font-semibold">Due Date:</span> {formatDate(invoice.dueDate)}
                </div>
                {invoice.poNumber && (
                  <div>
                    <span className="font-semibold">PO #:</span> {invoice.poNumber}
                  </div>
                )}
                {invoice.paymentTerms && (
                  <div>
                    <span className="font-semibold">Payment Terms:</span> {invoice.paymentTerms}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mb-8">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-slate-900">Description</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900 hidden sm:table-cell">
                      Quantity
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900 hidden sm:table-cell">
                      Rate
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-900">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((item) => (
                    <tr key={item.id} className="border-b border-zinc-200">
                      <td className="py-4 px-4 text-zinc-800">
                        <div>{item.description}</div>
                        <div className="text-xs text-zinc-500 sm:hidden">
                          {item.quantity} {item.unit} × {formatCurrency(item.rate, currencyCode)}
                          {item.tax > 0 && ` (Tax: ${item.tax}%)`}
                        </div>
                      </td>
                      <td className="text-right py-4 px-4 text-zinc-800 hidden sm:table-cell">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="text-right py-4 px-4 text-zinc-800 hidden sm:table-cell">
                        {formatCurrency(item.rate, currencyCode)}
                        {item.tax > 0 && (
                          <div className="text-xs text-zinc-500">Tax: {item.tax}%</div>
                        )}
                      </td>
                      <td className="text-right py-4 px-4 text-zinc-800 font-medium">
                        {formatCurrency(item.quantity * item.rate, currencyCode)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end mb-8">
            <div className="w-full md:w-80 space-y-2">
              <div className="flex justify-between text-sm py-2">
                <span className="text-zinc-600">Subtotal:</span>
                <span className="font-medium text-zinc-900">{formatCurrency(subtotal, currencyCode)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-sm py-2">
                  <span className="text-zinc-600">Discount ({invoice.discount}%):</span>
                  <span className="font-medium text-green-600">-{formatCurrency(discount, currencyCode)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm py-2">
                <span className="text-zinc-600">Tax:</span>
                <span className="font-medium text-zinc-900">{formatCurrency(tax, currencyCode)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold py-3 border-t-2 border-zinc-300">
                <span className="text-zinc-900">Total:</span>
                <span className="text-zinc-900">{formatCurrency(total, currencyCode)}</span>
              </div>
              {invoice.amountPaid > 0 && (
                <>
                  <div className="flex justify-between text-sm py-2 border-t border-zinc-200">
                    <span className="text-zinc-600">Amount Paid:</span>
                    <span className="font-medium text-green-600">
                      -{formatCurrency(invoice.amountPaid, currencyCode)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold py-3 border-t-2 border-zinc-300">
                    <span className="text-zinc-900">Balance Due:</span>
                    <span className="text-zinc-900">{formatCurrency(invoice.balanceDue, currencyCode)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Notes Section */}
          {invoice.notes && (
            <div className="mb-6 p-4 bg-zinc-50 rounded-lg">
              <h3 className="font-semibold text-zinc-900 mb-2">Notes</h3>
              <p className="text-sm text-zinc-600 whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}

          {/* Terms Section */}
          {invoice.terms && (
            <div className="p-4 bg-zinc-50 rounded-lg">
              <h3 className="font-semibold text-zinc-900 mb-2">Terms & Conditions</h3>
              <p className="text-sm text-zinc-600 whitespace-pre-line">{invoice.terms}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-zinc-200 text-center">
            <p className="text-sm text-zinc-500">
              Thank you for your business! If you have any questions, please contact us.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
