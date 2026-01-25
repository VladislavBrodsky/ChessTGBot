/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['react-chessboard'],
    output: 'export',
    images: {
        unoptimized: true,
    },
};

export default nextConfig;
