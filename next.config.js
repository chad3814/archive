const withTM = require('next-transpile-modules')(['libarchive.js']);
/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    productionBrowserSourceMaps: true,
}
module.exports = withTM(nextConfig);
