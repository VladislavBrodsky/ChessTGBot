'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

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
