import { Suspense } from "react";
import { Header } from "../components/header";
import { getInvoices } from "./actions";
import { InvoicesClient } from "./components/invoices-client";

type SearchParams = {
  page?: string;
  search?: string;
};

type InvoicesPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || "";

  // Fetch invoices immediately
  const invoicesResult = await getInvoices(page, 20, search);
  const invoices = invoicesResult.data || [];

  // Transform the invoices to match client component expectations
  const transformedInvoices = invoices.map((invoice) => ({
    ...invoice,
    createdAt: invoice.createdAt.toISOString(),
    invoiceDate: invoice.invoiceDate.toISOString(),
    dueDate: invoice.dueDate.toISOString(),
    lineItems: (invoice.lineItems as any[]) || [],
  }));

  const totalPages = Math.ceil(invoices.length / 10);

  return (
    <>
      <Header page="Invoices" pages={["Home"]} />
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
        <Suspense fallback={<div>Loading...</div>}>
          <InvoicesClient
            initialInvoices={transformedInvoices}
            initialPage={page}
            initialSearch={search}
            initialTotalPages={totalPages}
            error={invoicesResult.error}
          />
        </Suspense>
      </div>
    </>
  );
}
