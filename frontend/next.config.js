import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin(
    './src/i18n/request.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    transpilePackages: ['react-chessboard'],
    ...(process.env.STATIC_EXPORT === 'true' ? { output: 'export' } : {}),
    images: {
        unoptimized: true,
    },
    async rewrites() {
        const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        return [
            {
                source: '/api/:path*',
                destination: `${backendUrl}/api/:path*`,
            },
            {
                source: '/socket.io/:path*',
                destination: `${backendUrl}/socket.io/:path*`,
            },
        ];
    },
};

export default withNextIntl(nextConfig);
