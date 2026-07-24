import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

export function useTelegramBackButton(activeGameId: string | null, urlGameId: string | null) {
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (typeof window === 'undefined' || !window.Telegram?.WebApp) return;
        const tg = window.Telegram.WebApp;
        if (!tg.BackButton) return;

        const cleanPath = (pathname || '').split('?')[0].replace(/\/$/, '');
        const hasActiveGame = !!activeGameId || !!urlGameId;
        const isMainTab = 
            cleanPath.endsWith('/home') || 
            cleanPath.endsWith('/settings') || 
            cleanPath.endsWith('/profile') || 
            cleanPath.endsWith('/wallet') || 
            cleanPath.endsWith('/challenges') || 
            cleanPath.endsWith('/marketplace') ||
            (cleanPath.endsWith('/academy') && !cleanPath.includes('/lesson/') && !cleanPath.includes('/puzzle'));
        
        const shouldShow = !isMainTab && !hasActiveGame;

        const handleBackClick = () => {
            if (pathname.includes('/admin')) {
                window.location.href = `/${locale}/settings`;
            } else if (pathname.includes('/game')) {
                router.push(`/${locale}/home`);
            } else {
                router.back();
            }
        };

        if (shouldShow) {
            tg.BackButton.show();
            document.documentElement.classList.add('tg-back-button-active');
            tg.onEvent?.('backButtonClicked', handleBackClick);
        } else {
            tg.BackButton.hide();
            document.documentElement.classList.remove('tg-back-button-active');
        }

        return () => {
            try {
                tg.offEvent?.('backButtonClicked', handleBackClick);
                document.documentElement.classList.remove('tg-back-button-active');
            } catch (err) {
                console.warn("Failed to cleanup back button", err);
            }
        };
    }, [pathname, locale, router, activeGameId, urlGameId]);
}
