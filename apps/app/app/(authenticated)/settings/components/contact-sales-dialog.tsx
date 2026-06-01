"use client";

import { useState, useTransition } from "react";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/design-system/components/ui/dialog";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { Alert, AlertDescription } from "@repo/design-system/components/ui/alert";
import { toast } from "sonner";
import { submitContactSales, type ContactSalesInput } from "../actions";

export function ContactSalesDialog() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState({ name: false, email: false, jobTitle: false, companySize: false });
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<ContactSalesInput>({
    name: "",
    email: "",
    phone: "",
    jobTitle: "",
    companySize: "" as any,
    comments: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({ name: false, email: false, jobTitle: false, companySize: false });

    // Validate required fields
    const errors = { name: false, email: false, jobTitle: false, companySize: false };
    if (!formData.name.trim()) errors.name = true;
    if (!formData.email.trim()) errors.email = true;
    if (!formData.jobTitle.trim()) errors.jobTitle = true;
    if (!formData.companySize) errors.companySize = true;

    if (Object.values(errors).some(v => v)) {
      setError("Please fill in all required fields");
      setFieldErrors(errors);
      return;
    }

    startTransition(async () => {
      const result = await submitContactSales(formData);
      
      if ("error" in result) {
        setError(result.error ?? "Failed to submit request");
        return;
      }

      // Success
      setOpen(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        jobTitle: "",
        companySize: "" as any,
        comments: "",
      });
      toast.success("Thank you! Our sales team will contact you soon.");
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Contact Sales</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Contact Sales</DialogTitle>
            <DialogDescription>
              Tell us about your needs and our sales team will reach out to you.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                aria-invalid={fieldErrors.name}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                aria-invalid={fieldErrors.email}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="jobTitle">Job Title *</Label>
              <Input
                id="jobTitle"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                required
                aria-invalid={fieldErrors.jobTitle}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="companySize">Company Size *</Label>
              <Select
                value={formData.companySize}
                onValueChange={(value) =>
                  setFormData({ ...formData, companySize: value as ContactSalesInput["companySize"] })
                }
              >
                <SelectTrigger id="companySize" aria-invalid={fieldErrors.companySize}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-24">1-24</SelectItem>
                  <SelectItem value="25-99">25-99</SelectItem>
                  <SelectItem value="100-249">100-249</SelectItem>
                  <SelectItem value="250-499">250-499</SelectItem>
                  <SelectItem value="500+">500+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                rows={3}
                className="max-h-80"
              />
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 bg-background border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Submitting..." : "Contact Sales"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
