import { notFound, redirect } from "next/navigation";
import { validateEstimateToken } from "./actions";
import { EstimateApprovalView } from "./estimate-approval-view";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function EstimateApprovalPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { token } = await searchParams;

  // Token is required
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Link</h1>
          <p className="text-zinc-600">
            This link is invalid or incomplete. Please check your email for the correct link.
          </p>
        </div>
      </div>
    );
  }

  // Validate token and fetch estimate
  const result = await validateEstimateToken(token, id);

  if (result.error || !result.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            {result.error?.includes("expired") ? "Link Expired" : "Invalid Link"}
          </h1>
          <p className="text-zinc-600 mb-2">{result.error}</p>
          {result.error?.includes("expired") && (
            <p className="text-sm text-zinc-500 mt-4">
              Approval links expire after 48 hours. Please contact us for a new link.
            </p>
          )}
        </div>
      </div>
    );
  }

  const { estimate } = result.data;

  // Serialize dates for client component
  const serializedEstimate = {
    ...estimate,
    discount: estimate.discount ?? 0,
    lineItems: estimate.lineItems as any[],
    eventStartDate: estimate.eventStartDate ? estimate.eventStartDate.toISOString() : null,
    eventEndDate: estimate.eventEndDate ? estimate.eventEndDate.toISOString() : null,
    expiryDate: estimate.expiryDate ? estimate.expiryDate.toISOString() : null,
    createdAt: estimate.createdAt.toISOString(),
    updatedAt: estimate.updatedAt.toISOString(),
    statusChangedAt: estimate.statusChangedAt.toISOString(),
  };

  return <EstimateApprovalView estimate={serializedEstimate} token={token} estimateId={id} />;
}
