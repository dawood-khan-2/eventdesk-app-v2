import type { OnboardingStep } from "@onboardjs/react";
import { WelcomeModal } from "../components/wizard-steps/WelcomeModal";
import { WaitForLeadStep } from "../components/wizard-steps/WaitForLeadStep";
import { WaitForEventStep } from "../components/wizard-steps/WaitForEventStep";
import { WaitForTaskStep } from "../components/wizard-steps/WaitForTaskStep";
import { WaitForEstimateStep } from "../components/wizard-steps/WaitForEstimateStep";
import { DashboardRevealTour } from "../components/wizard-steps/DashboardRevealTour";
import { CompletionModal } from "../components/wizard-steps/CompletionModal";

/**
 * Wizard step IDs for progress tracking
 */
export const WIZARD_STEP_IDS = [
  "welcome",
  "navigate-leads",
  "spotlight-lead-button",
  "wait-lead",
  "navigate-events",
  "spotlight-event-button",
  "wait-event",
  "navigate-event-details",
  "spotlight-tasks",
  "spotlight-task-button",
  "wait-task",
  "spotlight-estimates-tab",
  "spotlight-estimate-button-event",
  "wait-estimate",
  "navigate-dashboard",
  "dashboard-tour",
  "completion",
] as const;

export type WizardStepId = (typeof WIZARD_STEP_IDS)[number];

/**
 * Step type metadata for custom handling
 */
export type StepType = "modal" | "spotlight" | "wait-action" | "tour";

export interface WizardStepPayload {
  title: string; // Used by WizardProgress panel
  description?: string; // Used by WizardProgress panel
  type: StepType;
  spotlight?: {
    // Driver.js spotlight configuration (only for type: "spotlight")
    title?: string; // Driver.js popover title (optional)
    description: string; // Driver.js popover description
    element: string; // CSS selector
    side: "top" | "right" | "bottom" | "left";
  };
  canSkip?: boolean;
}

/**
 * Wizard step definitions
 * Users create: Lead → Event → Task → Estimate → View populated Dashboard
 */
export const wizardSteps: OnboardingStep[] = [
  // Step 0: Welcome
  // Phase 1: Welcome
  {
    id: "welcome",
    component: WelcomeModal,
    payload: {
      title: "Welcome to EventDesk! 🎉",
      description: "Let's take a quick tour and set up your workspace. This will only take a few minutes.",
      type: "modal",
    } as WizardStepPayload,
    nextStep: "navigate-leads",
  },

  // Step 1: Navigate to Leads
  // Phase 2: Lead Management
  {
    id: "navigate-leads",
    component: WaitForLeadStep,
    payload: {
      title: "Every Event Starts With an Enquiry",
      description: "This is where you'll capture new enquiries and turn them into real events.",
      type: "spotlight",
      spotlight: {
        description: "Start here",
        element: '[data-tour="leads"]',
        side: "right",
      },
    } as WizardStepPayload,
    nextStep: "spotlight-lead-button",
  },

  // Step 2: Create Lead Button
  {
    id: "spotlight-lead-button",
    component: WaitForLeadStep,
    payload: {
      title: "Bring Your First Lead Into EventDesk",
      description: "Add a sample enquiry to see how leads, events, tasks, and billing all connect together.",
      type: "spotlight",
      spotlight: {
        description: "Create your first enquiry",
        element: '[data-tour="create-lead-button"]',
        side: "bottom",
      },
    } as WizardStepPayload,
    nextStep: "wait-lead",
  },

  // Step 3: Wait for Lead Creation
  {
    id: "wait-lead",
    component: WaitForLeadStep,
    payload: {
      title: "Create Your First Lead",
      description: "Add a few basic details about the enquiry. We'll guide you through the rest once it's created ✨",
      type: "wait-action",
    } as WizardStepPayload,
    nextStep: "navigate-events",
  },

  // Step 4: Navigate to Events
  // Phase 3: Event Creation
  {
    id: "navigate-events",
    component: WaitForEventStep,
    payload: {
      title: "Now Let's Plan the Event",
      description: "Great start! Head over to Events to turn this enquiry into an active event workflow.",
      type: "spotlight",
      spotlight: {
        description: "Open your event workspace",
        element: '[data-tour="events"]',
        side: "right",
      },
    } as WizardStepPayload,
    nextStep: "spotlight-event-button",
  },

  // Step 5: Create Event Button
  {
    id: "spotlight-event-button",
    component: WaitForEventStep,
    payload: {
      title: "Create Your First Event",
      description: "This is where everything comes together—clients, tasks, guests, schedules, and finances.",
      type: "spotlight",
      spotlight: {
        description: "Create your first event",
        element: '[data-tour="create-event-button"]',
        side: "bottom",
      },
    } as WizardStepPayload,
    nextStep: "wait-event",
  },

  // Step 6: Wait for Event Creation
  {
    id: "wait-event",
    component: WaitForEventStep,
    payload: {
      title: "Set Up the Event",
      description: "Add the event details and link it to the lead you just created. EventDesk will automatically connect everything for you 🔗",
      type: "wait-action",
    } as WizardStepPayload,
    nextStep: "navigate-event-details",
  },

  // Step 7: Navigate to Event Details
  // Phase 4: Task Management
  {
    id: "navigate-event-details",
    component: WaitForTaskStep,
    payload: {
      title: "Open Your Event Workspace",
      description: "Click the event you created to manage tasks, guests, timelines, estimates, and more—all from one place.",
      type: "spotlight",
      spotlight: {
        description: "Open event details",
        element: '[data-tour="event-card"]',
        side: "bottom",
      },
    } as WizardStepPayload,
    nextStep: "spotlight-tasks",
  },

  // Step 8: Tasks Section Spotlight
  {
    id: "spotlight-tasks",
    component: WaitForTaskStep,
    payload: {
      title: "Keep Every Detail On Track",
      description: "Tasks help your team stay organized before, during, and after the event.",
      type: "spotlight",
      spotlight: {
        description: "Track event activities",
        element: '[data-tour="tasks-section"]',
        side: "left",
      },
    } as WizardStepPayload,
    nextStep: "spotlight-task-button",
  },

  // Step 9: Add Task Button
  {
    id: "spotlight-task-button",
    component: WaitForTaskStep,
    payload: {
      title: "Add Your First Task",
      description: "Create a task to track an important activity for this event—like venue booking, catering, or guest coordination.",
      type: "spotlight",
      spotlight: {
        description: "Create your first task",
        element: '[data-tour="add-task-button"]',
        side: "bottom",
      },
    } as WizardStepPayload,
    nextStep: "wait-task",
  },

  // Step 10: Wait for Task Creation
  {
    id: "wait-task",
    component: WaitForTaskStep,
    payload: {
      title: "Create a Task",
      description: "Add at least one task to continue. Your event workflow is already taking shape 🚀",
      type: "wait-action",
    } as WizardStepPayload,
    nextStep: "spotlight-estimates-tab",
  },

  // Step 11: Estimates Tab Spotlight
  // Phase 5: Financial Management (Event-based)
  {
    id: "spotlight-estimates-tab",
    component: WaitForEstimateStep,
    payload: {
      title: "Let's Talk Budget",
      description: "Estimates help you share pricing with clients and keep your event finances organized from day one.",
      type: "spotlight",
      spotlight: {
        description: "Manage event pricing",
        element: '[data-tour="estimates-tab"]',
        side: "bottom",
      },
    } as WizardStepPayload,
    nextStep: "spotlight-estimate-button-event",
  },

  // Step 12: Create Estimate Button
  {
    id: "spotlight-estimate-button-event",
    component: WaitForEstimateStep,
    payload: {
      title: "Create Your First Estimate",
      description: "Add pricing, services, or packages to prepare a professional estimate for this event.",
      type: "spotlight",
      spotlight: {
        description: "Create your first estimate",
        element: '[data-tour="create-estimate-button-event"]',
        side: "bottom",
      },
    } as WizardStepPayload,
    nextStep: "wait-estimate",
  },

  // Step 13: Wait for Estimate Creation
  {
    id: "wait-estimate",
    component: WaitForEstimateStep,
    payload: {
      title: "Build Your Estimate",
      description: "Add a few line items and pricing details. Once saved, your financial workflow becomes part of the event automatically 💸",
      type: "wait-action",
    } as WizardStepPayload,
    nextStep: "navigate-dashboard",
  },

  // Step 14: Navigate to Dashboard
  // Phase 6: Dashboard Reveal
  {
    id: "navigate-dashboard",
    component: DashboardRevealTour,
    payload: {
      title: "See Everything Working Together",
      description: "Let's head to the dashboard and see how your leads, events, tasks, and finances connect in real time.",
      type: "spotlight",
      spotlight: {
        description: "See everything together",
        element: '[data-tour="dashboard"]',
        side: "right",
      },
    } as WizardStepPayload,
    nextStep: "dashboard-tour",
  },

  // Step 15: Dashboard Tour
  {
    id: "dashboard-tour",
    component: DashboardRevealTour,
    payload: {
      title: "Your Dashboard",
      description: "Here's where you can see your business metrics at a glance.",
      type: "tour",
    } as WizardStepPayload,
    nextStep: "completion",
  },

  // Step 16: Completion
  // Phase 7: Completion
  {
    id: "completion",
    component: CompletionModal,
    payload: {
      title: "You're Ready to Start Managing Events 🎊",
      description: "You've completed your first workflow in EventDesk!",
      type: "modal",
    } as WizardStepPayload,
    nextStep: null, // End of wizard
  },
];

/**
 * Helper to get current step number from step ID
 * Returns step number excluding welcome (step 0) and completion (step 17)
 * So navigate-leads becomes step 1, completion is step 15
 */
export function getStepNumber(stepId: string): number {
  const index = WIZARD_STEP_IDS.findIndex((id) => id === stepId);
  if (index === -1) return 0;
  // Subtract 1 because welcome (index 0) is not counted in display
  // So index 1 (navigate-leads) becomes step 1, index 2 becomes step 2, etc.
  return index;
}

/**
 * Helper to check if step can be skipped
 */
export function canSkipStep(stepId: string): boolean {
  const step = wizardSteps.find((s) => s.id === stepId);
  const payload = step?.payload as WizardStepPayload | undefined;
  return payload?.canSkip ?? false;
}
