"use client";

import { Button } from "@repo/design-system/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/design-system/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useTransition } from "react";
import {
  updateFinanceSettings,
  type UpdateFinanceSettingsInput,
} from "../actions";

type Currency = {
  value: string;
  label: string;
};

type FinanceSettingsFormProps = {
  currentCurrency: string;
  currencies: Currency[];
};

export function FinanceSettingsForm({
  currentCurrency,
  currencies,
}: FinanceSettingsFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdateFinanceSettingsInput>({
    defaultValues: {
      currencyCode: currentCurrency,
    },
  });

  const onSubmit = (data: UpdateFinanceSettingsInput) => {
    startTransition(async () => {
      const result = await updateFinanceSettings(data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Finance settings updated successfully");
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="currencyCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Currency</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isPending}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a currency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                This currency will be used for all financial transactions in
                your organization.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}
