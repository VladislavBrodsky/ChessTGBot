"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function LocaleIndex() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // pathname includes locale, e.g. /en
        // preserve query string and hash when redirecting to /home
        const search = typeof window !== 'undefined' ? window.location.search : '';
        const hash = typeof window !== 'undefined' ? window.location.hash : '';
        router.replace(`${pathname}/home${search}${hash}`);
    }, [router, pathname]);

    return null;
}
