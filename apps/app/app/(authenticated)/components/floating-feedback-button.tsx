"use client";

import { MessageCircleQuestion } from "lucide-react";
import { useEffect, useState } from "react";

interface FloatingFeedbackButtonProps {
  onClick: () => void;
}

export function FloatingFeedbackButton({ onClick }: FloatingFeedbackButtonProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render until mounted to avoid hydration mismatch
  if (!isMounted) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 h-12 w-12 md:h-14 md:w-14 rounded-full shadow-lg z-50 bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center p-0 border-0"
      aria-label="Share feedback"
    >
      <MessageCircleQuestion className="h-6 w-6 md:h-8 md:w-8" strokeWidth={1.5} />
    </button>
  );
}
