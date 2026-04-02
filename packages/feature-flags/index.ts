import { createFlag } from "./lib/create-flag";

export const showBetaFeature = createFlag("showBetaFeature");
export const showChatWidget = createFlag("showChatWidget");
export const showExitFeedback = createFlag("showExitFeedback");
export const showIdleFeedback = createFlag("showIdleFeedback");
export const showFeedbackButton = createFlag("showFeedbackButton");

// Export helper for flags with payloads
export { getFlagWithPayload } from "./lib/create-flag";
