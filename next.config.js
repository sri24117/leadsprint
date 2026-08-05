/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // needed for the slim Docker runtime image
  eslint: { ignoreDuringBuilds: true }
};

module.exports = nextConfig;
