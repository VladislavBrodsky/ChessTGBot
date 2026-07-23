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
        // Railway's Next.js service can optimize local assets at runtime.
        // Static exports cannot, so retain plain files only for that build.
        unoptimized: isStaticExport,
    },
    // Blocking: `next build` fails on TypeScript errors. Previously true, which
    // shipped type errors as-is (SWC skips them) and let a missing import/prop
    // become a prod runtime ReferenceError (2026-07-11 wallet-page outage). CI
    // ran a separate `tsc --noEmit` to compensate; the build now enforces it
    // directly for both standalone and static-export outputs. See DEP-03.
    typescript: { ignoreBuildErrors: false },
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
