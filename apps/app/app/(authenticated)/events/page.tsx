"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { useProductTour } from "@/lib/use-product-tour";
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
import type { EventFilter } from "./actions";
import { EventStatsCards } from "./components/event-stat-cards";
import { EventsTable } from "./components/events-table";
import { EventSheet } from "./components/event-sheet";
import { searchEvents, getEvents, getEventsStats } from "./actions";
import { Header } from "../components/header";
import { getUserRole } from "../lib/get-user-role";

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

export default function EventsPage() {
  useProductTour();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedFilter, setSelectedFilter] = useState<EventFilter | undefined>();
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<{ total: number; byFilter: Record<EventFilter, number> } | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [sheetMode, setSheetMode] = useState<"create" | "view" | "edit">("create");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userRole, setUserRole] = useState<string | null>(null);
  const itemsPerPage = 20;

  // Load user role
  useEffect(() => {
    async function loadRole() {
      const role = await getUserRole();
      setUserRole(role);
    }
    loadRole();
  }, []);

  // Load events and stats on mount
  useEffect(() => {
    loadEvents();
    loadStats();
  }, []);

  // Reload events when debounced search query or filter changes
  useEffect(() => {
    setCurrentPage(1); // Reset to first page on new search/filter
    loadEvents(selectedFilter, debouncedSearchQuery, 1);
  }, [debouncedSearchQuery, selectedFilter]);

  // Reload events when page changes
  useEffect(() => {
    loadEvents(selectedFilter, debouncedSearchQuery, currentPage);
  }, [currentPage]);

  const loadEvents = (filter?: EventFilter, query?: string, page: number = 1) => {
    startTransition(async () => {
      const offset = (page - 1) * itemsPerPage;
      const result = query 
        ? await searchEvents({ query, filter, limit: itemsPerPage, offset })
        : await getEvents({ filter, limit: itemsPerPage, offset });
      
      if (result.data) {
        setEvents(result.data);
        
        // Calculate total pages based on stats
        if (stats) {
          const total = filter ? stats.byFilter[filter] : stats.total;
          setTotalPages(Math.ceil(total / itemsPerPage));
        }
      }
    });
  };

  const loadStats = () => {
    startTransition(async () => {
      const result = await getEventsStats();
      if (result.data) {
        setStats(result.data);
        // Update total pages when stats are loaded
        const total = selectedFilter ? result.data.byFilter[selectedFilter] : result.data.total;
        setTotalPages(Math.ceil(total / itemsPerPage));
      }
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterClick = (filter: EventFilter | undefined) => {
    setSelectedFilter(filter);
  };

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setSheetMode("view");
    setIsSheetOpen(true);
  };

  const handleSheetSuccess = () => {
    setIsSheetOpen(false);
    setSelectedEvent(null);
    setSheetMode("create");
    setCurrentPage(1);
    loadEvents(selectedFilter, debouncedSearchQuery, 1);
    loadStats();
  };

  return (
    <>
      <Header page="Events" pages={["Home"]}/>
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
        {/* Row 1: Header with Search, and Add Button */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">       
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search events..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            
            {/* Hide Add Event button for org:member */}
            {userRole !== "org:member" && (
              <Button 
                data-tour="create-event-button"
                onClick={() => {
                  setSelectedEvent(null);
                  setSheetMode("create");
                  setIsSheetOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
            )}
          </div>
        </div>

        {/* Row 2: Filter Cards */}
        {stats && (
          <EventStatsCards
            stats={stats}
            selectedFilter={selectedFilter}
            onFilterClick={handleFilterClick}
          />
        )}

        {/* Row 3: Events Table */}
        <EventsTable
          events={events}
          isLoading={isPending}
          onEventClick={handleEventClick}
          userRole={userRole}
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

        {/* Event Sheet (Create/View/Edit) */}
        <EventSheet
          open={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          event={selectedEvent}
          mode={sheetMode}
          onSuccess={handleSheetSuccess}
        />
      </div>
    </>
  );
}
