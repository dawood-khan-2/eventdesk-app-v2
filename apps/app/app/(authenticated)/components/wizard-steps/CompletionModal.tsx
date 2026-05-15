"use client";

import { useEffect, useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { useIsMobile } from "@repo/design-system/hooks/use-mobile";
import { Button } from "@repo/design-system/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@repo/design-system/components/ui/dialog";
import { completeWizard } from "../../lib/wizard-actions";
import confetti from "canvas-confetti";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

export function CompletionModal() {
  const { state } = useOnboarding();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(true);

  // Mark wizard as complete and trigger confetti celebration on mount
  useEffect(() => {
    // Mark wizard as complete immediately when modal is shown
    completeWizard();

    // Multiple confetti bursts for celebration!
    const celebrate = () => {
      confetti({
        particleCount: 200,
        spread: 120,
        origin: { y: 0.6 },
      });

      setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { x: 0.3, y: 0.5 },
        });
      }, 200);

      setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { x: 0.7, y: 0.5 },
        });
      }, 400);
    };

    celebrate();
  }, []);

  const handleDismiss = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-[550px] p-4 sm:p-6" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-green-500" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl sm:text-3xl">You're All Set! 🎊</DialogTitle>
        </DialogHeader>
        <div className="text-center text-sm sm:text-base pt-3 sm:pt-4 space-y-3 sm:space-y-4 text-muted-foreground">
          {!isMobile && (
            <p>
              Congratulations! You've successfully completed the onboarding tour and created:
            </p>
          )}
          <ul className="text-left space-y-2 bg-muted p-3 sm:p-4 rounded-lg max-w-[calc(100%-1rem)] sm:max-w-md mx-auto">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">Your first lead</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">Your first event</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">Your first task</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">Explored your dashboard</span>
            </li>
          </ul>
          <p className="text-muted-foreground text-sm">
            You're ready to grow your event business!
          </p>
        </div>
        <DialogFooter className="flex-col sm:flex-col gap-3 mt-4 sm:mt-6">
          <Button onClick={handleDismiss} size="lg" className="w-full h-12 sm:h-10">
            Start Using EventDesk
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 w-full text-sm text-center">
            <Link href="/settings?tab=team" onClick={handleDismiss} className="text-muted-foreground hover:text-foreground transition-colors py-2 sm:py-0">
              Invite your team
            </Link>
            <span className="hidden sm:inline text-muted-foreground">•</span>
            <a href="https://event-desk.tawk.help/" target="_blank" rel="noopener noreferrer" onClick={handleDismiss} className="text-muted-foreground hover:text-foreground transition-colors py-2 sm:py-0">
              Get support
            </a>
            <span className="hidden sm:inline text-muted-foreground">•</span>
            <Link href="/settings" onClick={handleDismiss} className="text-muted-foreground hover:text-foreground transition-colors py-2 sm:py-0">
              Customize settings
            </Link>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
