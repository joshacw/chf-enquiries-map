import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ignore TypeScript errors in supabase functions (Deno runtime)
    ignoreBuildErrors: false,
  },
  // Exclude supabase functions from the build
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/supabase/functions/**'],
    };
    return config;
  },
};

export default nextConfig;
