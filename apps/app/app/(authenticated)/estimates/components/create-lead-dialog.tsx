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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { toast } from "sonner";
import { useState, useTransition } from "react";
import { createLead } from "../../leads/actions";

type CreateLeadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (leadId: string, leadName: string) => void;
};

export function CreateLeadDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateLeadDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [company, setCompany] = useState<string>("");
  const [status, setStatus] = useState<string>("NEW");

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setCompany("");
    setStatus("NEW");
  };

  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleCreateLead = () => {
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
      const result = await createLead({
        name: name.trim(),
        email: email || undefined,
        phone: phone || undefined,
        company: company || undefined,
        status: status as "NEW" | "CONTACTED" | "PROPOSAL_SENT" | "FOLLOW_UP" | "CONVERTED" | "LOST",
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.data) {
        toast.success("Lead created successfully");
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
          <DialogTitle>Create New Lead</DialogTitle>
          <DialogDescription>
            Fill in the lead details to create a new lead.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="lead-name">Name *</Label>
            <Input
              id="lead-name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2"
              disabled={isPending}
            />
          </div>

          <div>
            <Label htmlFor="lead-email">Email</Label>
            <Input
              id="lead-email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2"
              disabled={isPending}
            />
          </div>

          <div>
            <Label htmlFor="lead-phone">Phone</Label>
            <Input
              id="lead-phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2"
              disabled={isPending}
            />
          </div>

          <div>
            <Label htmlFor="lead-company">Company</Label>
            <Input
              id="lead-company"
              type="text"
              placeholder="Acme Inc."
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="mt-2"
              disabled={isPending}
            />
          </div>

          <div>
            <Label htmlFor="lead-status">Status *</Label>
            <Select value={status} onValueChange={setStatus} disabled={isPending}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="CONTACTED">Contacted</SelectItem>
                <SelectItem value="PROPOSAL_SENT">Proposal Sent</SelectItem>
                <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                <SelectItem value="CONVERTED">Converted</SelectItem>
                <SelectItem value="LOST">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleCreateLead} disabled={isPending}>
            {isPending ? "Creating..." : "Create Lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
