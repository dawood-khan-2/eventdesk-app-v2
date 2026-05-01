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
  createServiceCategory,
  deleteServiceCategory,
  updateServiceCategory,
  type CreateServiceCategoryInput,
  type UpdateServiceCategoryInput,
} from "../actions";

const SAMPLE_CATEGORIES = [
  "Venue & Infrastructure",
  "Decor & Styling",
  "Catering & Beverages",
  "Entertainment & Artists",
  "Photography & Videography",
  "Audio-Visual & Production",
  "Logistics & Transportation",
  "Guest Management & Registration",
  "Invitations & Communication",
  "Gifting & Merchandise",
  "Permissions, Security & Compliance",
  "Post-Event Services",
];

type ServiceCategory = {
  id: string;
  name: string;
};

type ServiceCategoriesProps = {
  categories: ServiceCategory[];
};

export function ServiceCategories({ categories }: ServiceCategoriesProps) {
  const [isPending, startTransition] = useTransition();
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<ServiceCategory | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editCategoryName, setEditCategoryName] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleCreate = (data: CreateServiceCategoryInput) => {
    startTransition(async () => {
      const result = await createServiceCategory(data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Service category created successfully");
      setNewCategoryName("");
      setIsAddDialogOpen(false);
    });
  };

  const handleUpdate = (data: UpdateServiceCategoryInput) => {
    startTransition(async () => {
      const result = await updateServiceCategory(data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Service category updated successfully");
      setEditingCategory(null);
      setEditCategoryName("");
      setIsEditDialogOpen(false);
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteServiceCategory(id);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Service category deleted successfully");
      setDeletingCategory(null);
    });
  };

  const confirmDelete = (category: ServiceCategory) => {
    setDeletingCategory(category);
  };

  const openEditDialog = (category: ServiceCategory) => {
    setEditingCategory(category);
    setEditCategoryName(category.name);
    setIsEditDialogOpen(true);
  };

  // Filter out sample categories that already exist
  const availableSamples = SAMPLE_CATEGORIES.filter(
    (sample) => !categories.some(
      (cat) => cat.name.toLowerCase() === sample.toLowerCase()
    )
  );

  const handleQuickAdd = (categoryName: string) => {
    startTransition(async () => {
      const result = await createServiceCategory({ name: categoryName });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(`"${categoryName}" added successfully`);
    });
  };

  return (
    <div className="space-y-4">
      {/* Quick Add Sample Categories */}
      {availableSamples.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Quick Add</Label>
          <div className="flex flex-wrap gap-2">
            {availableSamples.map((sample) => (
              <Badge
                key={sample}
                variant="outline"
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => handleQuickAdd(sample)}
              >
                <PlusIcon className="mr-1 h-3 w-3" />
                {sample}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Categories Display */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <div key={category.id} className="group relative">
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-muted"
              onClick={() => openEditDialog(category)}
            >
              <span>{category.name}</span>
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-red-500 p-0 text-white opacity-100 hover:bg-red-600 z-10 md:opacity-0 md:group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                confirmDelete(category);
              }}
              disabled={isPending}
            >
              <XIcon className="h-2.5 w-2.5" />
            </Button>
          </div>
        ))}

        {/* Add Category Button */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-muted"
            >
              <PlusIcon className="mr-1 h-3 w-3" />
              Add Category
            </Badge>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Service Category</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newCategoryName.trim()) {
                  handleCreate({ name: newCategoryName.trim() });
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="category-name">Category Name</Label>
                <Input
                  id="category-name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Wedding Planning"
                  disabled={isPending}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setNewCategoryName("");
                    setIsAddDialogOpen(false);
                  }}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending || !newCategoryName.trim()}>
                  {isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Category Dialog */}
      {editingCategory && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Service Category</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editCategoryName.trim() && editingCategory) {
                  handleUpdate({
                    id: editingCategory.id,
                    name: editCategoryName.trim(),
                  });
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="edit-category-name">Category Name</Label>
                <Input
                  id="edit-category-name"
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingCategory(null);
                    setEditCategoryName("");
                    setIsEditDialogOpen(false);
                  }}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || !editCategoryName.trim()}
                >
                  {isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {categories.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No service categories yet. Click "Add Category" to get started.
          </p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingCategory?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCategory && handleDelete(deletingCategory.id)}
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