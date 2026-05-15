"use client";

import { useEffect, useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { usePathname } from "next/navigation";
import { useWizardPolling } from "../../lib/use-wizard-polling";
import confetti from "canvas-confetti";
import type { WizardStepPayload } from "../../lib/wizard-steps";

export function WaitForEstimateStep() {
  const { next, state } = useOnboarding();
  const pathname = usePathname();
  const payload = state?.currentStep?.payload as WizardStepPayload | undefined;
  const stepId = state?.currentStep?.id;
  const isWaitingStep = payload?.type === "wait-action";
  const isEventButtonSpotlight = stepId === "spotlight-estimate-button-event";

  // Start polling from spotlight step (after delay) OR wait-action step
  const [delayedPollingEnabled, setDelayedPollingEnabled] = useState(false);
  
  useEffect(() => {
    if (isEventButtonSpotlight) {
      console.log("WaitForEstimateStep - On event button spotlight, will start polling after delay");
      const timer = setTimeout(() => {
        console.log("WaitForEstimateStep - Starting delayed polling");
        setDelayedPollingEnabled(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setDelayedPollingEnabled(false);
    }
  }, [isEventButtonSpotlight]);
  
  const shouldPoll = isWaitingStep || delayedPollingEnabled;
  const { isComplete } = useWizardPolling("estimate", shouldPoll);

  // Auto-advance from spotlight-estimates-tab when tab is clicked
  useEffect(() => {
    if (stepId === "spotlight-estimates-tab") {
      console.log("WaitForEstimateStep - On estimates tab spotlight, waiting for tab switch...");
      
      const checkInterval = setInterval(() => {
        // Check if estimates tab is active
        const estimatesTab = document.querySelector('[data-tour="estimates-tab"][data-state="active"]');
        
        if (estimatesTab) {
          console.log("WaitForEstimateStep - Estimates tab activated, advancing to button spotlight");
          clearInterval(checkInterval);
          setTimeout(() => next(), 800);
        }
      }, 200);

      // Cleanup after 15 seconds if tab never switches
      const timeout = setTimeout(() => {
        console.warn("WaitForEstimateStep - Tab not switched after timeout, advancing anyway");
        clearInterval(checkInterval);
        next();
      }, 15000);

      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeout);
      };
    }
  }, [stepId]);

  // Auto-advance from spotlight-estimate-button-event when sheet opens
  useEffect(() => {
    if (stepId === "spotlight-estimate-button-event") {
      console.log("WaitForEstimateStep - On event button spotlight, waiting for sheet...");
      
      // Wait for sheet to open after button click
      const checkInterval = setInterval(() => {
        const sheet = document.querySelector('[role="dialog"][data-state="open"]');
        if (sheet) {
          console.log("WaitForEstimateStep - Sheet opened, advancing to wait-estimate");
          clearInterval(checkInterval);
          setTimeout(() => next(), 500);
        }
      }, 200);

      // Cleanup after 10 seconds if sheet never opens
      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
      }, 10000);

      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeout);
      };
    }
  }, [stepId]);

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
  }, [isComplete, isEventButtonSpotlight]);

  // No blocking overlay - sidebar shows the status
  // Skip button is shown in sidebar via canSkip flag
  return null;
}
