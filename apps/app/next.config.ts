import { withToolbar } from "@repo/feature-flags/lib/toolbar";
import { config, withAnalyzer, withSVGR } from "@repo/next-config";
import { withLogging, withSentry } from "@repo/observability/next-config";
import type { NextConfig } from "next";
import { env } from "@/env";

let nextConfig: NextConfig = withSVGR(withToolbar(withLogging(config)));

nextConfig = {
  ...nextConfig,
  outputFileTracingIncludes: {
    "/**/*": ["../../node_modules/.prisma/client/**/*"],
  },
};

if (env.VERCEL) {
  nextConfig = withSentry(nextConfig);
}

if (env.ANALYZE === "true") {
  nextConfig = withAnalyzer(nextConfig);
}

export default nextConfig;
