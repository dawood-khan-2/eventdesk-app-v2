"use client";

import { useState } from "react";
import { useExitIntent } from "use-exit-intent";
import { useIdleTimer } from "react-idle-timer";
import { analytics } from "@repo/analytics";
import { ExitFeedbackDialog } from "./exit-feedback-dialog";
import { FloatingFeedbackButton } from "./floating-feedback-button";
import { createExitFeedback } from "@/app/(authenticated)/actions";

type TriggerType = "exit" | "idle" | "manual";

export function ExitFeedbackProvider() {
  const [showDialog, setShowDialog] = useState(false);
  const [triggerType, setTriggerType] = useState<TriggerType>("exit");

  // Exit intent detection (mouse leave, beforeunload)
  const { registerHandler, unsubscribe } = useExitIntent({
    cookie: {
      daysToExpire: 30,
      key: "use-exit-intent",
    },
    desktop: {
      triggerOnIdle: false, // Disabled - using react-idle-timer instead
      useBeforeUnload: true,
      triggerOnMouseLeave: true,
      delayInSecondsToTrigger: 1,
    },
    mobile: {
      triggerOnIdle: false, // Disabled - using react-idle-timer instead
      delayInSecondsToTrigger: 1,
    },
  });

  // Idle detection (30 seconds)
  useIdleTimer({
    timeout: 30000, // 30 seconds
    onIdle: () => {
      setTriggerType("idle");
      setShowDialog(true);
      
      // Track analytics: idle feedback shown
      analytics.capture("Exit Feedback Shown", {
        trigger: "idle",
        source: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? "mobile" : "web",
      });
    },
    throttle: 500,
  });

  // Exit intent handler
  registerHandler({
    id: "exit-feedback",
    handler: () => {
      setTriggerType("exit");
      setShowDialog(true);
      
      // Track analytics: exit feedback shown
      analytics.capture("Exit Feedback Shown", {
        trigger: "exit",
        source: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? "mobile" : "web",
      });
    },
  });

  const handleManualTrigger = () => {
    setTriggerType("manual");
    setShowDialog(true);
    
    // Track analytics: manual feedback shown
    analytics.capture("Exit Feedback Shown", {
      trigger: "manual",
      source: "mobile",
    });
  };

  const handleSubmit = async (feedbackText: string) => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const source = isMobile ? "mobile" : "web";

    await createExitFeedback({
      feedbackText,
      source,
    });
    
    // Track analytics: feedback submitted
    analytics.capture("Exit Feedback Submitted", {
      trigger: triggerType,
      source,
      feedbackLength: feedbackText.length,
    });
  };

  const handleDismiss = () => {
    unsubscribe();
    setShowDialog(false);
    
    // Track analytics: feedback dismissed
    analytics.capture("Exit Feedback Dismissed", {
      trigger: triggerType,
      source: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? "mobile" : "web",
    });
  };
  
  const handleSkip = () => {
    setShowDialog(false);
    
    // Track analytics: feedback skipped
    analytics.capture("Exit Feedback Skipped", {
      trigger: triggerType,
      source: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? "mobile" : "web",
    });
  };

  return (
    <>
      <ExitFeedbackDialog
        open={showDialog}
        onOpenChange={(open) => {
          if (!open) {
            handleSkip();
          } else {
            setShowDialog(open);
          }
        }}
        onSubmit={handleSubmit}
        onDismiss={handleDismiss}
        triggerType={triggerType}
      />
      <FloatingFeedbackButton onClick={handleManualTrigger} />
    </>
  );
}
