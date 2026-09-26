import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Enables the optional Dockerfile (copies .next/standalone). Harmless on Vercel.
  output: "standalone",
  serverExternalPackages: [
    "@railgun-community/wallet",
    "@railgun-community/engine",
    "snarkjs",
    "level-js",
  ],
  webpack: (config, { isServer, webpack }) => {
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs: false,
      net: false,
      tls: false,
      dns: false,
      child_process: false,
      path: false,
      os: false,
      crypto: false,
      stream: false,
      http: false,
      https: false,
      zlib: false,
      worker_threads: false,
    };
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@react-native-async-storage/async-storage": false,
    };

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        buffer: require.resolve("buffer/"),
        process: require.resolve("process/browser"),
      };
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
          process: "process/browser",
        }),
      );
    }

    return config;
  },
};

export default nextConfig;
