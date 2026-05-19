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
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[500px] p-4 sm:p-6" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl sm:text-2xl">Welcome to EventDesk 🎉</DialogTitle>
          <DialogDescription className="text-center text-sm sm:text-base pt-2">
            Let's set up your first event workflow together.
            We'll guide you through capturing an enquiry, creating an event, adding tasks, and exploring how everything connects in one place.
            <br /><br />
            It only takes a few minutes—and everything you create will be real data you can continue working with later ✨
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center mt-4">
          <Button onClick={() => next()} size="lg" className="w-full sm:w-auto h-12 sm:h-10">
            Set Up My First Event →
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
