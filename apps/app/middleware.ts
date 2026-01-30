import { authMiddleware } from "@repo/auth/middleware";
import {
  noseconeOptions,
  noseconeOptionsWithToolbar,
  securityMiddleware,
} from "@repo/security/middleware";
import type { NextMiddleware } from "next/server";
import { NextResponse } from "next/server";
import { env } from "./env";

const securityHeaders = env.FLAGS_SECRET
  ? securityMiddleware(noseconeOptionsWithToolbar)
  : securityMiddleware(noseconeOptions);

// Clerk middleware wraps other middleware in its callback
// For apps using Clerk, compose middleware inside authMiddleware callback
// For apps without Clerk, use createNEMO for composition (see apps/web)
export default authMiddleware(async (auth, request) => {
  const pathname = request.nextUrl.pathname;

  // Allow static, ingest, and onboarding routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/ingest") ||
    pathname.startsWith("/onboarding")
  ) {
    return securityHeaders();
  }

  // Skip strict security headers for public registration routes (allows hCaptcha iframe)
  if (pathname.startsWith("/register/")) {
    return NextResponse.next();
  }

  const session = await auth(); // call the function to get auth data

  // If signed in but no active org, force onboarding
  if (session.userId && !session.orgId) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // RBAC: Restrict org:member to only /events routes
  if (session.userId && session.orgId && session.orgRole === "org:member") {
    const isEventsRoute = pathname === "/events" || pathname.startsWith("/events/");
    
    // If org:member tries to access any route other than /events, redirect to /events
    if (!isEventsRoute && pathname !== "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/events";
      url.search = "";
      return NextResponse.redirect(url);
    }
    
    // Redirect dashboard (/) to /events for org:member
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/events";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return securityHeaders();
}) as unknown as NextMiddleware;

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
  runtime: "nodejs",
};
