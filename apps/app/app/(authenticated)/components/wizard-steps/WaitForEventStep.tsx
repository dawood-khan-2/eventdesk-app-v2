"use client";

import { useEffect, useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { usePathname } from "next/navigation";
import { useWizardPolling } from "../../lib/use-wizard-polling";
import confetti from "canvas-confetti";
import { Loader2 } from "lucide-react";
import type { WizardStepPayload } from "../../lib/wizard-steps";

export function WaitForEventStep() {
  const { next, state } = useOnboarding();
  const pathname = usePathname();
  const payload = state?.currentStep?.payload as WizardStepPayload | undefined;
  const stepId = state?.currentStep?.id;
  const isWaitingStep = payload?.type === "wait-action";
  const isSpotlightStep = stepId === "spotlight-event-button";

  // Start polling from spotlight step (after delay) OR wait-action step
  const [delayedPollingEnabled, setDelayedPollingEnabled] = useState(false);
  
  useEffect(() => {
    if (isSpotlightStep) {
      console.log("WaitForEventStep - On spotlight step, will start polling after delay");
      const timer = setTimeout(() => {
        console.log("WaitForEventStep - Starting delayed polling");
        setDelayedPollingEnabled(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setDelayedPollingEnabled(false);
    }
  }, [isSpotlightStep]);
  
  const shouldPoll = isWaitingStep || delayedPollingEnabled;
  const { isComplete } = useWizardPolling("event", shouldPoll);

  // Auto-advance from spotlight-event-button when sheet opens
  useEffect(() => {
    if (stepId === "spotlight-event-button") {
      // Wait for sheet to open after button click
      const checkInterval = setInterval(() => {
        const sheet = document.querySelector('[role="dialog"][data-state="open"]');
        if (sheet) {
          console.log("WaitForEventStep - Sheet opened, advancing to wait-event");
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
  }, [stepId]); // Removed 'next' from dependencies

  // Auto-advance from navigate-events step when user reaches /events page
  useEffect(() => {
    if (stepId === "navigate-events" && pathname === "/events") {
      console.log("WaitForEventStep - User navigated to events page, waiting for button to render...");
      
      let attempts = 0;
      const maxAttempts = 20;
      const checkInterval = setInterval(() => {
        attempts++;
        const button = document.querySelector('[data-tour="create-event-button"]');
        
        if (button) {
          console.log(`WaitForEventStep - Button found after ${attempts} attempts, advancing to spotlight`);
          clearInterval(checkInterval);
          setTimeout(() => next(), 800);
        } else if (attempts >= maxAttempts) {
          console.warn("WaitForEventStep - Button not found after max attempts, advancing anyway");
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
