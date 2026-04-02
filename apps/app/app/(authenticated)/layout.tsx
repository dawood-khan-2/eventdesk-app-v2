import { auth, currentUser } from "@repo/auth/server";
import { SidebarProvider } from "@repo/design-system/components/ui/sidebar";
import { showBetaFeature, showExitFeedback, showChatWidget, showFeedbackButton, getFlagWithPayload } from "@repo/feature-flags";
import { secure } from "@repo/security";
import Script from "next/script";
import type { ReactNode } from "react";
import { env } from "@/env";
import { NotificationsProvider } from "./components/notifications-provider";
import { GlobalSidebar } from "./components/sidebar";
import { ExitFeedbackProvider } from "./components/exit-feedback-provider";

type AppLayoutProperties = {
  readonly children: ReactNode;
};

const AppLayout = async ({ children }: AppLayoutProperties) => {
  if (env.ARCJET_KEY) {
    await secure(["CATEGORY:PREVIEW", "CATEGORY:MONITOR"]);
  }

  const user = await currentUser();
  const { redirectToSignIn } = await auth();
  const betaFeature = await showBetaFeature();
  const exitFeedbackEnabled = await showExitFeedback();
  const idleFeedback = await getFlagWithPayload("showIdleFeedback", {
    timeoutSeconds: 30,
  });
  const feedbackButtonEnabled = await showFeedbackButton();
  const chatWidgetEnabled = await showChatWidget();
  const tawkPropertyId = env.NEXT_PUBLIC_TAWK_PROPERTY_ID;
  const tawkWidgetId = env.NEXT_PUBLIC_TAWK_WIDGET_ID;

  if (!user) {
    return redirectToSignIn();
  }

  return (
    <>
      <NotificationsProvider userId={user.id}>
        <SidebarProvider suppressHydrationWarning>
          <GlobalSidebar>
            {betaFeature && (
              <div className="m-4 rounded-full bg-blue-500 p-1.5 text-center text-sm text-white">
                Beta feature now available
              </div>
            )}
            {children}
          </GlobalSidebar>
        </SidebarProvider>
      </NotificationsProvider>
      {(exitFeedbackEnabled || idleFeedback.enabled || feedbackButtonEnabled) && (
        <ExitFeedbackProvider
          enableExitDetection={exitFeedbackEnabled}
          enableIdleDetection={idleFeedback.enabled}
          idleTimeoutSeconds={idleFeedback.payload.timeoutSeconds}
          enableFeedbackButton={feedbackButtonEnabled}
        />
      )}
      
      {/* Tawk.to Chat Widget - Authenticated routes only */}
      {chatWidgetEnabled && tawkPropertyId && tawkWidgetId && (
        <Script id="tawk-to-chat" strategy="afterInteractive">
          {`
            var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
            (function(){
              var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
              s1.async=true;
              s1.src='https://embed.tawk.to/${tawkPropertyId}/${tawkWidgetId}';
              s1.charset='UTF-8';
              s1.setAttribute('crossorigin','*');
              s0.parentNode.insertBefore(s1,s0);
            })();
          `}
        </Script>
      )}
    </>
  );
};

export default AppLayout;
