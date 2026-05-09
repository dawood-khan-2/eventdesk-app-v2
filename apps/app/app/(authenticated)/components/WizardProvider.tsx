"use client";

import { useEffect, useCallback } from "react";
import { OnboardingProvider, useOnboarding } from "@onboardjs/react";
import { driver } from "driver.js";
import type { DriveStep } from "driver.js";
import { wizardSteps, type WizardStepPayload } from "../lib/wizard-steps";
import { updateWizardStep } from "../lib/wizard-actions";
import { WizardSidebar } from "./WizardSidebar";
import "driver.js/dist/driver.css";

interface WizardProviderProps {
  children: React.ReactNode;
  initialStep: string | null;
}

/**
 * Internal component that handles driver.js integration
 * Must be inside OnboardingProvider to access useOnboarding hook
 */
function WizardDriverIntegration() {
  const { state, next } = useOnboarding();

  useEffect(() => {
    if (!state?.currentStep) {
      return;
    }

    const payload = state.currentStep.payload as WizardStepPayload | undefined;
    const stepType = payload?.type;

    // Only handle spotlight steps with driver.js
    if (stepType !== "spotlight") {
      return;
    }

    const element = payload?.element;
    if (!element) {
      return;
    }

    console.log("WizardDriverIntegration - Starting spotlight for element:", element);

    // Wait for element to be in DOM, with retries
    let attempts = 0;
    const maxAttempts = 20;
    const attemptDelay = 400;

    const tryStartDriver = () => {
      const targetElement = document.querySelector(element);
      
      if (targetElement) {
        console.log("WizardDriverIntegration - Element found, starting driver.js");
        
        // Create driver.js spotlight
        const driverObj = driver({
          showProgress: false,
          showButtons: [],  // No buttons, we control flow via sidebar/actions
          popoverClass: "wizard-spotlight-popover",
          allowClose: false,  // Don't show close button
          animate: true,
          steps: [
            {
              element,
              popover: {
                title: payload.title,
                description: payload.description || "",
                side: payload.spotlightSide || "bottom",
                showButtons: [],  // Ensure no buttons at step level too
              },
            } as DriveStep,
          ],
          onHighlighted: (element) => {
            // Add click listener to auto-close spotlight but DON'T advance yet
            // Let polling detect when data is created, then advance
            const targetEl = element as HTMLElement;
            if (targetEl) {
              const clickHandler = () => {
                console.log("WizardDriverIntegration - Element clicked, closing spotlight");
                driverObj.destroy();
                // Note: Not calling next() here - let polling handle advancement
              };
              
              targetEl.addEventListener("click", clickHandler, { once: true });
            }
          },
        });

        try {
          driverObj.drive();
        } catch (error) {
          console.error("WizardDriverIntegration - Failed to start driver.js:", error);
        }

        return driverObj;
      } else {
        attempts++;
        if (attempts < maxAttempts) {
          console.log(`WizardDriverIntegration - Element not found yet (attempt ${attempts}/${maxAttempts}), retrying...`);
          return null;
        } else {
          console.warn(`WizardDriverIntegration - Element "${element}" not found after ${maxAttempts} attempts`);
          return null;
        }
      }
    };

    // Try immediately first
    let driverObj = tryStartDriver();
    
    // If not found, retry with intervals
    let interval: ReturnType<typeof setInterval> | undefined = undefined;
    
    if (!driverObj) {
      interval = setInterval(() => {
        driverObj = tryStartDriver();
        if (driverObj || attempts >= maxAttempts) {
          if (interval) clearInterval(interval);
        }
      }, attemptDelay);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (driverObj) driverObj.destroy();
    };
  }, [state?.currentStep?.id]); // Removed 'next' - causes infinite render loops!

  return null;
}

/**
 * Internal component that syncs wizard state to database
 */
/**
 * Component that persists wizard state to database
 * NOTE: We DON'T persist during active wizard to prevent render loops
 * Only completeWizard() and resetWizard() update the database
 * If user refreshes during wizard, they'll restart - acceptable tradeoff
 */
function WizardStatePersistence() {
  // Persistence disabled during active wizard to prevent continuous re-renders
  // The layout would re-fetch data after DB updates, causing render loops
  // Users typically complete wizard in one session, so losing progress on refresh is acceptable
  return null;
}

/**
 * Main wizard provider component
 * Wraps app content with OnboardJS and integrates driver.js for UI spotlights
 */
export function WizardProvider({ children, initialStep }: WizardProviderProps) {
  const timestamp = Date.now();
  console.log(`[${timestamp}] WizardProvider RENDER - initialStep:`, initialStep);
  
  // If wizard is completed or dismissed, don't render wizard UI
  if (initialStep === "COMPLETED" || initialStep === "DISMISSED") {
    console.log(`[${timestamp}] WizardProvider - Completed/dismissed, returning children only`);
    return <>{children}</>;
  }

  // Use initialStep from server, defaulting to "welcome" for new users
  // DON'T read localStorage in render - causes infinite loops!
  // The debounced DB persistence handles saving state
  const stepId = initialStep || "welcome";
  console.log(`[${timestamp}] WizardProvider - stepId:`, stepId);

  const handleFlowComplete = useCallback(async () => {
    const ts = Date.now();
    console.log(`[${ts}] WizardProvider - handleFlowComplete called`);
    // This is called when user reaches the end of the wizard
    // The CompleteModal component handles calling completeWizard()
  }, []);

  return (
    <OnboardingProvider
      steps={wizardSteps}
      initialStepId={stepId}
      onFlowComplete={handleFlowComplete}
    >
      {/* Render the current step component */}
      <WizardStepRenderer />

      {/* Show sidebar with progress */}
      <WizardSidebar />

      {/* Handle driver.js spotlights */}
      <WizardDriverIntegration />

      {/* Sync state to database */}
      <WizardStatePersistence />

      {/* Render children (the actual app) */}
      {children}
    </OnboardingProvider>
  );
}

/**
 * Helper component to render the current step
 */
function WizardStepRenderer() {
  const { renderStep, state } = useOnboarding();
  console.log("WizardStepRenderer - Current step:", state?.currentStep?.id);
  return <>{renderStep()}</>;
}
