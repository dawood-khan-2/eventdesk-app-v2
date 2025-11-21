"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import type { Lead, LeadStatus } from "@repo/database";
import { Pencil, Trash2 } from "lucide-react";
import { DeleteLeadDialog } from "./delete-lead-dialog";
import { useState } from "react";
import { cn } from "@repo/design-system/lib/utils";

interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  onLeadClick: (lead: Lead) => void;
  onEditClick: (lead: Lead) => void;
  onDeleteSuccess: () => void;
}

const statusConfig: Record<LeadStatus, { label: string; color: string; bgColor: string }> = {
  NEW: { label: "New", color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-50 dark:bg-blue-950/50" },
  CONTACTED: { label: "Contacted", color: "text-yellow-600 dark:text-yellow-400", bgColor: "bg-yellow-50 dark:bg-yellow-950/50" },
  PROPOSAL_SENT: { label: "Proposal Sent", color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-50 dark:bg-purple-950/50" },
  FOLLOW_UP: { label: "Follow Up", color: "text-orange-600 dark:text-orange-400", bgColor: "bg-orange-50 dark:bg-orange-950/50" },
  CONVERTED: { label: "Converted", color: "text-green-600 dark:text-green-400", bgColor: "bg-green-50 dark:bg-green-950/50" },
  LOST: { label: "Lost", color: "text-red-600 dark:text-red-400", bgColor: "bg-red-50 dark:bg-red-950/50" },
};

export function LeadsTable({
  leads,
  isLoading,
  onLeadClick,
  onEditClick,
  onDeleteSuccess,
}: LeadsTableProps) {
  const [deleteLeadId, setDeleteLeadId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="ml-auto h-4 w-16" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">No leads found</p>
            <p className="text-xs text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow
                key={lead.id}
                className="cursor-pointer"
                onClick={() => onLeadClick(lead)}
              >
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell>{lead.company || "-"}</TableCell>
                <TableCell>{lead.email || "-"}</TableCell>
                <TableCell>{lead.phone || "-"}</TableCell>
                <TableCell>
                  <Badge className={cn("border-0", statusConfig[lead.status].bgColor, statusConfig[lead.status].color)}>
                    {statusConfig[lead.status].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditClick(lead);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteLeadId(lead.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DeleteLeadDialog
        leadId={deleteLeadId}
        onOpenChange={(open: boolean) => !open && setDeleteLeadId(null)}
        onSuccess={onDeleteSuccess}
      />
    </>
  );
}
