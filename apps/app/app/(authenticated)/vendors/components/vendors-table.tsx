"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Card, CardContent } from "@repo/design-system/components/ui/card";
import { Badge } from "@repo/design-system/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import { Skeleton } from "@repo/design-system/components/ui/skeleton";
import { Pencil, Trash2, MoreVertical } from "lucide-react";
import { DeleteVendorDialog } from "./delete-vendor-dialog";
import { useState } from "react";

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

interface VendorsTableProps {
  vendors: Vendor[];
  isLoading: boolean;
  onVendorClick: (vendor: Vendor) => void;
  onEditClick: (vendor: Vendor) => void;
  onDeleteSuccess: () => void;
}

export function VendorsTable({
  vendors,
  isLoading,
  onVendorClick,
  onEditClick,
  onDeleteSuccess,
}: VendorsTableProps) {
  const [deleteVendorId, setDeleteVendorId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <>
        {/* Mobile Loading */}
        <div className="flex flex-col gap-3 md:hidden">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-24 mb-1" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Desktop Loading */}
        <div className="hidden md:block rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Services</TableHead>
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
      </>
    );
  }

  if (vendors.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">No vendors found</p>
            <p className="text-xs text-muted-foreground">
              Try adjusting your search or filter
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="flex flex-col gap-3 md:hidden">
        {vendors.map((vendor) => (
          <Card
            key={vendor.id}
            className="cursor-pointer transition-colors hover:bg-accent"
            onClick={() => onVendorClick(vendor)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-medium">{vendor.companyName}</h3>
                  {vendor.contactName && (
                    <p className="text-sm text-muted-foreground">{vendor.contactName}</p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditClick(vendor);
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteVendorId(vendor.id);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="space-y-1 text-sm mb-3">
                {vendor.email && (
                  <p className="text-muted-foreground">{vendor.email}</p>
                )}
                {vendor.phone && (
                  <p className="text-muted-foreground">{vendor.phone}</p>
                )}
              </div>

              {vendor.services.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {vendor.services.map((service) => (
                    <Badge key={service.id} variant="secondary" className="text-xs">
                      {service.service.name}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company Name</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Services</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map((vendor) => (
              <TableRow
                key={vendor.id}
                className="cursor-pointer"
                onClick={() => onVendorClick(vendor)}
              >
                <TableCell className="font-medium">{vendor.companyName}</TableCell>
                <TableCell>{vendor.contactName || "-"}</TableCell>
                <TableCell>{vendor.email || "-"}</TableCell>
                <TableCell>{vendor.phone || "-"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {vendor.services.length > 0 ? (
                      vendor.services.slice(0, 2).map((service) => (
                        <Badge key={service.id} variant="secondary" className="text-xs">
                          {service.service.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                    {vendor.services.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{vendor.services.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditClick(vendor);
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
                        setDeleteVendorId(vendor.id);
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

      <DeleteVendorDialog
        vendorId={deleteVendorId}
        onOpenChange={(open: boolean) => !open && setDeleteVendorId(null)}
        onSuccess={onDeleteSuccess}
      />
    </>
  );
}
