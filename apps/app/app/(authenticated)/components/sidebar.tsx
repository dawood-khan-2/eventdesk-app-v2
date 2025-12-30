"use client";

import { OrganizationSwitcher, UserButton } from "@repo/auth/client";
import { ModeToggle } from "@repo/design-system/components/mode-toggle";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/design-system/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@repo/design-system/components/ui/sidebar";
import { cn } from "@repo/design-system/lib/utils";
import { NotificationsTrigger } from "@repo/notifications/components/trigger";
import {
  ChevronRightIcon,
  Settings2Icon,
  CalendarDaysIcon,
  LayoutDashboardIcon,
  CalculatorIcon,
  MagnetIcon,
  ContactIcon,
  FileTextIcon,
  StoreIcon,
  ReceiptIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type GlobalSidebarProperties = {
  readonly children: ReactNode;
};

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
  }[];
};

type SidebarData = {
  navMain: NavItem[];
};

const data: SidebarData = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboardIcon,
      isActive: true,
    },
    {
      title: "Events",
      url: "/events",
      icon: CalendarDaysIcon,
    },
    {
      title: "Estimates",
      url: "/estimates",
      icon: CalculatorIcon,
    },
    {
      title: "Clients",
      url: "/clients",
      icon: ContactIcon,
    },
    {
      title: "Leads",
      url: "/leads",
      icon: MagnetIcon,
    },
    {
      title: "Invoices",
      url: "/invoices",
      icon: FileTextIcon,
    },
    {
      title: "Bills",
      url: "#",
      icon: ReceiptIcon,
    },
    {
      title: "Vendors",
      url: "/vendors",
      icon: StoreIcon,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2Icon,
    },
  ],
};

export const GlobalSidebar = ({ children }: GlobalSidebarProperties) => {
  const sidebar = useSidebar();

  const handleLinkClick = () => {
    // Close mobile sidebar on navigation
    if (sidebar.isMobile) {
      sidebar.setOpenMobile(false);
    }
  };

  return (
    <>
      <Sidebar variant="inset" collapsible="icon" suppressHydrationWarning>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <div
                className={cn(
                  "h-[36px] overflow-hidden transition-all [&>div]:w-full",
                  sidebar.open ? "" : "-mx-1"
                )}
              >
                <OrganizationSwitcher
                  afterSelectOrganizationUrl="/"
                  hidePersonal
                />
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {data.navMain.map((item) => (
                <Collapsible
                  asChild
                  defaultOpen={item.isActive}
                  key={item.title}
                >
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <Link href={item.url} onClick={handleLinkClick}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.items?.length ? (
                      <>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuAction className="data-[state=open]:rotate-90">
                            <ChevronRightIcon />
                            <span className="sr-only">Toggle</span>
                          </SidebarMenuAction>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items?.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild>
                                  <Link href={subItem.url} onClick={handleLinkClick}>
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </>
                    ) : null}
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
              <UserButton
                appearance={{
                  elements: {
                    rootBox: "flex overflow-hidden w-full",
                    userButtonBox: "flex-row-reverse",
                    userButtonOuterIdentifier: "truncate pl-0",
                  },
                }}
                showName
              />
              <div className="flex shrink-0 items-center gap-px">
                <ModeToggle />
                <Button
                  asChild
                  className="shrink-0"
                  size="icon"
                  variant="ghost"
                >
                  <div className="h-4 w-4">
                    <NotificationsTrigger />
                  </div>
                </Button>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </>
  );
};
