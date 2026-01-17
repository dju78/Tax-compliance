/**
 * Mobile Responsiveness Utilities
 * Provides responsive design helpers and media query utilities
 */

// Breakpoints
export const breakpoints = {
    mobile: 640,
    tablet: 768,
    desktop: 1024,
    wide: 1280
} as const;

// Media query hook
export function useMediaQuery(query: string): boolean {
    if (typeof window === 'undefined') return false;

    const [matches, setMatches] = React.useState(() => window.matchMedia(query).matches);

    React.useEffect(() => {
        const mediaQuery = window.matchMedia(query);
        const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [query]);

    return matches;
}

// Responsive hooks
export function useIsMobile() {
    return useMediaQuery(`(max-width: ${breakpoints.mobile}px)`);
}

export function useIsTablet() {
    return useMediaQuery(`(max-width: ${breakpoints.tablet}px)`);
}

export function useIsDesktop() {
    return useMediaQuery(`(min-width: ${breakpoints.desktop}px)`);
}

// Responsive grid helper
export function getResponsiveGrid(mobile: string, tablet: string, desktop: string) {
    return {
        display: 'grid',
        gridTemplateColumns: mobile,
        '@media (min-width: 768px)': {
            gridTemplateColumns: tablet
        },
        '@media (min-width: 1024px)': {
            gridTemplateColumns: desktop
        }
    };
}

// Responsive padding helper
export function getResponsivePadding(mobile: string, desktop: string) {
    if (typeof window !== 'undefined' && window.innerWidth < breakpoints.tablet) {
        return mobile;
    }
    return desktop;
}

// Responsive font size
export function getResponsiveFontSize(mobile: string, desktop: string) {
    if (typeof window !== 'undefined' && window.innerWidth < breakpoints.tablet) {
        return mobile;
    }
    return desktop;
}

// Touch-friendly button size
export const touchTarget = {
    minHeight: '44px',
    minWidth: '44px'
};

import * as React from 'react';
