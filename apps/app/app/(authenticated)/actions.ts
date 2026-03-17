"use server";

import { database } from "@repo/database";
import { analytics } from "@repo/analytics/server";
import { z } from "zod";
import { getUserContext } from "./lib/auth-helpers";

const createExitFeedbackSchema = z.object({
  feedbackText: z.string().min(1, "Feedback text is required"),
  source: z.enum(["web", "mobile"]),
});

export async function createExitFeedback(
  data: z.infer<typeof createExitFeedbackSchema>
) {
  const { userId, internalUserId } = await getUserContext();

  const validatedData = createExitFeedbackSchema.parse(data);

  // Create exit feedback record (multiple submissions allowed)
  const exitFeedback = await database.exitFeedback.create({
    data: {
      userId: internalUserId,
      feedbackText: validatedData.feedbackText,
      source: validatedData.source,
    },
  });

  // Track analytics event
  await analytics.capture({
    event: "Exit Feedback Submitted",
    distinctId: userId,
    properties: {
      source: validatedData.source,
      feedbackLength: validatedData.feedbackText.length,
      hasText: validatedData.feedbackText.length > 0,
    },
  });

  return { success: true, data: exitFeedback };
}
