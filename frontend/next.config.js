import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin(
    './src/i18n/request.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['react-chessboard'],
    ...(process.env.STATIC_EXPORT === 'true' ? { output: 'export' } : {}),
    images: {
        unoptimized: true,
    },
};

export default withNextIntl(nextConfig);
