"use client";

import { useState } from "react";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import { Label } from "@repo/design-system/components/ui/label";

type TriggerType = "exit" | "idle" | "manual";

interface ExitFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (feedback: string) => Promise<void>;
  onDismiss: () => void;
  triggerType: TriggerType;
}

const getContent = (triggerType: TriggerType) => {
  switch (triggerType) {
    case "exit":
      return {
        title: "Sorry to see you leave!",
        description: "May we know the reason so that we can serve you better?",
        placeholder: "Tell us what we could improve...",
      };
    case "idle":
      return {
        title: "Still there?",
        description: "We noticed you've been inactive. Is there anything we can help you with or improve?",
        placeholder: "Share what's on your mind...",
      };
    case "manual":
      return {
        title: "We'd love your feedback!",
        description: "Help us improve EventDesk by sharing your thoughts and suggestions.",
        placeholder: "What would make EventDesk better for you?",
      };
  }
};

export function ExitFeedbackDialog({
  open,
  onOpenChange,
  onSubmit,
  onDismiss,
  triggerType,
}: ExitFeedbackDialogProps) {
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const content = getContent(triggerType);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(feedback);
      onOpenChange(false);
      setFeedback("");
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{content.title}</DialogTitle>
          <DialogDescription>
            {content.description}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="feedback">Your feedback</Label>
            <Textarea
              id="feedback"
              placeholder={content.placeholder}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={5}
              className="resize-none"
              disabled={isSubmitting}
            />
          </div>
        </div>
        <DialogFooter className={triggerType === "manual" ? "sm:justify-end" : "sm:justify-between"}>
          {triggerType !== "manual" && (
            <Button
              type="button"
              variant="ghost"
              onClick={onDismiss}
              disabled={isSubmitting}
            >
              Don't show this again
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
