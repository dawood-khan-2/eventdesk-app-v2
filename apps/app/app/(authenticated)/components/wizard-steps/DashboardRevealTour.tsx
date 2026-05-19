"use client";

import { useEffect, useCallback } from "react";
import { useOnboarding } from "@onboardjs/react";
import { useRouter, usePathname } from "next/navigation";
import { driver } from "driver.js";
import confetti from "canvas-confetti";
import "driver.js/dist/driver.css";
import type { WizardStepPayload } from "../../lib/wizard-steps";

export function DashboardRevealTour() {
  const { next, state } = useOnboarding();
  const router = useRouter();
  const pathname = usePathname();
  const payload = state?.currentStep?.payload as WizardStepPayload | undefined;
  const stepId = state?.currentStep?.id;
  const isTourStep = payload?.type === "tour";

  // Auto-advance from navigate-dashboard step when user reaches dashboard
  useEffect(() => {
    if (stepId === "navigate-dashboard" && pathname === "/") {
      console.log("DashboardRevealTour - User navigated to dashboard, advancing to dashboard-tour");
      setTimeout(() => {
        next();
      }, 1500);
    }
  }, [stepId, pathname]); // Removed 'next' - it's stable and including it causes loops

  const startDashboardTour = useCallback(() => {
    const driverObj = driver({
      showProgress: true,
      showButtons: ["next", "previous", "close"],
      onPopoverRender: (popover, { config }) => {
        // Trigger confetti on the last dashboard tour step
        const currentStep = driverObj.getActiveIndex();
        const totalSteps = driverObj.getConfig()?.steps?.length || 0;

        if (currentStep === totalSteps - 1) {
          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 },
          });
        }
      },
      steps: [
        {
          element: '[data-tour="dashboard"]',
          popover: {
            title: "Welcome to Your Command Center 🎉",
            description: "Your dashboard gives you a live overview of everything happening across your business—from enquiries to payments.",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: '[data-tour="stats-overview"]',
          popover: {
            title: "Track Your Business at a Glance",
            description: "Quickly monitor events, tasks, revenue, pending bills, customer satisfaction, and lead conversions—all in one place.",
            side: "bottom",
          },
        },
        {
          element: '[data-tour="task-overview"]',
          popover: {
            title: "Stay Ahead of Every Task",
            description: "See open, overdue, and upcoming tasks across all events. The task you created appears here automatically.",
            side: "top",
          },
        },
        {
          element: '[data-tour="finance-overview"]',
          popover: {
            title: "Keep Your Finances Under Control",
            description: "Monitor estimates, expenses, pending payments, and vendor dues without switching between tools.",
            side: "top",
          },
        },
        {
          element: '[data-tour="client-insights"]',
          popover: {
            title: "Understand Your Clients Better",
            description: "Track enquiries, repeat clients, and conversion trends to understand how your business is growing over time.",
            side: "top",
          },
        },
        {
          popover: {
            title: "Your Entire Event Workflow—Connected ✨",
            description: "From leads and clients to events, tasks, guests, and finances—EventDesk keeps everything organized in one seamless workspace.",
          },
        },
      ],
      onDestroyStarted: () => {
        driverObj.destroy();
        // Move to completion step after tour
        next();
      },
    });

    driverObj.drive();
  }, []); // Empty deps - useCallback handles 'next' stability

  useEffect(() => {
    if (isTourStep) {
      // Navigate to dashboard first
      router.push("/");

      // Wait a moment for dashboard to render, then start tour
      const timeout = setTimeout(() => {
        startDashboardTour();
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [isTourStep, router, startDashboardTour]);

  // No custom UI needed - driver.js spotlight handles the navigate-dashboard step
  return null;
}
