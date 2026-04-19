import type { NextConfig } from "next";
import path from "path";
import fs from "fs";

// Walk up from __dirname to find the directory that actually contains node_modules/next.
// This handles git worktrees where node_modules live in the parent project root.
function findNextRoot(dir: string): string {
  if (fs.existsSync(path.join(dir, "node_modules", "next"))) return dir;
  const parent = path.dirname(dir);
  if (parent === dir) return dir; // filesystem root, give up
  return findNextRoot(parent);
}

const nextConfig: NextConfig = {
  turbopack: {
    root: findNextRoot(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
