import { analytics, getFeatureFlagPayload } from "@repo/analytics/server";
import { auth, currentUser } from "@repo/auth/server";
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
      
      try {
        // Identify user to PostHog before evaluating flags (best practice)
        const user = await currentUser();
        if (user) {
          analytics.identify({
            distinctId: userId,
            properties: {
              email: user.primaryEmailAddress?.emailAddress,
              firstName: user.firstName,
              lastName: user.lastName,
              createdAt: new Date(user.createdAt),
            },
          });
        }
        
        // Get all flags for the user
        await analytics.reloadFeatureFlags();
        const allFlags = await analytics.getAllFlags(userId);
        
        // Check if this specific flag is enabled
        const isEnabled = allFlags?.[key] === true;
        
        return isEnabled ?? (this.defaultValue as boolean);
      } catch (error) {
        console.error(`[Feature Flag] ${key}: Error evaluating flag:`, error);
        return this.defaultValue as boolean;
      }
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

  try {
    // Get all flags for the user
    await analytics.reloadFeatureFlags();
    const allFlags = await analytics.getAllFlags(userId);
    const isEnabled = allFlags?.[key] === true;
    
    if (!isEnabled) {
      return { enabled: false, payload: defaultPayload };
    }

    const payload = await getFeatureFlagPayload<T>(key, userId);

    return {
      enabled: true,
      payload: payload ? { ...defaultPayload, ...payload } : defaultPayload,
    };
  } catch (error) {
    console.error(`[Feature Flag Payload] ${key}: Error:`, error);
    return { enabled: false, payload: defaultPayload };
  }
};
