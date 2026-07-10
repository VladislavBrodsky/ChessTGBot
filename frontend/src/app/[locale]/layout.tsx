import type { Metadata } from "next";
import "../globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { NavbarProvider } from "@/context/NavbarContext";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import TelegramInit from "@/components/TelegramInit";
import Providers from "@/components/Providers";
import { UserProvider } from "@/context/UserContext";
import AuthGuard from "@/components/AuthGuard";

import { Inter, Roboto_Mono } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-geist-sans' });
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
                {/* Preconnect to backend to eliminate TCP handshake latency on first avatar load */}
                <link rel="preconnect" href="https://chesstgbot-backend-production.up.railway.app" crossOrigin="anonymous" />
                <link rel="dns-prefetch" href="https://chesstgbot-backend-production.up.railway.app" />
                <script src="https://telegram.org/js/telegram-web-app.js" />
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
                                } catch (e) {}
                            })();
                        `
                    }}
                />
            </head>
            <body
                className={`${inter.variable} ${robotoMono.variable} antialiased`}
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
