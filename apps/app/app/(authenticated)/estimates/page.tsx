import { Suspense } from "react";
import { Header } from "../components/header";
import { getEstimates } from "./actions";
import { EstimatesClient } from "./components/estimates-client";

type SearchParams = {
  page?: string;
  search?: string;
};

type EstimatesPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function EstimatesPage({ searchParams }: EstimatesPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || "";

  // Fetch estimates immediately, defer settings to client component
  const estimatesResult = await getEstimates(page, 20, search);
  const estimates = estimatesResult.data || [];

  // Transform the estimates to match client component expectations
  const transformedEstimates = estimates.map((estimate) => ({
    ...estimate,
    createdAt: estimate.createdAt.toISOString(),
    eventStartDate: estimate.eventStartDate?.toISOString() || null,
    eventEndDate: estimate.eventEndDate?.toISOString() || null,
    lineItems: (estimate.lineItems as any[]) || [],
  }));

  const totalPages = Math.ceil(estimates.length / 10); // Assuming 10 per page

  return (
    <>
      <Header page="Estimates" pages={["Home"]} />
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
        <Suspense fallback={<div>Loading...</div>}>
          <EstimatesClient
            initialEstimates={transformedEstimates}
            initialPage={page}
            initialSearch={search}
            initialTotalPages={totalPages}
            error={estimatesResult.error}
          />
        </Suspense>
      </div>
    </>
  );
}