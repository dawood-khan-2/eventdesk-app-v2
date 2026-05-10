"use client";

import { useOnboarding } from "@onboardjs/react";
import { useIsMobile } from "@repo/design-system/hooks/use-mobile";
import { Button } from "@repo/design-system/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/design-system/components/ui/dialog";
import { Sparkles } from "lucide-react";

export function WelcomeModal() {
  const { next } = useOnboarding();
  const isMobile = useIsMobile();
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
          <DialogTitle className="text-center text-xl sm:text-2xl">Welcome to EventDesk! 🎉</DialogTitle>
          <DialogDescription className="text-center text-sm sm:text-base pt-2">
            {isMobile ? (
              <>
                Let's take a quick tour to help you get started. You'll create <strong>real data</strong> you can use right away!
              </>
            ) : (
              <>
                Let's take a quick tour to help you get started. We'll guide you through creating your first lead, event, and task.
                <br /><br />
                This will only take a few minutes, and you'll be creating <strong>real data</strong> that you can use right away!
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center mt-4">
          <Button onClick={() => next()} size="lg" className="w-full sm:w-auto h-12 sm:h-10">
            Get Started →
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
