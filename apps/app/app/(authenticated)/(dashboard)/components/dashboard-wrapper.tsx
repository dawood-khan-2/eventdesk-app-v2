"use client";

import type { ReactNode } from "react";

interface DashboardWrapperProps {
  header: ReactNode;
  children: ReactNode;
  showWelcome: boolean;
}

export function DashboardWrapper({ header, children, showWelcome }: DashboardWrapperProps) {
  return (
    <>
      {header}
      {showWelcome ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="text-muted-foreground">No data to display.</p>
        </div>
      ) : (
        children
      )}
    </>
  );
}
