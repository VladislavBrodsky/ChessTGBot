import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import TelegramInit from "@/components/TelegramInit";

const inter = Inter({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Chess Game",
    description: "Real-time Multiplayer Chess on Telegram",
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

    return (
        <html lang={locale}>
            <head>
                <script src="https://telegram.org/js/telegram-web-app.js" async />
            </head>
            <body
                className={`${inter.variable} ${robotoMono.variable} antialiased`}
            >
                <NextIntlClientProvider messages={messages}>
                    <ThemeProvider>
                        <TelegramInit />
                        {children}
                    </ThemeProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
