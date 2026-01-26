import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin(
    './src/i18n/request.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['react-chessboard'],
    output: 'export', // Enabled for Docker deployment
    images: {
        unoptimized: true,
    },
};

export default withNextIntl(nextConfig);
