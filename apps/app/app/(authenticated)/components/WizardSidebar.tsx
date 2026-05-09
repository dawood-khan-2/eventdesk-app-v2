"use client";

import { useState, useEffect } from "react";
import { useOnboarding } from "@onboardjs/react";
import { Card } from "@repo/design-system/components/ui/card";
import { Button } from "@repo/design-system/components/ui/button";
import { Progress } from "@repo/design-system/components/ui/progress";
import { X, ChevronDown, ChevronUp, Loader2, SkipForward } from "lucide-react";
import { resetWizard } from "../lib/wizard-actions";
import { WIZARD_STEP_IDS, getStepNumber, type WizardStepPayload } from "../lib/wizard-steps";
import { toast } from "sonner";

export function WizardSidebar() {
  const { state, next } = useOnboarding();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Detect when sheets/dialogs are open to reposition sidebar
  useEffect(() => {
    const checkForOpenSheets = () => {
      // Check for open Sheet components (they have data-state="open")
      const openSheet = document.querySelector('[data-state="open"][role="dialog"]');
      setIsSheetOpen(!!openSheet);
    };

    // Check immediately
    checkForOpenSheets();

    // Watch for DOM changes (sheets opening/closing)
    const observer = new MutationObserver(checkForOpenSheets);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-state"],
    });

    return () => observer.disconnect();
  }, []);

  if (!state?.currentStep) {
    return null;
  }

  const payload = state.currentStep.payload as WizardStepPayload | undefined;
  const currentStepId = state.currentStep.id as string;
  const stepNumber = getStepNumber(currentStepId);
  const totalSteps = WIZARD_STEP_IDS.length;
  const progressPercentage = (stepNumber / totalSteps) * 100;

  const isWaitingStep = payload?.type === "wait-action";
  const isModalStep = payload?.type === "modal";
  const canSkip = payload?.canSkip ?? false;

  // Hide sidebar for modal steps (they're full-screen)
  if (isModalStep) {
    return null;
  }

  const handleExit = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to skip the tour? You can restart it later from Settings."
    );

    if (confirmed) {
      setIsExiting(true);
      const result = await resetWizard();

      if (result.success) {
        toast.success("Tour skipped. You can restart it anytime from Settings.");
        // Page will reload due to revalidatePath
      } else {
        toast.error("Failed to exit tour");
        setIsExiting(false);
      }
    }
  };

  if (isCollapsed) {
    return (
      <div className={`fixed bottom-6 z-[60] transition-all duration-300 ${isSheetOpen ? 'left-6' : 'right-6'}`}>
        <Button
          size="lg"
          onClick={() => setIsCollapsed(false)}
          className="shadow-lg h-14 px-6"
        >
          <span className="flex items-center gap-2">
            <span className="text-sm font-medium">Tour: Step {stepNumber}/{totalSteps}</span>
            <ChevronUp className="w-4 h-4" />
          </span>
        </Button>
      </div>
    );
  }

  return (
    <Card className={`fixed bottom-6 w-80 z-[60] shadow-2xl border-2 transition-all duration-300 ${isSheetOpen ? 'left-6' : 'right-6'}`}>
      {/* Header */}
      <div className="p-4 border-b bg-muted/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-semibold">Onboarding Tour</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsCollapsed(true)}
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleExit}
              disabled={isExiting}
            >
              {isExiting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Step {stepNumber} of {totalSteps}</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <Progress value={progressPercentage} className="h-2 mt-2" />
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-base mb-2">
          {payload?.title || "Loading..."}
        </h3>
        {payload?.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {payload.description}
          </p>
        )}

        {/* Status indicator */}
        {isWaitingStep && (
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Waiting for you to complete this action...
            </p>
          </div>
        )}

        {/* Skip button for optional steps */}
        {canSkip && (
          <Button
            onClick={() => next()}
            variant="outline"
            size="sm"
            className="mt-3 w-full"
          >
            <SkipForward className="w-4 h-4 mr-2" />
            Skip This Step
          </Button>
        )}
      </div>
    </Card>
  );
}
