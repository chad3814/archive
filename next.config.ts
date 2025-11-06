import transpile from 'next-transpile-modules';
import type { NextConfig } from 'next';
const withTM = transpile(['libarchive.js']);

const nextConfig: NextConfig = {
    output: 'standalone',
    productionBrowserSourceMaps: true,
    turbopack: {},
}
module.exports = withTM(nextConfig);
