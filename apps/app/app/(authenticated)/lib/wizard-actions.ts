"use server";

import { database, multiTenantDb } from "@repo/database";
import { revalidatePath } from "next/cache";
import { getTenantContext } from "./auth-helpers";

export interface WizardStatus {
  currentStep: string | null;
  isCompleted: boolean;
  hasLead: boolean;
  hasEvent: boolean;
  hasTask: boolean;
  hasEstimate: boolean;
}

/**
 * Get wizard status for the current organization
 */
export async function getWizardStatus(): Promise<WizardStatus> {
  try {
    const { clerkOrgId, internalOrgId } = await getTenantContext();

    // Get current wizard step
    const org = await database.organization.findUnique({
      where: { clerkId: clerkOrgId },
      select: { onboardingWizardStep: true },
    });

    const currentStep = org?.onboardingWizardStep || null;
    const isCompleted = currentStep === "COMPLETED";

    // Check what data exists (for action-based steps)
    const [leadCount, eventCount, taskCount, estimateCount] = await multiTenantDb
      .forTenant(internalOrgId)
      .run(async (prisma) => {
        const [leads, events, tasks, estimates] = await Promise.all([
          prisma.lead.count(),
          prisma.event.count(),
          prisma.task.count(),
          prisma.estimate.count(),
        ]);
        return [leads, events, tasks, estimates];
      });

    return {
      currentStep,
      isCompleted,
      hasLead: leadCount > 0,
      hasEvent: eventCount > 0,
      hasTask: taskCount > 0,
      hasEstimate: estimateCount > 0,
    };
  } catch (error) {
    console.error("Failed to get wizard status:", error);
    // Return safe defaults on error
    return {
      currentStep: null,
      isCompleted: false,
      hasLead: false,
      hasEvent: false,
      hasTask: false,
      hasEstimate: false,
    };
  }
}

/**
 * Update the current wizard step
 * Note: Does NOT revalidate layout - wizard state is managed client-side
 * Only completeWizard() and resetWizard() revalidate to update Tawk.to chat visibility
 */
export async function updateWizardStep(stepId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { clerkOrgId } = await getTenantContext();

    await database.organization.update({
      where: { clerkId: clerkOrgId },
      data: { onboardingWizardStep: stepId },
    });

    // DON'T revalidate on every step change - causes continuous page reloads
    // Wizard state is managed client-side by OnboardJS
    // Only revalidate when wizard completes/dismisses (see below)
    
    return { success: true };
  } catch (error) {
    console.error("Failed to update wizard step:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update wizard step" 
    };
  }
}

/**
 * Mark wizard as completed
 */
export async function completeWizard(): Promise<{ success: boolean; error?: string }> {
  try {
    const { clerkOrgId } = await getTenantContext();

    await database.organization.update({
      where: { clerkId: clerkOrgId },
      data: { onboardingWizardStep: "COMPLETED" },
    });

    revalidatePath("/", "layout");
    
    return { success: true };
  } catch (error) {
    console.error("Failed to complete wizard:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to complete wizard" 
    };
  }
}

/**
 * Reset wizard (for testing or "Restart Tour" feature)
 * Sets to DISMISSED so wizard doesn't auto-start again
 */
export async function resetWizard(): Promise<{ success: boolean; error?: string }> {
  try {
    const { clerkOrgId } = await getTenantContext();

    await database.organization.update({
      where: { clerkId: clerkOrgId },
      data: { onboardingWizardStep: "DISMISSED" },
    });

    revalidatePath("/", "layout");
    
    return { success: true };
  } catch (error) {
    console.error("Failed to reset wizard:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to reset wizard" 
    };
  }
}
