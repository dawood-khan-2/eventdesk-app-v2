"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/design-system/components/ui/breadcrumb";
import { Button } from "@repo/design-system/components/ui/button";
import { Separator } from "@repo/design-system/components/ui/separator";
import { useSidebar } from "@repo/design-system/components/ui/sidebar";
import { Menu, PanelLeftIcon } from "lucide-react";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { BookDemoButton } from "@/components/book-demo-button";
import EventDeskIcon from "@/app/eventdesk-icon.svg";

type HeaderProps = {
  pages: string[];
  page: string;
  children?: ReactNode;
};

export const Header = ({ pages, page, children }: HeaderProps) => {
  const { toggleSidebar, isMobile } = useSidebar();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2">
      <div className="flex items-center gap-2 px-4">
        {isMobile && (
          <Link href="/" className="flex h-7 w-7 shrink-0 items-center justify-center -ml-1">
            <EventDeskIcon className="h-6 w-[18px] text-foreground" />
          </Link>
        )}
        <Button
          data-sidebar="trigger"
          variant="ghost"
          size="icon"
          className="size-7 -ml-1"
          onClick={toggleSidebar}
        >
          {isMobile ? <Menu /> : <PanelLeftIcon />}
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
        <Separator className="mr-2 h-4" orientation="vertical" />
        <Separator className="mr-2 h-4" orientation="vertical" />
        <Breadcrumb>
          <BreadcrumbList>
            {pages.map((page, index) => {
              const href = page === "Home" ? "/" : `/${page.toLowerCase().replace(/\s+/g, "-")}`;
              return (
                <Fragment key={page}>
                  {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink asChild>
                      <Link href={href}>{page}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </Fragment>
              );
            })}
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{page}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex items-center gap-2 px-4">
        <BookDemoButton />
        {children}
      </div>
    </header>
  );
};
