"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function LocaleIndex() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // pathname includes locale, e.g. /en
        // we want to redirect to /en/home
        router.replace(`${pathname}/home`);
    }, [router, pathname]);

    return null;
}
