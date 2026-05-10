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
            title: "Welcome to Your Dashboard! 🎉",
            description: "This is your command center where all the data you created comes together. Let's take a quick tour!",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: '[data-tour="stats-overview"]',
          popover: {
            title: "Key Metrics at a Glance",
            description: "See your most important stats: events, tasks, budget, bills, CSAT score, and lead conversion rate—all in one place!",
            side: "bottom",
          },
        },
        {
          element: '[data-tour="task-overview"]',
          popover: {
            title: "Task Management Hub",
            description: "Track open, overdue, and idle tasks across all your events. The task you created appears here! Never miss a deadline.",
            side: "top",
          },
        },
        {
          element: '[data-tour="finance-overview"]',
          popover: {
            title: "Financial Health Dashboard",
            description: "Monitor your top cost categories, pending payments, and vendor dues. Stay on top of your event budgets.",
            side: "top",
          },
        },
        {
          element: '[data-tour="client-insights"]',
          popover: {
            title: "Client & Lead Intelligence",
            description: "Visualize your leads funnel and track repeat clients. See how the lead and event you created fit into the bigger picture!",
            side: "top",
          },
        },
        {
          popover: {
            title: "You're Ready to Rock! 🎉",
            description: "See how everything connects? Your leads, events, tasks, and finances all work together seamlessly. Time to grow your event business!",
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

  // For the "navigate to dashboard" step, just show a redirect message
  if (!isTourStep) {
    return (
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-[60] px-4">
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-4 sm:p-6 max-w-[calc(100%-2rem)] sm:max-w-sm pointer-events-auto">
          <div className="flex flex-col items-center gap-3 sm:gap-4 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl sm:text-2xl">📊</span>
            </div>
            <div>
              <h3 className="font-semibold text-base sm:text-lg">Let's See Your Dashboard!</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
                Time to see all your hard work visualized...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
