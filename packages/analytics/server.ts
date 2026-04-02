import "server-only";
import { PostHog } from "posthog-node";
import { keys } from "./keys";

export const analytics = new PostHog(keys().NEXT_PUBLIC_POSTHOG_KEY, {
  host: keys().NEXT_PUBLIC_POSTHOG_HOST,

  // Don't batch events and flush immediately - we're running in a serverless environment
  flushAt: 1,
  flushInterval: 0,
});

/**
 * Get feature flag payload (JSON configuration)
 * @param key - Feature flag key
 * @param userId - User distinct ID
 * @returns Parsed JSON payload or null
 */
export const getFeatureFlagPayload = async <T = any>(
  key: string,
  userId: string
): Promise<T | null> => {
  try {
    const payload = await analytics.getFeatureFlagPayload(key, userId);
    return payload as T | null;
  } catch {
    return null;
  }
};
