"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Badge } from "@repo/design-system/components/ui/badge";
import { PlusIcon, SearchIcon } from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import { InvoicesTable } from "./invoices-table";
import { InvoiceSheet } from "./invoice-sheet";
import { getInvoices, getInvoicesStats } from "../actions";
import { getFinanceSettings, getServiceCategories } from "../../settings/actions";
import type { InvoiceStatus } from "@/lib/invoice-calculations";

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

type Invoice = {
  id: string;
  number: string;
  status: InvoiceStatus;
  billTo: string;
  shipTo?: string | null;
  invoiceDate: string;
  dueDate: string;
  poNumber?: string | null;
  paymentTerms?: string | null;
  notes?: string | null;
  terms?: string | null;
  amountPaid: number;
  balanceDue: number;
  createdAt: string;
  client?: { name: string; email: string | null } | null;
  event?: { name: string } | null;
  lineItems: any[];
  discount?: number | null;
};

type ServiceCategory = {
  id: string;
  name: string;
};

type InvoicesClientProps = {
  initialInvoices: Invoice[];
  initialPage: number;
  initialSearch: string;
  initialTotalPages: number;
  initialCurrencyCode?: string;
  error?: string;
  eventId?: string;
  eventData?: {
    id: string;
    clientId: string;
    name: string;
    venue?: string | null;
    startDate: Date;
    endDate: Date;
  };
};

type StatusFilterType = "ALL" | InvoiceStatus | "OVERDUE";

export function InvoicesClient({
  initialInvoices,
  initialPage,
  initialSearch,
  initialTotalPages,
  initialCurrencyCode = "USD",
  error,
  eventId,
  eventData,
}: InvoicesClientProps) {
  const [isPending, startTransition] = useTransition();

  // State
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>(initialInvoices);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "view">("create");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [currencyCode, setCurrencyCode] = useState<string>(initialCurrencyCode);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<StatusFilterType>("ALL");
  const [stats, setStats] = useState<{
    total: number;
    unpaid: number;
    partiallyPaid: number;
    paid: number;
  } | null>(null);

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      const [financeSettings, categoriesResult] = await Promise.all([
        getFinanceSettings(),
        getServiceCategories(),
      ]);

      if (financeSettings.data?.currencyCode) {
        setCurrencyCode(financeSettings.data.currencyCode);
      }

      if (categoriesResult.data) {
        setServiceCategories(categoriesResult.data);
      }
    };

    fetchSettings();
  }, []);

  // Fetch stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  // Debounced search
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch data when search or page changes
  useEffect(() => {
    startTransition(async () => {
      const result = await getInvoices(currentPage, 20, debouncedSearchQuery, eventId);
      if (result.data) {
        const transformedInvoices = result.data.map((invoice) => ({
          ...invoice,
          createdAt: invoice.createdAt.toISOString(),
          invoiceDate: invoice.invoiceDate.toISOString(),
          dueDate: invoice.dueDate.toISOString(),
          lineItems: (invoice.lineItems as any[]) || [],
        }));
        setInvoices(transformedInvoices);
        setTotalPages(Math.ceil(transformedInvoices.length / 10));
      }
    });
  }, [debouncedSearchQuery, currentPage, eventId]);

  // Apply status filter
  useEffect(() => {
    let filtered = invoices;

    if (selectedStatus !== "ALL") {
      if (selectedStatus === "OVERDUE") {
        // Filter overdue invoices (unpaid or partially paid, and past due date)
        filtered = invoices.filter((invoice) => {
          const isOverdue = new Date(invoice.dueDate) < new Date();
          const isNotPaid = invoice.status === "UNPAID" || invoice.status === "PARTIALLY_PAID";
          return isOverdue && isNotPaid;
        });
      } else {
        filtered = invoices.filter((invoice) => invoice.status === selectedStatus);
      }
    }

    setFilteredInvoices(filtered);
  }, [invoices, selectedStatus]);

  const loadStats = () => {
    startTransition(async () => {
      const result = await getInvoicesStats();
      if (result.data) {
        setStats(result.data);
      }
    });
  };

  const handleCreateNew = () => {
    setSelectedInvoice(null);
    setSheetMode("create");
    setIsSheetOpen(true);
  };

  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setSheetMode("view");
    setIsSheetOpen(true);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSelectedInvoice(null);
  };

  const handleInvoiceSuccess = async () => {
    // Refresh data after successful create/update
    handleSheetClose();
    startTransition(async () => {
      const result = await getInvoices(currentPage, 20, debouncedSearchQuery, eventId);
      if (result.data) {
        const transformedInvoices = result.data.map((invoice) => ({
          ...invoice,
          createdAt: invoice.createdAt.toISOString(),
          invoiceDate: invoice.invoiceDate.toISOString(),
          dueDate: invoice.dueDate.toISOString(),
          lineItems: (invoice.lineItems as any[]) || [],
        }));
        setInvoices(transformedInvoices);
        setTotalPages(Math.ceil(transformedInvoices.length / 10));
      }
    });
    loadStats();
  };

  // Calculate overdue count
  const overdueCount = invoices.filter((invoice) => {
    const isOverdue = new Date(invoice.dueDate) < new Date();
    const isNotPaid = invoice.status === "UNPAID" || invoice.status === "PARTIALLY_PAID";
    return isOverdue && isNotPaid;
  }).length;

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <>
      {/* Header Actions */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-end">
          <div className="relative sm:w-64">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Button onClick={handleCreateNew}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedStatus === "ALL" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedStatus("ALL")}
          >
            All {stats && `(${stats.total})`}
          </Badge>
          <Badge
            variant={selectedStatus === "UNPAID" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedStatus("UNPAID")}
          >
            Unpaid {stats && `(${stats.unpaid})`}
          </Badge>
          <Badge
            variant={selectedStatus === "PARTIALLY_PAID" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedStatus("PARTIALLY_PAID")}
          >
            Partially Paid {stats && `(${stats.partiallyPaid})`}
          </Badge>
          <Badge
            variant={selectedStatus === "PAID" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedStatus("PAID")}
          >
            Paid {stats && `(${stats.paid})`}
          </Badge>
          <Badge
            variant={selectedStatus === "OVERDUE" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedStatus("OVERDUE")}
          >
            Overdue ({overdueCount})
          </Badge>
        </div>
      </div>

      {/* Invoices Table */}
      <InvoicesTable
        invoices={filteredInvoices}
        onView={handleView}
        isLoading={isPending}
        currencyCode={currencyCode}
        onUpdate={handleInvoiceSuccess}
      />

      {/* Pagination */}
      {filteredInvoices.length === 20 && (
        <div className="flex justify-center gap-2">
          {currentPage > 1 && (
            <Button
              variant="outline"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={isPending}
            >
              Previous
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={isPending}
          >
            Next
          </Button>
        </div>
      )}

      {/* Invoice Sheet */}
      <InvoiceSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        invoice={selectedInvoice as any}
        mode={sheetMode}
        onSuccess={handleInvoiceSuccess}
        currencyCode={currencyCode}
        serviceCategories={serviceCategories}
        eventData={eventData}
      />
    </>
  );
}
