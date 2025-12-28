"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { useState, useTransition } from "react";
import { updateOrganizationSettings } from "../actions";
import { toast } from "sonner";

type OrganizationSettingsFormProps = {
  currentAddress?: string | null;
  currentPhone?: string | null;
};

export function OrganizationSettingsForm({
  currentAddress,
  currentPhone,
}: OrganizationSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [address, setAddress] = useState(currentAddress || "");
  const [phone, setPhone] = useState(currentPhone || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await updateOrganizationSettings({
        address: address || undefined,
        phone: phone || undefined,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Organization settings updated successfully");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+1 (555) 123-4567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          Your organization's contact phone number.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          placeholder="123 Main St, Suite 100&#10;City, State 12345&#10;Country"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={4}
        />
        <p className="text-sm text-muted-foreground">
          Your organization's physical address. This will appear on invoices and other documents.
        </p>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
