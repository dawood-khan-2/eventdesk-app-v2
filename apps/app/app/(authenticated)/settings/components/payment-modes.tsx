"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/design-system/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/design-system/components/ui/alert-dialog";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { toast } from "sonner";
import { PlusIcon, XIcon } from "lucide-react";
import { useState, useTransition } from "react";
import {
  createPaymentMode,
  deletePaymentMode,
  updatePaymentMode,
  type CreatePaymentModeInput,
  type UpdatePaymentModeInput,
} from "../actions";

type PaymentMode = {
  id: string;
  name: string;
};

type PaymentModesProps = {
  paymentModes: PaymentMode[];
};

export function PaymentModes({ paymentModes }: PaymentModesProps) {
  const [isPending, startTransition] = useTransition();
  const [editingMode, setEditingMode] = useState<PaymentMode | null>(null);
  const [deletingMode, setDeletingMode] = useState<PaymentMode | null>(null);
  const [newModeName, setNewModeName] = useState("");
  const [editModeName, setEditModeName] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleCreate = (data: CreatePaymentModeInput) => {
    startTransition(async () => {
      const result = await createPaymentMode(data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Payment mode created successfully");
      setNewModeName("");
      setIsAddDialogOpen(false);
    });
  };

  const handleUpdate = (data: UpdatePaymentModeInput) => {
    startTransition(async () => {
      const result = await updatePaymentMode(data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Payment mode updated successfully");
      setEditingMode(null);
      setEditModeName("");
      setIsEditDialogOpen(false);
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deletePaymentMode(id);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Payment mode deleted successfully");
      setDeletingMode(null);
    });
  };

  const confirmDelete = (mode: PaymentMode) => {
    setDeletingMode(mode);
  };

  const openEditDialog = (mode: PaymentMode) => {
    setEditingMode(mode);
    setEditModeName(mode.name);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Payment Modes Display */}
      <div className="flex flex-wrap gap-2">
        {paymentModes.map((mode) => (
          <div key={mode.id} className="group relative">
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-muted"
              onClick={() => openEditDialog(mode)}
            >
              <span>{mode.name}</span>
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-red-500 p-0 text-white opacity-100 hover:bg-red-600 z-10 md:opacity-0 md:group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                confirmDelete(mode);
              }}
              disabled={isPending}
            >
              <XIcon className="h-2.5 w-2.5" />
            </Button>
          </div>
        ))}

        {/* Add Payment Mode Button */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-muted"
            >
              <PlusIcon className="mr-1 h-3 w-3" />
              Add Payment Mode
            </Badge>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Payment Mode</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newModeName.trim()) {
                  handleCreate({ name: newModeName.trim() });
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="mode-name">Payment Mode Name</Label>
                <Input
                  id="mode-name"
                  value={newModeName}
                  onChange={(e) => setNewModeName(e.target.value)}
                  placeholder="e.g., Cash, Cheque, Bank Transfer"
                  disabled={isPending}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setNewModeName("");
                    setIsAddDialogOpen(false);
                  }}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending || !newModeName.trim()}>
                  {isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Payment Mode Dialog */}
      {editingMode && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Payment Mode</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editModeName.trim()) {
                  handleUpdate({
                    id: editingMode.id,
                    name: editModeName.trim(),
                  });
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="edit-mode-name">Payment Mode Name</Label>
                <Input
                  id="edit-mode-name"
                  value={editModeName}
                  onChange={(e) => setEditModeName(e.target.value)}
                  placeholder="e.g., Cash, Cheque, Bank Transfer"
                  disabled={isPending}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingMode(null);
                    setEditModeName("");
                    setIsEditDialogOpen(false);
                  }}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending || !editModeName.trim()}>
                  {isPending ? "Updating..." : "Update"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingMode} onOpenChange={() => setDeletingMode(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the payment mode "{deletingMode?.name}". This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingMode && handleDelete(deletingMode.id)}
              disabled={isPending}
              className="bg-red-500 hover:bg-red-600"
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
