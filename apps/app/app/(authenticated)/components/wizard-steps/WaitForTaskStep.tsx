"use client";

import { useEffect, useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { usePathname } from "next/navigation";
import { useWizardPolling } from "../../lib/use-wizard-polling";
import confetti from "canvas-confetti";
import { Loader2 } from "lucide-react";
import type { WizardStepPayload } from "../../lib/wizard-steps";

export function WaitForTaskStep() {
  const { next, state } = useOnboarding();
  const pathname = usePathname();
  const payload = state?.currentStep?.payload as WizardStepPayload | undefined;
  const stepId = state?.currentStep?.id;
  const isWaitingStep = payload?.type === "wait-action";
  const isSpotlightStep = stepId === "spotlight-tasks" || stepId === "spotlight-task-button";

  // Start polling from spotlight step (after delay) OR wait-action step
  const [delayedPollingEnabled, setDelayedPollingEnabled] = useState(false);
  
  useEffect(() => {
    if (isSpotlightStep) {
      console.log("WaitForTaskStep - On spotlight step, will start polling after delay");
      const timer = setTimeout(() => {
        console.log("WaitForTaskStep - Starting delayed polling");
        setDelayedPollingEnabled(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setDelayedPollingEnabled(false);
    }
  }, [isSpotlightStep]);
  
  const shouldPoll = isWaitingStep || delayedPollingEnabled;
  const { isComplete } = useWizardPolling("task", shouldPoll);

  // Auto-advance from spotlight-tasks when user interacts with tasks section
  useEffect(() => {
    if (stepId === "spotlight-tasks") {
      let hasAdvanced = false;
      let clickHandler: (() => void) | null = null;

      console.log("WaitForTaskStep - Starting spotlight-tasks step");

      // Wait for spotlight to be shown (driver.js takes time to set up)
      // For Tasks tab, we ONLY advance on explicit click, never on state detection
      // This is because driver.js might focus the element, causing it to become "active"
      // without actual user interaction
      const spotlightDelay = setTimeout(() => {
        const tasksSection = document.querySelector('[data-tour="tasks-section"]');
        
        console.log("WaitForTaskStep - Spotlight shown, waiting for explicit click only");
        
        // Add direct click listener to the tasks section
        clickHandler = () => {
          if (!hasAdvanced) {
            console.log("WaitForTaskStep - Tasks section clicked by user, advancing to wait-task");
            hasAdvanced = true;
            // Small delay to let the tab activation complete
            setTimeout(() => next(), 300);
          }
        };

        if (tasksSection && clickHandler) {
          tasksSection.addEventListener('click', clickHandler);
          console.log("WaitForTaskStep - Click listener activated (click-only mode)");
        }
      }, 2000); // Wait 2 seconds for spotlight to be shown

      // Cleanup after 15 seconds if user never clicks
      const timeout = setTimeout(() => {
        if (!hasAdvanced) {
          console.warn("WaitForTaskStep - Timeout waiting for tasks tab click, advancing anyway");
          hasAdvanced = true;
          next(); // Advance anyway to prevent getting stuck
        }
      }, 15000);

      return () => {
        const tasksSection = document.querySelector('[data-tour="tasks-section"]');
        if (tasksSection && clickHandler) {
          tasksSection.removeEventListener('click', clickHandler);
        }
        clearTimeout(spotlightDelay);
        clearTimeout(timeout);
      };
    }
  }, [stepId]); // Removed 'next' from dependencies

  // Auto-advance from spotlight-task-button when user clicks the button and sheet opens
  useEffect(() => {
    if (stepId === "spotlight-task-button") {
      console.log("WaitForTaskStep - On spotlight-task-button step, checking for sheet opening");
      
      let hasAdvanced = false;
      
      // Poll to detect when task creation sheet opens
      const checkInterval = setInterval(() => {
        if (hasAdvanced) {
          return;
        }

        const sheet = document.querySelector('[role="dialog"][data-state="open"]');
        
        if (sheet) {
          console.log("WaitForTaskStep - Task sheet opened, advancing to wait-task");
          hasAdvanced = true;
          clearInterval(checkInterval);
          setTimeout(() => next(), 500);
        }
      }, 200);

      // Cleanup after 10 seconds if sheet never opens
      const timeout = setTimeout(() => {
        if (!hasAdvanced) {
          clearInterval(checkInterval);
          console.warn("WaitForTaskStep - Timeout waiting for task sheet, advancing anyway");
          hasAdvanced = true;
          next();
        }
      }, 10000);

      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeout);
      };
    }
  }, [stepId]); // Removed 'next' from dependencies

  // Auto-advance from navigate-event-details step when user reaches event details page
  useEffect(() => {
    if (stepId === "navigate-event-details" && pathname?.startsWith("/events/")) {
      console.log("WaitForTaskStep - User navigated to event details page, waiting for tasks section...");
      
      let attempts = 0;
      const maxAttempts = 20;
      const checkInterval = setInterval(() => {
        attempts++;
        const tasksSection = document.querySelector('[data-tour="tasks-section"]');
        
        if (tasksSection) {
          console.log(`WaitForTaskStep - Tasks section found after ${attempts} attempts, advancing to spotlight`);
          clearInterval(checkInterval);
          setTimeout(() => next(), 800);
        } else if (attempts >= maxAttempts) {
          console.warn("WaitForTaskStep - Tasks section not found after max attempts, advancing anyway");
          clearInterval(checkInterval);
          next();
        }
      }, 200);
      
      return () => clearInterval(checkInterval);
    }
  }, [stepId, pathname]); // Removed 'next' - it's stable and including it causes loops

  useEffect(() => {
    if (isComplete) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Advance to next step after celebration
      setTimeout(() => {
        next();
      }, 1500);
    }
  }, [isComplete, isSpotlightStep]); // Removed 'next' from dependencies

  // No blocking overlay - sidebar shows the status
  return null;
}
