import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/design-system/components/ui/tabs";
import { formatCurrencyList } from "@repo/internationalization";
import { Header } from "../components/header";
import { getFinanceSettings, getServiceCategories, getOrganizationSettings, getPaymentModes } from "./actions";
import { FinanceSettingsForm } from "./components/finance-settings-form";
import { ServiceCategories } from "./components/service-categories";
import { OrganizationSettingsForm } from "./components/organization-settings-form";
import { PaymentModes } from "./components/payment-modes";

export default async function SettingsPage() {
  const [financeSettings, serviceCategories, organizationSettings, paymentModes] = await Promise.all([
    getFinanceSettings(),
    getServiceCategories(),
    getOrganizationSettings(),
    getPaymentModes(),
  ]);

  const currencies = formatCurrencyList();

  return (
    <>
      <Header page="Settings" pages={["Home"]} />
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
        <Tabs defaultValue="organization" className="w-full">
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
              
              {organizationSettings.error ? (
                <p className="text-sm text-destructive">{organizationSettings.error}</p>
              ) : (
                <OrganizationSettingsForm
                  currentAddress={organizationSettings.data?.address}
                  currentPhone={organizationSettings.data?.phone}
                />
              )}
            </div>

            <div className="rounded-lg border p-8">
              <h2 className="text-lg font-semibold mb-2">Service Categories</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Manage service categories for your organization.
              </p>
              
              {serviceCategories.error ? (
                <p className="text-sm text-destructive">{serviceCategories.error}</p>
              ) : (
                <ServiceCategories categories={serviceCategories.data ?? []} />
              )}
            </div>
          </TabsContent>

          <TabsContent value="team" className="space-y-4 mt-6">
            <div className="rounded-lg border p-8">
              <h2 className="text-lg font-semibold mb-2">Team Settings</h2>
              <p className="text-sm text-muted-foreground">
                Manage team members, roles, and permissions.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="finance" className="space-y-4 mt-6">
            <div className="rounded-lg border p-8">
              <h2 className="text-lg font-semibold mb-4">Finance Settings</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Configure currency and financial preferences for your organization.
              </p>
              {financeSettings.error ? (
                <p className="text-sm text-destructive">{financeSettings.error}</p>
              ) : (
                <FinanceSettingsForm
                  currentCurrency={financeSettings.data?.currencyCode ?? "USD"}
                  currencies={currencies}
                />
              )}
            </div>

            <div className="rounded-lg border p-8">
              <h2 className="text-lg font-semibold mb-2">Payment Modes</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Manage payment methods accepted by your organization.
              </p>
              
              {paymentModes.error ? (
                <p className="text-sm text-destructive">{paymentModes.error}</p>
              ) : (
                <PaymentModes paymentModes={paymentModes.data ?? []} />
              )}
            </div>
          </TabsContent>

          <TabsContent value="subscription" className="space-y-4 mt-6">
            <div className="rounded-lg border p-8">
              <h2 className="text-lg font-semibold mb-2">Subscription Settings</h2>
              <p className="text-sm text-muted-foreground">
                Manage your subscription plan and billing.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
