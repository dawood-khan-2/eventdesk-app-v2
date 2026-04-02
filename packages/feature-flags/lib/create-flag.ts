import { analytics, getFeatureFlagPayload } from "@repo/analytics/server";
import { auth } from "@repo/auth/server";
import { flag } from "flags/next";

export const createFlag = (key: string) =>
  flag({
    key,
    defaultValue: false,
    async decide() {
      const { userId } = await auth();

      if (!userId) {
        return this.defaultValue as boolean;
      }

      const isEnabled = await analytics.isFeatureEnabled(key, userId);

      return isEnabled ?? (this.defaultValue as boolean);
    },
  });

/**
 * Get feature flag value with JSON payload
 * @param key - Feature flag key
 * @param defaultPayload - Default payload if flag is disabled or no payload exists
 * @returns Object with enabled status and payload
 */
export const getFlagWithPayload = async <T extends Record<string, any>>(
  key: string,
  defaultPayload: T
): Promise<{ enabled: boolean; payload: T }> => {
  const { userId } = await auth();

  if (!userId) {
    return { enabled: false, payload: defaultPayload };
  }

  const isEnabled = await analytics.isFeatureEnabled(key, userId);
  
  if (!isEnabled) {
    return { enabled: false, payload: defaultPayload };
  }

  const payload = await getFeatureFlagPayload<T>(key, userId);

  return {
    enabled: true,
    payload: payload ? { ...defaultPayload, ...payload } : defaultPayload,
  };
};
