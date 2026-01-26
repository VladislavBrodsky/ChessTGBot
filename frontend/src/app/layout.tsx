import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";

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

import TelegramInit from "@/components/TelegramInit";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <script src="https://telegram.org/js/telegram-web-app.js" async />
            </head>
            <body
                className={`${inter.variable} ${robotoMono.variable} antialiased`}
            >
                <ThemeProvider>
                    <TelegramInit />
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}
