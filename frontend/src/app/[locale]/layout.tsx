import type { Metadata } from "next";
import "../globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { NavbarProvider } from "@/context/NavbarContext";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import TelegramInit from "@/components/TelegramInit";
import Providers from "@/components/Providers";
import { UserProvider } from "@/context/UserContext";
import AuthGuard from "@/components/AuthGuard";

import { Outfit, Plus_Jakarta_Sans, Roboto_Mono } from 'next/font/google';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta' });
const robotoMono = Roboto_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
    title: "Chess Game",
    description: "Real-time Multiplayer Chess on Telegram",
};

export const viewport = {
    width: "device-width",
    initialScale: 1.0,
    maximumScale: 1.0,
    userScalable: false,
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
        <html lang={locale} dir={dir} suppressHydrationWarning>
            <head>
                {/* Preconnect to the backend to eliminate TCP handshake latency on the first
                    avatar load. Production (www.web3chess.online) calls api.web3chess.online. */}
                <link rel="preconnect" href="https://api.web3chess.online" crossOrigin="anonymous" />
                <link rel="dns-prefetch" href="https://api.web3chess.online" />
                <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    var savedTheme = localStorage.getItem('theme');
                                    if (savedTheme === 'light' || savedTheme === 'dark') {
                                        document.documentElement.setAttribute('data-theme', savedTheme);
                                    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
                                        document.documentElement.setAttribute('data-theme', 'light');
                                    } else {
                                        document.documentElement.setAttribute('data-theme', 'dark');
                                    }
                                    var reduceMotion = localStorage.getItem('setting_reduce_motion') === 'true';
                                    document.documentElement.setAttribute('data-reduce-motion', String(reduceMotion));
                                } catch (e) {}
                            })();
                        `
                    }}
                />
            </head>
            <body
                className={`${outfit.variable} ${plusJakarta.variable} ${robotoMono.variable} antialiased`}
                suppressHydrationWarning
            >
                <NextIntlClientProvider messages={messages}>
                    <ThemeProvider>
                        <NavbarProvider>
                            <UserProvider>
                                <Providers>
                                    <TelegramInit />
                                    <AuthGuard>
                                        {children}
                                    </AuthGuard>
                                </Providers>
                            </UserProvider>
                        </NavbarProvider>
                    </ThemeProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
