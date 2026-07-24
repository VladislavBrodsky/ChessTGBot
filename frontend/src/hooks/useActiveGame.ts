import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { apiFetch } from '@/lib/api';

let globalActiveGameChecked = false;
let globalActiveGameId: string | null = null;

export function useActiveGame() {
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();

    let urlGameId: string | null = null;
    if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        urlGameId = params.get('id');
    }

    const [activeGameId, setActiveGameId] = useState<string | null>(globalActiveGameId);
    const [isCheckingActiveGame, setIsCheckingActiveGame] = useState<boolean>(!globalActiveGameChecked);

    const checkActiveGame = useCallback(async () => {
        if (globalActiveGameChecked) {
            setActiveGameId(globalActiveGameId);
            setIsCheckingActiveGame(false);
            return;
        }

        try {
            const res = await apiFetch('/api/v1/game/active');
            if (res.ok) {
                const data = await res.json();
                const activeId = data.active_game_id || null;
                setActiveGameId(activeId);
                globalActiveGameId = activeId;
                globalActiveGameChecked = true;
                
                if (activeId) {
                    const isGamePage = pathname === `/${locale}/game` || pathname === '/game';
                    if (!isGamePage || urlGameId !== activeId) {
                        router.replace(`/${locale}/game?id=${activeId}`);
                    }
                }
            }
        } catch (err) {
            console.error("Failed to check active game", err);
        } finally {
            setIsCheckingActiveGame(false);
        }
    }, [pathname, locale, urlGameId, router]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            checkActiveGame();
        }
    }, [checkActiveGame]);

    return { activeGameId, isCheckingActiveGame, urlGameId };
}
