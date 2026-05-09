"use client";

import { useOnboarding } from "@onboardjs/react";
import { Button } from "@repo/design-system/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/design-system/components/ui/dialog";
import { Sparkles } from "lucide-react";

export function WelcomeModal() {
  const { next } = useOnboarding();
  console.log("WelcomeModal rendering");

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-[500px]" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">Welcome to EventDesk! 🎉</DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            Let's take a quick tour to help you get started. We'll guide you through creating your first lead, event, and task.
            <br /><br />
            This will only take a few minutes, and you'll be creating <strong>real data</strong> that you can use right away!
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center mt-4">
          <Button onClick={() => next()} size="lg" className="w-full sm:w-auto">
            Get Started →
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
