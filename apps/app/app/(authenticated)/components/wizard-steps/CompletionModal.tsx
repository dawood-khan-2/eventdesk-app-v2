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
import { getCalApi } from "@calcom/embed-react";

export function CompletionModal() {
  const { state } = useOnboarding();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(true);

  // Mark wizard as complete and trigger confetti celebration on mount
  useEffect(() => {
    // Mark wizard as complete immediately when modal is shown
    completeWizard();

    // Initialize Cal.com embed for demo booking
    (async function () {
      const cal = await getCalApi({ namespace: "demo-of-eventdesk" });
      cal("ui", { hideEventTypeDetails: false, layout: "month_view" });
    })();

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

  const handleBookDemo = () => {
    // Cal.com will open its modal, and we dismiss the completion modal
    handleDismiss();
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
          <DialogTitle className="text-center text-2xl sm:text-3xl">You're Ready to Start Managing Events 🎊</DialogTitle>
        </DialogHeader>
        <div className="text-center text-sm sm:text-base pt-3 sm:pt-4 space-y-3 sm:space-y-4 text-muted-foreground">
          {!isMobile && (
            <p>
              You've successfully completed your first workflow in EventDesk:
            </p>
          )}
          <ul className="text-left space-y-2 bg-muted p-3 sm:p-4 rounded-lg max-w-[calc(100%-1rem)] sm:max-w-md mx-auto">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">Captured your first enquiry</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">Created your first event</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">Added your first task</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">{isMobile ? "Explored your dashboard" : "Explored your business dashboard"}</span>
            </li>
          </ul>
          <p className="text-muted-foreground text-sm">
            {isMobile ? "You're all set to start managing real events 🚀" : "Everything is now connected and ready for real clients and events 🚀"}
          </p>
        </div>
        <DialogFooter className="flex-col sm:flex-col gap-3 mt-4 sm:mt-6">
          <Button onClick={handleDismiss} size="lg" className="w-full h-12 sm:h-10">
            Start Managing Events
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 w-full text-sm text-center">
            <Link href="/settings?tab=team" onClick={handleDismiss} className="text-muted-foreground hover:text-foreground transition-colors py-2 sm:py-0">
              Invite your team
            </Link>
            <span className="hidden sm:inline text-muted-foreground">•</span>
            <Link href="/settings" onClick={handleDismiss} className="text-muted-foreground hover:text-foreground transition-colors py-2 sm:py-0">
              Customize workspace
            </Link>
            <span className="hidden sm:inline text-muted-foreground">•</span>
            <button
              data-cal-namespace="demo-of-eventdesk"
              data-cal-link="raja-ramachandran-br5zin/demo-of-eventdesk"
              data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":true}'
              onClick={handleBookDemo}
              className="text-muted-foreground hover:text-foreground transition-colors py-2 sm:py-0 bg-transparent border-none cursor-pointer"
            >
              Get support
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
