"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'de', 'ru', 'pt', 'zh', 'hi', 'ar', 'ja'];

/** Normalize Telegram language codes like 'zh-hans', 'pt-br' → 'zh', 'pt' */
function normalizeLang(raw: string | null | undefined): string {
    if (!raw) return 'en';
    const base = raw.toLowerCase().split('-')[0];
    return SUPPORTED_LOCALES.includes(base) ? base : 'en';
}

export default function RootPage() {
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== "undefined") {
            const searchParams = new URLSearchParams(window.location.search);

            // 1. URL param sent by the bot (?lang=ru)
            let lang = searchParams.get("lang");

            // 2. Previously saved preference in localStorage
            if (!lang) {
                lang = localStorage.getItem("preferred_language");
            }

            // 3. Telegram WebApp native language_code (may be 'zh-hans', 'pt-br', etc.)
            if (!lang && (window as any).Telegram?.WebApp) {
                lang = (window as any).Telegram.WebApp.initDataUnsafe?.user?.language_code;
            }

            // Normalize and validate — fallback to 'en'
            lang = normalizeLang(lang);

            // Persist for subsequent loads
            localStorage.setItem("preferred_language", lang);

            // Remove 'lang' from query string, preserve everything else (e.g. startapp)
            searchParams.delete("lang");
            const queryString = searchParams.toString();
            const suffix = queryString ? `?${queryString}` : "";

            router.replace(`/${lang}/home${suffix}`);
        }
    }, [router]);

    return null;
}
