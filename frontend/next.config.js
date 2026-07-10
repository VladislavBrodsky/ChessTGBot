import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin(
    './src/i18n/request.ts'
);

/** @type {import('next').NextConfig} */
const isStaticExport = process.env.STATIC_EXPORT === 'true';

const nextConfig = {
    // Strict Mode double-invokes effects in DEV only (no production impact), which
    // surfaces effect bugs early — e.g. the provider-absent-on-first-render class
    // that caused the "Play Game" TonConnect crash. Dev-only aid; ship output is
    // unchanged.
    reactStrictMode: true,
    transpilePackages: ['react-chessboard'],
    ...(isStaticExport ? { output: 'export' } : { output: 'standalone' }),
    images: {
        unoptimized: true,
    },
    typescript: { ignoreBuildErrors: true },
    experimental: {},
    // Rewrites are only supported when running a Node.js server (i.e. not in
    // static export mode). In static export mode the frontend resolves the
    // backend URL dynamically at runtime via getApiBaseUrl() / getSocketUrl().
    ...(!isStaticExport ? {
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
    } : {}),
};

export default withNextIntl(nextConfig);
