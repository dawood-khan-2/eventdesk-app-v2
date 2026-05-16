"use client";

import { useEffect, useState, useRef } from "react";
import { useOnboarding } from "@onboardjs/react";
import { usePathname } from "next/navigation";
import { useWizardPolling } from "../../lib/use-wizard-polling";
import confetti from "canvas-confetti";
import { Loader2 } from "lucide-react";
import type { WizardStepPayload } from "../../lib/wizard-steps";

export function WaitForLeadStep() {
  const timestamp = Date.now();
  const { next, state } = useOnboarding();
  const pathname = usePathname();
  const payload = state?.currentStep?.payload as WizardStepPayload | undefined;
  const stepId = state?.currentStep?.id;
  const isWaitingStep = payload?.type === "wait-action";
  const isSpotlightStep = stepId === "spotlight-lead-button";
  
  // Use ref to avoid stale closure issues with next()
  const nextRef = useRef(next);
  useEffect(() => {
    nextRef.current = next;
  }, [next]);
  
  console.log(`[${timestamp}] WaitForLeadStep RENDER - stepId:`, stepId, "pathname:", pathname);

  // Start polling from spotlight step (after delay) OR wait-action step
  const [delayedPollingEnabled, setDelayedPollingEnabled] = useState(false);
  
  // When on spotlight step, wait 3 seconds before enabling polling (give sheet time to open)
  useEffect(() => {
    if (isSpotlightStep) {
      console.log("WaitForLeadStep - On spotlight step, will start polling after delay");
      const timer = setTimeout(() => {
        console.log("WaitForLeadStep - Starting delayed polling");
        setDelayedPollingEnabled(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setDelayedPollingEnabled(false);
    }
  }, [isSpotlightStep]);
  
  const shouldPoll = isWaitingStep || delayedPollingEnabled;
  const { isComplete } = useWizardPolling("lead", shouldPoll);

  // Auto-advance from spotlight-lead-button when sheet opens
  useEffect(() => {
    if (stepId === "spotlight-lead-button") {
      console.log("WaitForLeadStep - Watching for sheet to open...");
      
      // Wait for sheet to open after button click
      const checkInterval = setInterval(() => {
        // Try multiple selectors to catch the sheet
        const sheet = document.querySelector('[data-slot="sheet-content"][data-state="open"]') ||
                     document.querySelector('[role="dialog"][data-state="open"]') ||
                     document.querySelector('[data-state="open"][data-slot="sheet-content"]');
        
        if (sheet) {
          console.log("WaitForLeadStep - Sheet opened, advancing to wait-lead");
          clearInterval(checkInterval);
          setTimeout(() => nextRef.current(), 500);
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

  // Auto-advance from navigate-leads step when user reaches /leads page
  useEffect(() => {
    const ts = Date.now();
    console.log(`[${ts}] WaitForLeadStep useEffect[navigation] - stepId:`, stepId, "pathname:", pathname);
    
    if (stepId === "navigate-leads" && pathname === "/leads") {
      console.log(`[${ts}] WaitForLeadStep - User navigated to leads page, waiting for button to render...`);
      
      // Wait for the Add Lead button to exist in DOM before advancing
      let attempts = 0;
      const maxAttempts = 20;
      const checkInterval = setInterval(() => {
        attempts++;
        const button = document.querySelector('[data-tour="create-lead-button"]');
        
        if (button) {
          console.log(`WaitForLeadStep - Button found after ${attempts} attempts, advancing to spotlight`);
          clearInterval(checkInterval);
          setTimeout(() => nextRef.current(), 800);
        } else if (attempts >= maxAttempts) {
          console.warn("WaitForLeadStep - Button not found after max attempts, advancing anyway");
          clearInterval(checkInterval);
          nextRef.current();
        }
      }, 200);
      
      return () => clearInterval(checkInterval);
    }
  }, [stepId, pathname]); // Removed 'next' - it's stable and including it causes loops

  // Auto-advance when lead is created
  useEffect(() => {
    const ts = Date.now();
    console.log(`[${ts}] WaitForLeadStep useEffect[complete] - isComplete:`, isComplete, "isSpotlightStep:", isSpotlightStep);
    
    if (isComplete) {
      console.log(`[${ts}] WaitForLeadStep - Lead created, celebrating!`);
      // Celebrate!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Advance to next step after celebration
      setTimeout(() => {
        nextRef.current();
      }, 1500);
    }
  }, [isComplete, isSpotlightStep]); // Removed 'next' from dependencies

  // No blocking overlay - sidebar shows the status
  return null;
}
