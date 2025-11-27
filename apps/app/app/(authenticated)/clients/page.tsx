"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
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
import type { Client } from "@repo/database";
import { ClientsTable } from "./components/clients-table";
import { ClientSheet } from "./components/client-sheet";
import { searchClients, getClients, getClientsStats } from "./actions";
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

export default function ClientsPage() {
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<{ total: number } | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [sheetMode, setSheetMode] = useState<"create" | "view" | "edit">("create");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  // Load clients and stats on mount
  useEffect(() => {
    loadClients();
    loadStats();
  }, []);

  // Reload clients when debounced search query changes
  useEffect(() => {
    setCurrentPage(1); // Reset to first page on new search
    loadClients(debouncedSearchQuery, 1);
  }, [debouncedSearchQuery]);

  // Reload clients when page changes
  useEffect(() => {
    loadClients(debouncedSearchQuery, currentPage);
  }, [currentPage]);

  const loadClients = (query?: string, page: number = 1) => {
    startTransition(async () => {
      const offset = (page - 1) * itemsPerPage;
      const result = query 
        ? await searchClients({ query, limit: itemsPerPage, offset })
        : await getClients({ limit: itemsPerPage, offset });
      
      if (result.data) {
        setClients(result.data);
        
        // Calculate total pages based on stats
        if (stats) {
          setTotalPages(Math.ceil(stats.total / itemsPerPage));
        }
      }
    });
  };

  const loadStats = () => {
    startTransition(async () => {
      const result = await getClientsStats();
      if (result.data) {
        setStats(result.data);
        // Update total pages when stats are loaded
        setTotalPages(Math.ceil(result.data.total / itemsPerPage));
      }
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setSheetMode("view");
    setIsSheetOpen(true);
  };

  const handleEditClick = (client: Client) => {
    setSelectedClient(client);
    setSheetMode("edit");
    setIsSheetOpen(true);
  };

  const handleSheetSuccess = () => {
    setIsSheetOpen(false);
    setSelectedClient(null);
    setSheetMode("create");
    setCurrentPage(1);
    loadClients(debouncedSearchQuery, 1);
    loadStats();
  };

  const handleDeleteSuccess = () => {
    setIsSheetOpen(false);
    setSelectedClient(null);
    setSheetMode("create");
    loadClients(debouncedSearchQuery, currentPage);
    loadStats();
  };

  return (
    <>
      <Header page="Clients" pages={["Home"]}/>
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
        {/* Row 1: Header with Search and Add Button */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search clients..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            
            <Button onClick={() => {
              setSelectedClient(null);
              setSheetMode("create");
              setIsSheetOpen(true);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </div>
        </div>

        {/* Row 2: Clients Table */}
        <ClientsTable
          clients={clients}
          isLoading={isPending}
          onClientClick={handleClientClick}
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

      <ClientSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        client={selectedClient}
        mode={sheetMode}
        onSuccess={handleSheetSuccess}
      />
    </>
  );
}
