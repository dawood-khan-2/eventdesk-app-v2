"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/design-system/components/ui/tabs";
import { FinanceSettingsForm } from "./finance-settings-form";
import { ServiceCategories } from "./service-categories";
import { OrganizationSettingsForm } from "./organization-settings-form";
import { PaymentModes } from "./payment-modes";
import { InviteTeamMemberDialog } from "./invite-team-member-dialog";
import { TeamMembersTable } from "./team-members-table";
import { Subscriptions } from "./subscriptions";

export type SettingsShellProps = {
  initialTab: string;
  currencies: any;
  financeSettings: any;
  serviceCategories: any;
  organizationSettings: any;
  paymentModes: any;
  teamMembers: any;
};

export function SettingsShell(props: SettingsShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(props.initialTab || "organization");

  // Keep local state in sync if URL changes externally (e.g., Stripe redirect)
  useEffect(() => {
    const t = searchParams.get("tab") || "organization";
    if (t !== tab) setTab(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const onChange = (value: string) => {
    setTab(value);
    const sp = new URLSearchParams(Array.from(searchParams.entries()));
    sp.set("tab", value);
    // Preserve status/session_id if present; otherwise keep URL clean
    router.replace(`?${sp.toString()}`);
  };

  const currencies = props.currencies;

  return (
    <Tabs value={tab} onValueChange={onChange} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="organization">Organization</TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
        <TabsTrigger value="finance">Finance</TabsTrigger>
        <TabsTrigger value="subscription">Subscription</TabsTrigger>
      </TabsList>

      <TabsContent value="organization" className="space-y-4 mt-6">
        <div className="rounded-lg border p-8">
          <h2 className="text-lg font-semibold mb-2">Organization Settings</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Manage your organization details and preferences.
          </p>

          {props.organizationSettings.error ? (
            <p className="text-sm text-destructive">{props.organizationSettings.error}</p>
          ) : (
            <OrganizationSettingsForm
              currentAddress={props.organizationSettings.data?.address}
              currentPhone={props.organizationSettings.data?.phone}
            />
          )}
        </div>

        <div className="rounded-lg border p-8">
          <h2 className="text-lg font-semibold mb-2">Service Categories</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Manage service categories for your organization.
          </p>

          {props.serviceCategories.error ? (
            <p className="text-sm text-destructive">{props.serviceCategories.error}</p>
          ) : (
            <ServiceCategories categories={props.serviceCategories.data ?? []} />
          )}
        </div>
      </TabsContent>

      <TabsContent value="team" className="space-y-4 mt-6">
        <div className="rounded-lg border p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">Team Settings</h2>
              <p className="text-sm text-muted-foreground">
                Manage team members, roles, and permissions.
              </p>
            </div>
            <InviteTeamMemberDialog />
          </div>
          {props.teamMembers.error ? (
            <p className="text-sm text-destructive">{props.teamMembers.error}</p>
          ) : (
            <TeamMembersTable members={props.teamMembers.data ?? []} />
          )}
        </div>
      </TabsContent>

      <TabsContent value="finance" className="space-y-4 mt-6">
        <div className="rounded-lg border p-8">
          <h2 className="text-lg font-semibold mb-4">Finance Settings</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Configure currency and financial preferences for your organization.
          </p>
          {props.financeSettings.error ? (
            <p className="text-sm text-destructive">{props.financeSettings.error}</p>
          ) : (
            <FinanceSettingsForm
              currentCurrency={props.financeSettings.data?.currencyCode ?? "USD"}
              currencies={currencies}
            />
          )}
        </div>

        <div className="rounded-lg border p-8">
          <h2 className="text-lg font-semibold mb-2">Payment Modes</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Manage payment methods accepted by your organization.
          </p>

          {props.paymentModes.error ? (
            <p className="text-sm text-destructive">{props.paymentModes.error}</p>
          ) : (
            <PaymentModes paymentModes={props.paymentModes.data ?? []} />
          )}
        </div>
      </TabsContent>

      <TabsContent value="subscription" className="space-y-4 mt-6">
        <div className="rounded-lg border p-8">
          <h2 className="text-lg font-semibold mb-2">Subscription Settings</h2>
          <p className="text-sm text-muted-foreground">
            Manage your subscription plan and billing.
          </p>
          <Subscriptions />
        </div>
      </TabsContent>
    </Tabs>
  );
}
