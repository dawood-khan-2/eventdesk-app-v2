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
import { Plus, Search, Filter } from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import { VendorsTable } from "./components/vendors-table";
import { VendorSheet } from "./components/vendor-sheet";
import { searchVendors, getVendors } from "./actions";
import { getServiceCategories } from "../settings/actions";
import { Header } from "../components/header";

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

type Vendor = {
  id: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
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

export default function VendorsPage() {
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<string>("all");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [sheetMode, setSheetMode] = useState<"create" | "view" | "edit">("create");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  // Load service categories on mount
  useEffect(() => {
    loadServiceCategories();
  }, []);

  // Load vendors on mount
  useEffect(() => {
    loadVendors();
  }, []);

  // Reload vendors when debounced search query or service filter changes
  useEffect(() => {
    setCurrentPage(1); // Reset to first page on new search/filter
    loadVendors(debouncedSearchQuery, selectedServiceCategory === "all" ? undefined : selectedServiceCategory, 1);
  }, [debouncedSearchQuery, selectedServiceCategory]);

  // Reload vendors when page changes
  useEffect(() => {
    loadVendors(debouncedSearchQuery, selectedServiceCategory === "all" ? undefined : selectedServiceCategory, currentPage);
  }, [currentPage]);

  const loadServiceCategories = () => {
    startTransition(async () => {
      const result = await getServiceCategories();
      if (result.data) {
        setServiceCategories(result.data);
      }
    });
  };

  const loadVendors = (query?: string, serviceCategoryId?: string, page: number = 1) => {
    startTransition(async () => {
      const offset = (page - 1) * itemsPerPage;
      const result = query || serviceCategoryId
        ? await searchVendors({ query, serviceCategoryId, limit: itemsPerPage, offset })
        : await getVendors({ limit: itemsPerPage, offset });
      
      if (result.data) {
        setVendors(result.data);
        // For simplicity, we'll calculate total pages based on returned data
        // In a real app, you'd want the backend to return total count
        setTotalPages(result.data.length === itemsPerPage ? page + 1 : page);
      }
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleServiceCategoryChange = (value: string) => {
    setSelectedServiceCategory(value);
  };

  const handleVendorClick = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setSheetMode("view");
    setIsSheetOpen(true);
  };

  const handleEditClick = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setSheetMode("edit");
    setIsSheetOpen(true);
  };

  const handleSheetSuccess = () => {
    setIsSheetOpen(false);
    setSelectedVendor(null);
    setSheetMode("create");
    setCurrentPage(1);
    loadVendors(debouncedSearchQuery, selectedServiceCategory === "all" ? undefined : selectedServiceCategory, 1);
  };

  const handleDeleteSuccess = () => {
    setIsSheetOpen(false);
    setSelectedVendor(null);
    setSheetMode("create");
    loadVendors(debouncedSearchQuery, selectedServiceCategory === "all" ? undefined : selectedServiceCategory, currentPage);
  };

  return (
    <>
      <Header page="Vendors" pages={["Home"]}/>
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
        {/* Row 1: Header with Search, Filter, and Add Button */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search vendors..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>

            <Select value={selectedServiceCategory} onValueChange={handleServiceCategoryChange}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {serviceCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button onClick={() => {
              setSelectedVendor(null);
              setSheetMode("create");
              setIsSheetOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Button>
          </div>
        </div>

        {/* Row 2: Vendors Table */}
        <VendorsTable
          vendors={vendors}
          isLoading={isPending}
          onVendorClick={handleVendorClick}
          onEditClick={handleEditClick}
          onDeleteSuccess={handleDeleteSuccess}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      <VendorSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        vendor={selectedVendor}
        mode={sheetMode}
        onSuccess={handleSheetSuccess}
        serviceCategories={serviceCategories}
      />
    </>
  );
}
