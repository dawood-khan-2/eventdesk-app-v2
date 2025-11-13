import withBundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";

export const config: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },

  // biome-ignore lint/suspicious/useAwait: rewrites is async
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
      {
        source: "/ingest/decide",
        destination: "https://us.i.posthog.com/decide",
      },
    ];
  },

  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export const withAnalyzer = (sourceConfig: NextConfig): NextConfig =>
  withBundleAnalyzer()(sourceConfig);

export const withSVGR = (sourceConfig: NextConfig): NextConfig => {
  return {
    ...sourceConfig,
    // Turbopack configuration for SVGR
    turbopack: {
      rules: {
        '*.svg': {
          loaders: [
            {
              loader: '@svgr/webpack',
              options: {
                typescript: true,
                dimensions: false,
                svgoConfig: {
                  plugins: [
                    {
                      name: 'preset-default',
                      params: {
                        overrides: {
                          removeViewBox: false,
                        },
                      },
                    },
                    'removeDimensions',
                  ],
                },
              },
            },
          ],
          as: '*.js',
        },
      },
    },
    // Simplified webpack configuration for SVGR (fallback for non-turbopack builds)
    webpack(config, context) {
      // Call existing webpack config first
      if (sourceConfig.webpack) {
        config = sourceConfig.webpack(config, context) || config;
      }

      // Add SVGR support for production builds
      config.module = config.module || {};
      config.module.rules = config.module.rules || [];

      // Add SVGR rule
      config.module.rules.push({
        test: /\.svg$/i,
        use: [
          {
            loader: '@svgr/webpack',
            options: {
              typescript: true,
              dimensions: false,
              svgoConfig: {
                plugins: [
                  {
                    name: 'preset-default',
                    params: {
                      overrides: {
                        removeViewBox: false,
                      },
                    },
                  },
                  'removeDimensions',
                ],
              },
            },
          },
        ],
      });

      return config;
    },
  };
};