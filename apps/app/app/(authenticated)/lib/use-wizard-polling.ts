"use client";

import { useCallback, useEffect, useState } from "react";

type ActionType = "lead" | "event" | "task" | "estimate";

interface WizardStatus {
  currentStep: string;
  isCompleted: boolean;
  hasLead: boolean;
  hasEvent: boolean;
  hasTask: boolean;
  hasEstimate: boolean;
}

/**
 * Hook that checks wizard status on visibility/focus events + 5-second polling
 * Checks when: page becomes visible, window gains focus, every 5 seconds, or manually triggered
 */
export function useWizardPolling(actionType: ActionType, enabled = true) {
  const [isComplete, setIsComplete] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const checkStatus = useCallback(async () => {
    if (isComplete || !enabled) {
      return;
    }

    try {
      const response = await fetch("/api/wizard-status", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const status: WizardStatus = await response.json();
      
      const actionComplete = 
        (actionType === "lead" && status.hasLead) ||
        (actionType === "event" && status.hasEvent) ||
        (actionType === "task" && status.hasTask) ||
        (actionType === "estimate" && status.hasEstimate);

      if (actionComplete) {
        setIsComplete(true);
        setIsPolling(false);
      }
    } catch (error) {
      console.error("Failed to check wizard status:", error);
    }
  }, [actionType, enabled, isComplete]);

  useEffect(() => {
    if (!enabled || isComplete) {
      return;
    }

    setIsPolling(true);

    // Check immediately
    checkStatus();

    // Check when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkStatus();
      }
    };

    // Check when window gains focus (user clicks on window)
    const handleFocus = () => {
      checkStatus();
    };

    // Check every 5 seconds as fallback for faster detection
    const interval = setInterval(checkStatus, 5000);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      setIsPolling(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionType, enabled, isComplete]);

  return {
    isComplete,
    isPolling,
    checkNow: checkStatus, // Manual trigger if needed
  };
}
