"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSidebar } from "@repo/design-system/components/ui/sidebar";
import { driver } from "driver.js";
import confetti from "canvas-confetti";
import "driver.js/dist/driver.css";

export function useProductTour() {
  const router = useRouter();
  const sidebar = useSidebar();

  const startTour = useCallback(() => {
    const driverObj = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      onPopoverRender: (popover, { config }) => {
        // Check if this is the last step
        const currentStep = driverObj.getActiveIndex();
        const totalSteps = driverObj.getConfig()?.steps?.length || 0;
        
        if (currentStep === totalSteps - 1) {
          // Trigger confetti on the final step
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      },
      steps: [
        {
          element: '[data-tour="sidebar"]',
          popover: {
            title: 'Navigation Sidebar',
            description: 'Use this sidebar to navigate between different sections of EventDesk. All your main features are accessible here.',
            side: "right",
            align: 'start'
          }
        },
        {
          element: '[data-tour="events"]',
          popover: {
            title: 'Events',
            description: 'Manage all your events here. Create, edit, and track event progress from planning to completion.',
            side: "right",
          }
        },
        {
          element: '[data-tour="leads"]',
          popover: {
            title: 'Leads',
            description: 'Capture and nurture potential clients. Convert leads into successful events.',
            side: "right",
          }
        },
        {
          element: '[data-tour="clients"]',
          popover: {
            title: 'Clients',
            description: 'Store and organize client information. Quick access to contact details and event history.',
            side: "right",
          }
        },
        {
          element: '[data-tour="vendors"]',
          popover: {
            title: 'Vendors',
            description: 'Manage your vendor relationships and track all vendor-related activities.',
            side: "right",
          }
        },
        {
          element: '[data-tour="estimates"]',
          popover: {
            title: 'Estimates',
            description: 'Create and send estimates to clients. Track estimate status and convert them into invoices.',
            side: "right",
          }
        },
        {
          element: '[data-tour="settings"]',
          popover: {
            title: 'Settings',
            description: 'Customize your organization settings, manage team members, and configure preferences.',
            side: "right",
          }
        },
        {
          element: '[data-tour="support"]',
          popover: {
            title: 'Support',
            description: 'Need help? Access our support center for guides, FAQs, and direct assistance.',
            side: "right",
          }
        },
        {
          popover: {
            title: 'You\'re All Set! 🎉',
            description: 'Now you know the basics! Start by creating your first event or exploring other features. You can always reach out to support if you need help.',
          }
        },
      ],
      onDestroyStarted: () => {
        driverObj.destroy();
        // Close sidebar on mobile after tour
        if (sidebar.isMobile) {
          sidebar.setOpenMobile(false);
        }
        // Redirect to events page after tour completes
        router.push("/events");
      },
    });

    driverObj.drive();
  }, [router, sidebar]);

  return { startTour };
}
