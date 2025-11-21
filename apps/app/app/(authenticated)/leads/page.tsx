"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Badge } from "@repo/design-system/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@repo/design-system/components/ui/pagination";
import { Plus, Search } from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import type { Lead, LeadStatus } from "@repo/database";
import { LeadStatsCards } from "./components/lead-stats-cards";
import { LeadsTable } from "./components/leads-table";
import { LeadSheet } from "./components/lead-sheet";
import { searchLeads, getLeads, getLeadsStats } from "./actions";

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

export default function LeadsPage() {
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | undefined>();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<{ total: number; byStatus: Record<LeadStatus, number> } | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sheetMode, setSheetMode] = useState<"create" | "view" | "edit">("create");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  // Load leads and stats on mount
  useEffect(() => {
    loadLeads();
    loadStats();
  }, []);

  // Reload leads when debounced search query or status changes
  useEffect(() => {
    setCurrentPage(1); // Reset to first page on new search/filter
    loadLeads(selectedStatus, debouncedSearchQuery, 1);
  }, [debouncedSearchQuery, selectedStatus]);

  // Reload leads when page changes
  useEffect(() => {
    loadLeads(selectedStatus, debouncedSearchQuery, currentPage);
  }, [currentPage]);

  const loadLeads = (status?: LeadStatus, query?: string, page: number = 1) => {
    startTransition(async () => {
      const offset = (page - 1) * itemsPerPage;
      const result = query 
        ? await searchLeads({ query, status, limit: itemsPerPage, offset })
        : await getLeads({ status, limit: itemsPerPage, offset });
      
      if (result.data) {
        setLeads(result.data);
        
        // Calculate total pages based on stats
        if (stats) {
          const total = status ? stats.byStatus[status] : stats.total;
          setTotalPages(Math.ceil(total / itemsPerPage));
        }
      }
    });
  };

  const loadStats = () => {
    startTransition(async () => {
      const result = await getLeadsStats();
      if (result.data) {
        setStats(result.data);
        // Update total pages when stats are loaded
        const total = selectedStatus ? result.data.byStatus[selectedStatus] : result.data.total;
        setTotalPages(Math.ceil(total / itemsPerPage));
      }
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleStatusFilter = (status: LeadStatus | undefined) => {
    setSelectedStatus(status);
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setSheetMode("view");
    setIsSheetOpen(true);
  };

  const handleEditClick = (lead: Lead) => {
    setSelectedLead(lead);
    setSheetMode("edit");
    setIsSheetOpen(true);
  };

  const handleSheetSuccess = () => {
    setIsSheetOpen(false);
    setSelectedLead(null);
    setSheetMode("create");
    setCurrentPage(1);
    loadLeads(selectedStatus, debouncedSearchQuery, 1);
    loadStats();
  };

  const handleDeleteSuccess = () => {
    setIsSheetOpen(false);
    setSelectedLead(null);
    setSheetMode("create");
    loadLeads(selectedStatus, debouncedSearchQuery, currentPage);
    loadStats();
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
      {/* Row 1: Header with Title, Search, and Add Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          {stats && (
            <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums">
              {stats.total}
            </Badge>
          )}
        </div>
        
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search leads..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          
          <Button onClick={() => {
            setSelectedLead(null);
            setSheetMode("create");
            setIsSheetOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Row 2: Status Cards */}
      {stats && (
        <LeadStatsCards
          stats={stats}
          selectedStatus={selectedStatus}
          onStatusClick={handleStatusFilter}
        />
      )}

      {/* Row 3: Leads Table */}
      <LeadsTable
        leads={leads}
        isLoading={isPending}
        onLeadClick={handleLeadClick}
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
              
              const showEllipsis = 
                (page === currentPage - 2 && currentPage > 3) ||
                (page === currentPage + 2 && currentPage < totalPages - 2);

              if (showEllipsis) {
                return (
                  <PaginationItem key={page}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }

              if (!showPage) return null;

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

      {/* Lead Sheet (Create/View/Edit) */}
      <LeadSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        lead={selectedLead}
        mode={sheetMode}
        onSuccess={handleSheetSuccess}
      />
    </div>
  );
}
