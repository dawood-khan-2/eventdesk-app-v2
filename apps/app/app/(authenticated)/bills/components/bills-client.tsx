"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Badge } from "@repo/design-system/components/ui/badge";
import { PlusIcon, SearchIcon } from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import { BillsTable } from "./bills-table";
import { BillSheet } from "./bill-sheet";
import { getBills, getBillsStats } from "../actions";
import { getVendors } from "../../vendors/actions";
import { getFinanceSettings, getServiceCategories } from "../../settings/actions";

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

type Bill = {
  id: string;
  number: string;
  vendorId: string;
  serviceCategoryId: string;
  eventId: string;
  billDate: Date;
  dueDate: Date;
  amount: number;
  attachmentUrl?: string | null;
  status: "UNPAID" | "PARTIALLY_PAID" | "PAID";
  amountPaid: number;
  balanceDue: number;
  createdAt: Date;
  updatedAt: Date;
  vendor: {
    id: string;
    companyName: string;
    contactName: string | null;
    email: string | null;
  };
  serviceCategory: {
    id: string;
    name: string;
  };
  event: {
    id: string;
    name: string;
  };
  paymentRecords: Array<{
    id: string;
    amount: number;
    paymentDate: Date;
    referenceNumber: string | null;
    paymentMode: {
      name: string;
    };
  }>;
};

type Vendor = {
  id: string;
  companyName: string;
  services: Array<{
    id: string;
    service: {
      id: string;
      name: string;
    };
  }>;
};

type ServiceCategory = {
  id: string;
  name: string;
};

type BillsClientProps = {
  initialBills: Bill[];
  initialPage: number;
  initialSearch: string;
  initialTotalPages: number;
  initialCurrencyCode?: string;
  error?: string;
  eventId?: string;
  hideEventColumn?: boolean;
  eventData?: {
    id: string;
    name: string;
  };
};

type StatusFilterType = "ALL" | "UNPAID" | "PARTIALLY_PAID" | "PAID";

export function BillsClient({
  initialBills,
  initialPage,
  initialSearch,
  initialTotalPages,
  initialCurrencyCode = "USD",
  error,
  eventId,
  hideEventColumn = false,
  eventData,
}: BillsClientProps) {
  const [isPending, startTransition] = useTransition();

  // State
  const [bills, setBills] = useState<Bill[]>(initialBills);
  const [filteredBills, setFilteredBills] = useState<Bill[]>(initialBills);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "view" | "edit">("create");
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [currencyCode, setCurrencyCode] = useState<string>(initialCurrencyCode);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<StatusFilterType>("ALL");
  const [stats, setStats] = useState<{
    total: number;
    unpaid: number;
    partiallyPaid: number;
    paid: number;
  } | null>(null);

  // Fetch settings and vendors on mount
  useEffect(() => {
    const fetchData = async () => {
      const [financeSettings, categoriesResult, vendorsResult] = await Promise.all([
        getFinanceSettings(),
        getServiceCategories(),
        getVendors({ limit: 1000 }),
      ]);

      if (financeSettings.data?.currencyCode) {
        setCurrencyCode(financeSettings.data.currencyCode);
      }

      if (categoriesResult.data) {
        setServiceCategories(categoriesResult.data);
      }

      if (vendorsResult.data) {
        setVendors(vendorsResult.data);
      }
    };

    fetchData();
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
      const result = await getBills(
        currentPage,
        20,
        debouncedSearchQuery,
        eventId,
        selectedStatus === "ALL" ? undefined : selectedStatus
      );
      if (result.data) {
        setBills(result.data);
        setTotalPages(Math.ceil(result.data.length / 10));
      }
    });
  }, [debouncedSearchQuery, currentPage, eventId, selectedStatus]);

  // Apply status filter
  useEffect(() => {
    let filtered = bills;

    if (selectedStatus !== "ALL") {
      filtered = bills.filter((bill) => bill.status === selectedStatus);
    }

    setFilteredBills(filtered);
  }, [bills, selectedStatus]);

  const loadStats = () => {
    startTransition(async () => {
      const result = await getBillsStats();
      if (result.data) {
        setStats(result.data);
      }
    });
  };

  const handleCreateNew = () => {
    setSelectedBill(null);
    setSheetMode("create");
    setIsSheetOpen(true);
  };

  const handleBillClick = (bill: Bill) => {
    setSelectedBill(bill);
    setSheetMode("view");
    setIsSheetOpen(true);
  };

  const handleEditClick = (bill: Bill) => {
    setSelectedBill(bill);
    setSheetMode("edit");
    setIsSheetOpen(true);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSelectedBill(null);
    setSheetMode("create");
  };

  const handleBillSuccess = async () => {
    // Refresh data after successful create/update
    handleSheetClose();
    startTransition(async () => {
      const result = await getBills(
        currentPage,
        20,
        debouncedSearchQuery,
        eventId,
        selectedStatus === "ALL" ? undefined : selectedStatus
      );
      if (result.data) {
        setBills(result.data);
        setTotalPages(Math.ceil(result.data.length / 10));
      }
    });
    loadStats();
  };

  const handleDeleteSuccess = async () => {
    // Refresh data after successful delete
    startTransition(async () => {
      const result = await getBills(
        currentPage,
        20,
        debouncedSearchQuery,
        eventId,
        selectedStatus === "ALL" ? undefined : selectedStatus
      );
      if (result.data) {
        setBills(result.data);
        setTotalPages(Math.ceil(result.data.length / 10));
      }
    });
    loadStats();
  };

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
              placeholder="Search bills..."
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
            Add Bill
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
        </div>
      </div>

      {/* Bills Table */}
      <BillsTable
        bills={filteredBills}
        isLoading={isPending}
        onBillClick={handleBillClick}
        onEditClick={handleEditClick}
        onDeleteSuccess={handleDeleteSuccess}
        currencyCode={currencyCode}
        hideEventColumn={hideEventColumn}
      />

      {/* Pagination */}
      {filteredBills.length === 20 && (
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

      {/* Bill Sheet */}
      <BillSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        bill={selectedBill}
        mode={sheetMode}
        onSuccess={handleBillSuccess}
        vendors={vendors}
        serviceCategories={serviceCategories}
        currencyCode={currencyCode}
        eventData={eventData}
      />
    </>
  );
}
