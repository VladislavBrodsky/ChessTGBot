import type { Metadata } from "next";
import DocumentStartup from '@/components/DocumentStartup';
import "@fontsource-variable/outfit";
import "../globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { NavbarProvider } from "@/context/NavbarContext";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import TelegramInit from "@/components/TelegramInit";
import Providers from "@/components/Providers";
import { UserProvider } from "@/context/UserContext";
import { ToastProvider } from "@/context/ToastContext";


export const metadata: Metadata = {
    title: { default: "Web3Chess", template: "%s · Web3Chess" },
    description: "Chess in Telegram: play real-time games, train with puzzles and follow your daily goals.",
};

export const viewport = {
    width: "device-width",
    initialScale: 1.0,
    // Required so iOS exposes non-zero env(safe-area-inset-*). Without this,
    // env() insets are forced to 0 and fixed bottom bars (navbar) land in the
    // iOS home-indicator zone and disappear. Pairs with --app-safe-bottom.
    viewportFit: "cover" as const,
};

export function generateStaticParams() {
    return ['en', 'es', 'fr', 'de', 'ru', 'pt', 'zh', 'hi', 'ar', 'ja'].map((locale) => ({ locale }));
}

export default async function LocaleLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    // Ensure that the incoming `locale` is valid
    if (!['en', 'es', 'fr', 'de', 'ru', 'pt', 'zh', 'hi', 'ar', 'ja'].includes(locale)) {
        notFound();
    }

    setRequestLocale(locale);

    // Providing all messages to the client which is the easiest way to get started
    const messages = await getMessages();

    // Right-to-left scripts (Arabic, and any future he/fa/ur) must flip the
    // document direction, otherwise the translated copy still lays out LTR.
    const RTL_LOCALES = ['ar'];
    const dir = RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr';

    return (
        <html lang={locale} dir={dir} data-theme="dark" suppressHydrationWarning>
            <head>
                {/* Preconnect to the backend to eliminate TCP handshake latency on the first
                    avatar load. Production (www.web3chess.online) calls api.web3chess.online. */}
                <link rel="preconnect" href="https://api.web3chess.online" crossOrigin="anonymous" />
                <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
                <meta httpEquiv="Pragma" content="no-cache" />
                <meta httpEquiv="Expires" content="0" />
                <DocumentStartup />
            </head>
            <body
                className="antialiased"
                suppressHydrationWarning
            >
                <NextIntlClientProvider messages={messages}>
                    <ThemeProvider>
                        <NavbarProvider>
                            <UserProvider>
                                <ToastProvider>
                                    <Providers>
                                        <TelegramInit />
                                        {children}
                                    </Providers>
                                </ToastProvider>
                            </UserProvider>
                        </NavbarProvider>
                    </ThemeProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
