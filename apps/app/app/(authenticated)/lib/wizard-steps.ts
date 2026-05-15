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
  title: string;
  description?: string;
  type: StepType;
  element?: string; // CSS selector for driver.js spotlight
  spotlightSide?: "top" | "right" | "bottom" | "left";
  canSkip?: boolean;
}

/**
 * Wizard step definitions
 * Users create: Lead → Event → Task → Estimate → View populated Dashboard
 */
export const wizardSteps: OnboardingStep[] = [
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

  // Phase 2: Lead Management
  {
    id: "navigate-leads",
    component: WaitForLeadStep,
    payload: {
      title: "Create Your First Lead",
      description: "Navigate to the Leads page to get started.",
      type: "spotlight",
      element: '[data-tour="leads"]',
      spotlightSide: "right",
    } as WizardStepPayload,
    nextStep: "spotlight-lead-button",
  },
  {
    id: "spotlight-lead-button",
    component: WaitForLeadStep,
    payload: {
      title: "Add a Lead",
      description: "Click the 'Add Lead' button to create your first lead.",
      type: "spotlight",
      element: '[data-tour="create-lead-button"]',
      spotlightSide: "bottom",
    } as WizardStepPayload,
    nextStep: "wait-lead",
  },
  {
    id: "wait-lead",
    component: WaitForLeadStep,
    payload: {
      title: "Create Your First Lead",
      description: "Fill out the lead details. We'll wait for you to complete this step.",
      type: "wait-action",
    } as WizardStepPayload,
    nextStep: "navigate-events",
  },

  // Phase 3: Event Creation
  {
    id: "navigate-events",
    component: WaitForEventStep,
    payload: {
      title: "Create an Event",
      description: "Great! Now let's create an event. Navigate to the Events page.",
      type: "spotlight",
      element: '[data-tour="events"]',
      spotlightSide: "right",
    } as WizardStepPayload,
    nextStep: "spotlight-event-button",
  },
  {
    id: "spotlight-event-button",
    component: WaitForEventStep,
    payload: {
      title: "Add an Event",
      description: "Click the 'Add Event' button to create your first event.",
      type: "spotlight",
      element: '[data-tour="create-event-button"]',
      spotlightSide: "bottom",
    } as WizardStepPayload,
    nextStep: "wait-event",
  },
  {
    id: "wait-event",
    component: WaitForEventStep,
    payload: {
      title: "Create Your First Event",
      description: "Add event details. You can link it to the lead you just created!",
      type: "wait-action",
    } as WizardStepPayload,
    nextStep: "navigate-event-details",
  },

  // Phase 4: Task Management
  {
    id: "navigate-event-details",
    component: WaitForTaskStep,
    payload: {
      title: "Add Tasks to Your Event",
      description: "Click on the event you just created to view its details.",
      type: "spotlight",
      element: '[data-tour="event-card"]',
      spotlightSide: "bottom",
    } as WizardStepPayload,
    nextStep: "spotlight-tasks",
  },
  {
    id: "spotlight-tasks",
    component: WaitForTaskStep,
    payload: {
      title: "Tasks Section",
      description: "Here you can add tasks to keep track of everything needed for your event.",
      type: "spotlight",
      element: '[data-tour="tasks-section"]',
      spotlightSide: "left",
    } as WizardStepPayload,
    nextStep: "spotlight-task-button",
  },
  {
    id: "spotlight-task-button",
    component: WaitForTaskStep,
    payload: {
      title: "Add Your First Task",
      description: "Click this button to add a task for your event.",
      type: "spotlight",
      element: '[data-tour="add-task-button"]',
      spotlightSide: "bottom",
    } as WizardStepPayload,
    nextStep: "wait-task",
  },
  {
    id: "wait-task",
    component: WaitForTaskStep,
    payload: {
      title: "Add a Task",
      description: "Create at least one task for your event to continue.",
      type: "wait-action",
    } as WizardStepPayload,
    nextStep: "spotlight-estimates-tab",
  },

  // Phase 5: Financial Management (Event-based)
  {
    id: "spotlight-estimates-tab",
    component: WaitForEstimateStep,
    payload: {
      title: "Create an Estimate",
      description: "Now let's create an estimate for this event. Click the Estimates tab.",
      type: "spotlight",
      element: '[data-tour="estimates-tab"]',
      spotlightSide: "bottom",
    } as WizardStepPayload,
    nextStep: "spotlight-estimate-button-event",
  },
  {
    id: "spotlight-estimate-button-event",
    component: WaitForEstimateStep,
    payload: {
      title: "Add an Estimate",
      description: "Click the 'Add Estimate' button to create an estimate for your event.",
      type: "spotlight",
      element: '[data-tour="create-estimate-button-event"]',
      spotlightSide: "bottom",
    } as WizardStepPayload,
    nextStep: "wait-estimate",
  },
  {
    id: "wait-estimate",
    component: WaitForEstimateStep,
    payload: {
      title: "Create Your First Estimate",
      description: "Add line items and pricing to complete your estimate.",
      type: "wait-action",
    } as WizardStepPayload,
    nextStep: "navigate-dashboard",
  },

  // Phase 6: Dashboard Reveal
  {
    id: "navigate-dashboard",
    component: DashboardRevealTour,
    payload: {
      title: "See What You've Accomplished!",
      description: "Let's head to the dashboard to see all your work visualized.",
      type: "spotlight",
      element: '[data-tour="dashboard"]',
      spotlightSide: "right",
    } as WizardStepPayload,
    nextStep: "dashboard-tour",
  },
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

  // Phase 7: Completion
  {
    id: "completion",
    component: CompletionModal,
    payload: {
      title: "You're All Set! 🎊",
      description: "You've completed the onboarding tour. Time to grow your event business!",
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
