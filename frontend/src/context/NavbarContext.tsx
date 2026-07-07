'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface NavbarContextType {
    /** Increment to hide the navbar (multiple callers nest safely). */
    pushHide: () => void;
    /** Decrement to restore the navbar. */
    popHide: () => void;
    /** True when at least one caller has pushed a hide. */
    isHidden: boolean;
}

const NavbarContext = createContext<NavbarContextType>({
    pushHide: () => {},
    popHide: () => {},
    isHidden: false,
});

export function NavbarProvider({ children }: { children: ReactNode }) {
    const [depth, setDepth] = useState(0);

    const pushHide = useCallback(() => setDepth(d => d + 1), []);
    const popHide  = useCallback(() => setDepth(d => Math.max(0, d - 1)), []);

    return (
        <NavbarContext.Provider value={{ pushHide, popHide, isHidden: depth > 0 }}>
            {children}
        </NavbarContext.Provider>
    );
}

export function useNavbar() {
    return useContext(NavbarContext);
}

/**
 * Hook for components that need to hide the navbar while mounted.
 * Call `hideNavbar()` to hide and `showNavbar()` to restore.
 */
export function useNavbarHide() {
    const { pushHide, popHide } = useNavbar();
    return { hideNavbar: pushHide, showNavbar: popHide };
}

/**
 * Hides the navbar for as long as the calling component is mounted, and
 * restores it on unmount. Intended for bottom-sheet drawers / full-screen
 * modals (anything rendering a `.bottom-drawer-backdrop` / `.modal-backdrop`)
 * whose primary action button can sit near the bottom of the screen, where a
 * visible navbar would otherwise overlap it.
 *
 * This replaces a CSS `:has(.bottom-drawer-backdrop) nav { ... }` rule that
 * used to auto-hide the navbar for any such overlay. That rule was removed
 * because it fired off the mere DOM PRESENCE of a backdrop element and used
 * `!important`, so an orphaned/stuck backdrop (e.g. a leftover animation
 * exit clone) could permanently hide the navbar and lock scrolling with no
 * way to recover. This hook is driven by React's component lifecycle
 * instead — push on mount, pop on unmount — so it cannot be orphaned: React
 * guarantees the cleanup runs whenever the component unmounts, however that
 * happens.
 */
export function useNavbarHideWhileMounted() {
    const { pushHide, popHide } = useNavbar();
    useEffect(() => {
        pushHide();
        return () => popHide();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
