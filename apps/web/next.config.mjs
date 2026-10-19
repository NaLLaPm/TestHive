/** @type {import('next').NextConfig} */
const API_ORIGIN = process.env.PF_API_ORIGIN;

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@testhive/contracts", "@testhive/api-client"],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  async rewrites() {
    if (API_ORIGIN) {
      return [{ source: "/api/:path*", destination: `${API_ORIGIN}/api/:path*` }];
    }
    // In local development, proxy to the local Fastify backend.
    // On Vercel, omit the loopback rewrite to prevent DNS_HOSTNAME_RESOLVED_PRIVATE errors.
    if (!process.env.VERCEL) {
      return [{ source: "/api/:path*", destination: "http://127.0.0.1:8787/api/:path*" }];
    }
    return [];
  },
  webpack: (config) => {
    // Workspace packages use NodeNext-style explicit ".js" import specifiers that
    // point at ".ts" source files; teach webpack to resolve that like tsc/tsx do.
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
};

export default nextConfig;
