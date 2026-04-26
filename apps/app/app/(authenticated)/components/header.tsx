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
import { Fragment, type ReactNode } from "react";
import { BookDemoButton } from "@/components/book-demo-button";

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
            {pages.map((page, index) => (
              <Fragment key={page}>
                {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">{page}</BreadcrumbLink>
                </BreadcrumbItem>
              </Fragment>
            ))}
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
