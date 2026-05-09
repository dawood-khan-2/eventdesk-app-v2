"use client";

import { useEffect } from "react";
import { useOnboarding } from "@onboardjs/react";
import { Button } from "@repo/design-system/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@repo/design-system/components/ui/dialog";
import { completeWizard } from "../../lib/wizard-actions";
import confetti from "canvas-confetti";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

export function CompletionModal() {
  const { state } = useOnboarding();

  // Trigger big confetti celebration on mount
  useEffect(() => {
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

  const handleComplete = async () => {
    await completeWizard();
    // Dialog will close and wizard won't show again
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-[550px]" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
          </div>
          <DialogTitle className="text-center text-3xl">You're All Set! 🎊</DialogTitle>
        </DialogHeader>
        <div className="text-center text-base pt-4 space-y-4 text-muted-foreground">
          <p>
            Congratulations! You've successfully completed the onboarding tour and created:
          </p>
          <ul className="text-left space-y-2 bg-muted p-4 rounded-lg max-w-md mx-auto">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>Your first lead</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>Your first event</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>Your first task</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>Explored your dashboard</span>
            </li>
          </ul>
          <p className="text-muted-foreground">
            You're ready to grow your event business with EventDesk!
          </p>
        </div>
        <DialogFooter className="flex-col sm:flex-col gap-3 mt-6">
          <Button onClick={handleComplete} size="lg" className="w-full">
            Start Using EventDesk
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <div className="flex flex-col sm:flex-row gap-2 w-full text-sm text-center">
            <Link href="/settings/members" className="text-muted-foreground hover:text-foreground transition-colors">
              Invite your team
            </Link>
            <span className="hidden sm:inline text-muted-foreground">•</span>
            <Link href="/support" className="text-muted-foreground hover:text-foreground transition-colors">
              Get support
            </Link>
            <span className="hidden sm:inline text-muted-foreground">•</span>
            <Link href="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
              Customize settings
            </Link>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
