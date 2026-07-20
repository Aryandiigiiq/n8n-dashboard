import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['*.trycloudflare.com', '*.ngrok-free.app', '*.ngrok.io', '*.ngrok-free.dev'],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
