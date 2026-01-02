"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@repo/design-system/components/ui/pagination";
import { Plus, Search, Filter, Calendar } from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import { BillsTable } from "./components/bills-table";
import { BillSheet } from "./components/bill-sheet";
import { searchBills, getBills } from "./actions";
import { getVendors } from "../vendors/actions";
import { getServiceCategories, getFinanceSettings } from "../settings/actions";
import { Header } from "../components/header";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/design-system/components/ui/popover";
import { Calendar as CalendarComponent } from "@repo/design-system/components/ui/calendar";
import { cn } from "@repo/design-system/lib/utils";
import { format } from "date-fns";

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

export default function BillsPage() {
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [bills, setBills] = useState<Bill[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [currencyCode, setCurrencyCode] = useState<string>("USD");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [sheetMode, setSheetMode] = useState<"create" | "view" | "edit">("create");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  // Load vendors, service categories, and currency settings on mount
  useEffect(() => {
    loadVendors();
    loadServiceCategories();
    loadCurrencySettings();
  }, []);

  // Load bills on mount
  useEffect(() => {
    loadBills();
  }, []);

  // Reload bills when debounced search query, status filter, or date range changes
  useEffect(() => {
    setCurrentPage(1); // Reset to first page on new search/filter
    loadBills(debouncedSearchQuery, selectedStatus === "all" ? undefined : selectedStatus as any, 1);
  }, [debouncedSearchQuery, selectedStatus, dateRange]);

  // Reload bills when page changes
  useEffect(() => {
    loadBills(debouncedSearchQuery, selectedStatus === "all" ? undefined : selectedStatus as any, currentPage);
  }, [currentPage]);

  const loadVendors = () => {
    startTransition(async () => {
      const result = await getVendors({ limit: 1000 });
      if (result.data) {
        setVendors(result.data);
      }
    });
  };

  const loadServiceCategories = () => {
    startTransition(async () => {
      const result = await getServiceCategories();
      if (result.data) {
        setServiceCategories(result.data);
      }
    });
  };

  const loadCurrencySettings = () => {
    startTransition(async () => {
      const result = await getFinanceSettings();
      if (result.data?.currencyCode) {
        setCurrencyCode(result.data.currencyCode);
      }
    });
  };

  const loadBills = (
    query?: string,
    status?: "UNPAID" | "PARTIALLY_PAID" | "PAID",
    page: number = 1
  ) => {
    startTransition(async () => {
      const offset = (page - 1) * itemsPerPage;
      const startDate = dateRange.from ? dateRange.from.toISOString() : undefined;
      const endDate = dateRange.to ? dateRange.to.toISOString() : undefined;

      const result = query
        ? await searchBills(query)
        : await getBills(page, itemsPerPage, "", undefined, status, startDate, endDate);

      if (result.data) {
        setBills(result.data);
        // For simplicity, we'll calculate total pages based on returned data
        setTotalPages(result.data.length === itemsPerPage ? page + 1 : page);
      }
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
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

  const handleSheetSuccess = () => {
    setIsSheetOpen(false);
    setSelectedBill(null);
    setSheetMode("create");
    setCurrentPage(1);
    loadBills(
      debouncedSearchQuery,
      selectedStatus === "all" ? undefined : (selectedStatus as any),
      1
    );
  };

  const handleDeleteSuccess = () => {
    setIsSheetOpen(false);
    setSelectedBill(null);
    setSheetMode("create");
    loadBills(
      debouncedSearchQuery,
      selectedStatus === "all" ? undefined : (selectedStatus as any),
      currentPage
    );
  };

  return (
    <>
      <Header page="Bills" pages={["Home"]} />
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
        {/* Row 1: Header with Search, Filters, and Add Button */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search bills..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            <Select value={selectedStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="UNPAID">Unpaid</SelectItem>
                <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-[240px] justify-start text-left font-normal",
                    !dateRange.from && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            <Button
              onClick={() => {
                setSelectedBill(null);
                setSheetMode("create");
                setIsSheetOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Bill
            </Button>
          </div>
        </div>

        {/* Row 2: Bills Table */}
        <BillsTable
          bills={bills}
          isLoading={isPending}
          onBillClick={handleBillClick}
          onEditClick={handleEditClick}
          onDeleteSuccess={handleDeleteSuccess}
          currencyCode={currencyCode}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={
                    currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                const showPage =
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1);

                if (!showPage) {
                  // Show ellipsis
                  if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  return null;
                }

                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      <BillSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        bill={selectedBill}
        mode={sheetMode}
        onSuccess={handleSheetSuccess}
        vendors={vendors}
        serviceCategories={serviceCategories}
        currencyCode={currencyCode}
      />
    </>
  );
}
