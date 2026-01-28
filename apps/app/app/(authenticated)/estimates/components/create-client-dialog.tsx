"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { toast } from "sonner";
import { useState, useTransition } from "react";
import { createClient } from "../../clients/actions";

type CreateClientDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (clientId: string, clientName: string) => void;
};

export function CreateClientDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateClientDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [company, setCompany] = useState<string>("");

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setCompany("");
  };

  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleCreateClient = () => {
    // Validate required fields
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (name.length > 255) {
      toast.error("Name must be 255 characters or less");
      return;
    }

    // Validate email format if provided
    if (email && !validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Validate field lengths
    if (phone && phone.length > 50) {
      toast.error("Phone must be 50 characters or less");
      return;
    }

    if (company && company.length > 255) {
      toast.error("Company must be 255 characters or less");
      return;
    }

    startTransition(async () => {
      const result = await createClient({
        name: name.trim(),
        email: email || undefined,
        phone: phone || undefined,
        company: company || undefined,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.data) {
        toast.success("Client created successfully");
        onSuccess(result.data.id, result.data.name);
        resetForm();
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          resetForm();
        }
        onOpenChange(open);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Client</DialogTitle>
          <DialogDescription>
            Fill in the client details to create a new client.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="client-name">Name *</Label>
            <Input
              id="client-name"
              type="text"
              placeholder="Jane Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2"
              disabled={isPending}
            />
          </div>

          <div>
            <Label htmlFor="client-email">Email</Label>
            <Input
              id="client-email"
              type="email"
              placeholder="jane@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2"
              disabled={isPending}
            />
          </div>

          <div>
            <Label htmlFor="client-phone">Phone</Label>
            <Input
              id="client-phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2"
              disabled={isPending}
            />
          </div>

          <div>
            <Label htmlFor="client-company">Company</Label>
            <Input
              id="client-company"
              type="text"
              placeholder="Acme Inc."
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="mt-2"
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleCreateClient} disabled={isPending}>
            {isPending ? "Creating..." : "Create Client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
