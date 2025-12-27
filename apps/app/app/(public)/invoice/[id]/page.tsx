import { validateInvoiceToken } from "./actions";
import { InvoiceView } from "./invoice-view";
import { Card, CardContent } from "@repo/design-system/components/ui/card";
import { AlertCircle, Clock } from "lucide-react";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function InvoiceViewPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { token } = await searchParams;

  // Check if token is provided
  if (!token) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-zinc-900 mb-2">Access Token Required</h2>
                <p className="text-zinc-600">
                  This invoice requires a valid access token to view. Please use the link provided
                  in your email.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Validate the token and fetch invoice
  const result = await validateInvoiceToken(token, id);

  // Handle errors
  if ("error" in result) {
    const isExpired = result.error?.includes("expired") ?? false;

    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div
                className={`h-12 w-12 rounded-full ${isExpired ? "bg-orange-100" : "bg-red-100"} flex items-center justify-center`}
              >
                {isExpired ? (
                  <Clock className="h-6 w-6 text-orange-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-zinc-900 mb-2">
                  {isExpired ? "Link Expired" : "Invalid Link"}
                </h2>
                <p className="text-zinc-600">
                  {isExpired
                    ? "This invoice link has expired. Please request a new link."
                    : result.error}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { invoice, organization } = result;

  // Serialize dates for client component
  const serializedInvoice = {
    ...invoice,
    lineItems: invoice.lineItems as any,
    invoiceDate: invoice.invoiceDate?.toISOString() ?? null,
    dueDate: invoice.dueDate?.toISOString() ?? null,
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
    event: invoice.event
      ? {
          ...invoice.event,
          startDate: invoice.event.startDate?.toISOString() ?? null,
          endDate: invoice.event.endDate?.toISOString() ?? null,
        }
      : null,
  };

  return <InvoiceView invoice={serializedInvoice} organization={organization as any} />;
}
