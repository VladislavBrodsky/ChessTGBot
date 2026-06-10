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
        return [
            {
                source: '/api/:path*',
                destination: 'http://127.0.0.1:8000/api/:path*',
            },
            {
                source: '/socket.io/:path*',
                destination: 'http://127.0.0.1:8000/socket.io/:path*',
            },
        ];
    },
};

export default withNextIntl(nextConfig);
