import { auth } from "@repo/auth/server";
import { database, multiTenantDb } from "@repo/database";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * API route for wizard status polling
 * Uses API route instead of server action to avoid triggering Fast Refresh in dev mode
 */
export async function GET() {
  try {
    const { orgId } = await auth();
    
    if (!orgId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get internal org ID
    const org = await database.organization.findUnique({
      where: { clerkId: orgId },
      select: { 
        id: true,
        onboardingWizardStep: true 
      },
    });

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Check if wizard is already completed
    if (org.onboardingWizardStep === "COMPLETED" || org.onboardingWizardStep === "DISMISSED") {
      return NextResponse.json({
        currentStep: org.onboardingWizardStep,
        isCompleted: true,
        hasLead: false,
        hasEvent: false,
        hasTask: false,
        hasEstimate: false,
      }, {
        headers: {
          "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
        },
      });
    }

    // Check for created data using tenant-scoped queries
    const results = await multiTenantDb.forTenant(org.id).run(async (prisma) => {
      const [leads, events, tasks, estimates] = await Promise.all([
        prisma.lead.findFirst({ select: { id: true } }),
        prisma.event.findFirst({ select: { id: true } }),
        prisma.task.findFirst({ select: { id: true } }),
        prisma.estimate.findFirst({ select: { id: true } }),
      ]);

      return {
        hasLead: !!leads,
        hasEvent: !!events,
        hasTask: !!tasks,
        hasEstimate: !!estimates,
      };
    });

    return NextResponse.json({
      currentStep: org.onboardingWizardStep || "welcome",
      isCompleted: false,
      ...results,
    }, {
      headers: {
        "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Failed to get wizard status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
