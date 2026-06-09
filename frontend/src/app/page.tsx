"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== "undefined") {
            const searchParams = new URLSearchParams(window.location.search);
            let lang = searchParams.get("lang");
            
            // Fallback to localStorage
            if (!lang) {
                lang = localStorage.getItem("preferred_language");
            }
            
            // Fallback to Telegram WebApp user language
            if (!lang && (window as any).Telegram?.WebApp) {
                lang = (window as any).Telegram.WebApp.initDataUnsafe?.user?.language_code;
            }
            
            // Validate and fallback to English
            const supportedLocales = ['en', 'es', 'fr', 'de', 'ru', 'pt', 'zh', 'hi', 'ar', 'ja'];
            if (!lang || !supportedLocales.includes(lang)) {
                lang = 'en';
            }
            
            // Save to localStorage for persistence
            localStorage.setItem("preferred_language", lang);

            // Clean up 'lang' from query string but preserve other parameters
            searchParams.delete("lang");
            const queryString = searchParams.toString();
            const suffix = queryString ? `?${queryString}` : "";

            router.replace(`/${lang}/home${suffix}`);
        }
    }, [router]);

    return null;
}

