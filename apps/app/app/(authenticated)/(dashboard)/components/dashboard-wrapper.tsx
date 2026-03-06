"use client";

import { useProductTour } from "@/lib/use-product-tour";
import { useSidebar } from "@repo/design-system/components/ui/sidebar";
import type { ReactNode } from "react";
import { useState } from "react";
import { WelcomeScreen } from "./welcome-screen";

interface DashboardWrapperProps {
  children: ReactNode;
  showWelcome: boolean;
}

export function DashboardWrapper({ children, showWelcome }: DashboardWrapperProps) {
  const [hideWelcome, setHideWelcome] = useState(false);
  const sidebar = useSidebar();
  const { startTour } = useProductTour();

  const handleStartTour = () => {
    setHideWelcome(true);
    // Open sidebar on mobile before starting tour
    if (sidebar.isMobile) {
      sidebar.setOpenMobile(true);
    }
    // Small delay to ensure welcome screen is hidden and dashboard is rendered
    setTimeout(() => {
      startTour();
    }, 100);
  };

  if (showWelcome && !hideWelcome) {
    return <WelcomeScreen onStartTour={handleStartTour} />;
  }

  return <>{children}</>;
}
