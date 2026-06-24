/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    domains: [],
  },
  transpilePackages: ["@blocknote", "@mantine", "@shikijs"],
};

module.exports = nextConfig;
