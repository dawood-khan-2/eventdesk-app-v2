"use client";

import { useRouter } from "next/navigation";
import { Sparkles, BookOpen } from "lucide-react";
import { Button } from "@repo/design-system/components/ui/button";

interface WelcomeScreenProps {
  onStartTour: () => void;
}

export function WelcomeScreen({ onStartTour }: WelcomeScreenProps) {
  const router = useRouter();

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        {/* Welcome Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to EventDesk! 🎉
          </h1>
          <p className="text-lg text-muted-foreground">
            Your all-in-one event management platform. Let's take a quick tour to show you around.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-center">
          <Button 
            size="lg" 
            onClick={onStartTour}
            className="gap-2 w-full md:w-auto flex-col h-auto py-3"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Start Product Tour
            </span>
            <span className="text-xs opacity-80 mt-1">Takes less than 2 minutes · Skip anytime</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => router.push("/events")}
            className="w-full md:w-auto flex-col h-auto py-3"
          >
            <span>Skip Tour</span>
            <span className="text-xs opacity-70 mt-1">and explore on your own</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
