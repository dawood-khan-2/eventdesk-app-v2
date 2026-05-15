"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { PlusIcon, SearchIcon, X } from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import { EstimatesTable } from "./estimates-table";
import { EstimateSheet } from "./estimate-sheet";
import { getEstimates } from "../actions";
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

type Estimate = {
  id: string;
  title: string;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  eventName?: string | null;
  eventVenue?: string | null;
  eventStartDate?: string | null;
  eventEndDate?: string | null;
  createdAt: string;
  client?: { name: string; email: string | null } | null;
  lead?: { name: string; email: string | null } | null;
  lineItems: any[];
  discount?: number | null;
};

type ServiceCategory = {
  id: string;
  name: string;
};

type EstimatesClientProps = {
  initialEstimates: Estimate[];
  initialPage: number;
  initialSearch: string;
  initialTotalPages: number;
  error?: string;
  // Event context for filtering and auto-fill
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

export function EstimatesClient({
  initialEstimates,
  initialPage,
  initialSearch,
  initialTotalPages,
  error,
  eventId,
  eventData,
}: EstimatesClientProps) {
  const [isPending, startTransition] = useTransition();
  
  // State
  const [estimates, setEstimates] = useState<Estimate[]>(initialEstimates);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"create" | "view" | "edit">("create");
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);
  const [currencyCode, setCurrencyCode] = useState<string>("USD");
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);

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

  // Debounced search
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch data when search or page changes
  useEffect(() => {
    startTransition(async () => {
      const result = await getEstimates(currentPage, 20, debouncedSearchQuery, eventId);
      if (result.data) {
        const transformedEstimates = result.data.map(estimate => ({
          ...estimate,
          createdAt: estimate.createdAt.toISOString(),
          eventStartDate: estimate.eventStartDate?.toISOString() || null,
          eventEndDate: estimate.eventEndDate?.toISOString() || null,
          lineItems: (estimate.lineItems as any[]) || []
        }));
        setEstimates(transformedEstimates);
        setTotalPages(Math.ceil(transformedEstimates.length / 10));
      }
    });
  }, [debouncedSearchQuery, currentPage, eventId]);

  const handleCreateNew = () => {
    setSelectedEstimate(null);
    setSheetMode("create");
    setIsSheetOpen(true);
  };

  const handleView = (estimate: Estimate) => {
    setSelectedEstimate(estimate);
    setSheetMode("view");
    setIsSheetOpen(true);
  };

  const handleEdit = (estimate: Estimate) => {
    setSelectedEstimate(estimate);
    setSheetMode("edit");
    setIsSheetOpen(true);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSelectedEstimate(null);
  };

  const handleEstimateSuccess = async () => {
    // Refresh data after successful create/update
    handleSheetClose();
    startTransition(async () => {
      const [estimatesResult, categoriesResult] = await Promise.all([
        getEstimates(currentPage, 20, debouncedSearchQuery, eventId),
        getServiceCategories(),
      ]);
      
      if (estimatesResult.data) {
        const transformedEstimates = estimatesResult.data.map(estimate => ({
          ...estimate,
          createdAt: estimate.createdAt.toISOString(),
          eventStartDate: estimate.eventStartDate?.toISOString() || null,
          eventEndDate: estimate.eventEndDate?.toISOString() || null,
          lineItems: (estimate.lineItems as any[]) || []
        }));
        setEstimates(transformedEstimates);
        setTotalPages(Math.ceil(transformedEstimates.length / 10));
      }
      
      if (categoriesResult.data) {
        setServiceCategories(categoriesResult.data);
      }
    });
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
      <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-end">
        <div className="relative sm:w-64">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search estimates..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            className="pl-9"
          />
        </div>
        <Button onClick={handleCreateNew} data-tour={eventId ? "create-estimate-button-event" : "create-estimate-button"}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Estimate
        </Button>
      </div>

      {/* Estimates Table */}
      <EstimatesTable
        estimates={estimates}
        onEdit={handleEdit}
        onView={handleView}
        isLoading={isPending}
        currencyCode={currencyCode}
        onDelete={handleEstimateSuccess}
      />

      {/* Pagination */}
      {estimates.length === 20 && (
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

      {/* Estimate Sheet */}
      <EstimateSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        estimate={selectedEstimate}
        mode={sheetMode}
        onSuccess={handleEstimateSuccess}
        currencyCode={currencyCode}
        serviceCategories={serviceCategories}
        eventData={eventData}
      />
    </>
  );
};