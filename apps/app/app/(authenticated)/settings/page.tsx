import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/design-system/components/ui/tabs";
import { formatCurrencyList } from "@repo/internationalization";
import { Header } from "../components/header";
import { getFinanceSettings, getServiceCategories, getOrganizationSettings, getPaymentModes, getTeamMembers } from "./actions";
import { SettingsShell } from "./components/settings-shell";

export const dynamic = 'force-dynamic';

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const [financeSettings, serviceCategories, organizationSettings, paymentModes, teamMembers] = await Promise.all([
    getFinanceSettings(),
    getServiceCategories(),
    getOrganizationSettings(),
    getPaymentModes(),
    getTeamMembers(),
  ]);

  const currencies = formatCurrencyList();
  const activeTab = params.tab || "organization";

  return (
    <>
      <Header page="Settings" pages={["Home"]} />
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
        <SettingsShell
          initialTab={activeTab}
          currencies={currencies}
          financeSettings={financeSettings}
          serviceCategories={serviceCategories}
          organizationSettings={organizationSettings}
          paymentModes={paymentModes}
          teamMembers={teamMembers}
        />
      </div>
    </>
  );
}
