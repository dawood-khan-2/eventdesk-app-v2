import posthog from "posthog-js";
import { keys } from "./keys";

export const initializeAnalytics = () => {
  const appUrl = new URL(keys().NEXT_PUBLIC_APP_URL);
  posthog.init(keys().NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: keys().NEXT_PUBLIC_POSTHOG_HOST,
    defaults: "2025-05-24",
    __add_tracing_headers: [appUrl.hostname],
  });
};
