"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { updateItinerary, deleteItinerary } from "../actions";
import { toast } from "sonner";
import { format } from "date-fns";

interface ItineraryActionsProps {
  itinerary: {
    id: string;
    title: string;
    date: Date | string;
  };
  onSuccess: () => void;
}

export function ItineraryEditDialog({
  open,
  onOpenChange,
  itinerary,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itinerary: { id: string; title: string; date: Date | string } | null;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");

  // Update local state when itinerary changes
  useEffect(() => {
    if (itinerary) {
      setTitle(itinerary.title);
      setTime(format(new Date(itinerary.date), "HH:mm"));
    }
  }, [itinerary]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!itinerary) return;

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    startTransition(async () => {
      // Combine existing date with new time
      const existingDate = new Date(itinerary.date);
      const [hours, minutes] = time.split(":").map(Number);

      if (!isNaN(hours) && !isNaN(minutes)) {
        existingDate.setHours(hours, minutes, 0, 0);
      }

      const result = await updateItinerary({
        id: itinerary.id,
        title: title.trim(),
        date: existingDate.toISOString(),
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Itinerary item updated successfully");
      onSuccess();
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Itinerary Item</DialogTitle>
            <DialogDescription>
              Update the title or time for this itinerary item.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Registration, Keynote Speech"
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ItineraryDeleteDialog({
  open,
  onOpenChange,
  itinerary,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itinerary: { id: string; title: string } | null;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!itinerary) return;

    startTransition(async () => {
      const result = await deleteItinerary(itinerary.id);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Itinerary item deleted successfully");
      onSuccess();
      onOpenChange(false);
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete "{itinerary?.title}". This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
