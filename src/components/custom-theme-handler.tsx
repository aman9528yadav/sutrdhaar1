
"use client";

import { useEffect } from 'react';
import { useProfile } from '@/context/ProfileContext';
import { useTheme } from 'next-themes';

export function CustomThemeHandler() {
    const { profile } = useProfile();
    const { theme } = useTheme();
    
    useEffect(() => {
        if (theme === 'custom' && profile.settings.customTheme) {
            const { background, foreground, primary, accent } = profile.settings.customTheme;
            const root = document.documentElement;

            root.style.setProperty('--background', `${background.h} ${background.s}% ${background.l}%`);
            root.style.setProperty('--foreground', `${foreground.h} ${foreground.s}% ${foreground.l}%`);
            root.style.setProperty('--primary', `${primary.h} ${primary.s}% ${primary.l}%`);
            root.style.setProperty('--accent', `${accent.h} ${accent.s}% ${accent.l}%`);
            // You can add more variables here for card, popover, etc. if needed
            // For simplicity, we'll let them derive from background/foreground
            root.style.setProperty('--card', `${background.h} ${background.s}% ${background.l}%`);
            root.style.setProperty('--card-foreground', `${foreground.h} ${foreground.s}% ${foreground.l}%`);
            root.style.setProperty('--popover', `${background.h} ${background.s}% ${background.l}%`);
            root.style.setProperty('--popover-foreground', `${foreground.h} ${foreground.s}% ${foreground.l}%`);
             root.style.setProperty('--primary-foreground', `0 0% 98%`);
             root.style.setProperty('--secondary', `240 4.8% 95.9%`);
             root.style.setProperty('--secondary-foreground', `240 5.9% 10%`);
             root.style.setProperty('--muted', `240 4.8% 95.9%`);
             root.style.setProperty('--muted-foreground', `240 3.8% 46.1%`);
             root.style.setProperty('--accent-foreground', `240 5.9% 10%`);
             root.style.setProperty('--border', `240 5.9% 90%`);
             root.style.setProperty('--input', `240 5.9% 90%`);
             root.style.setProperty('--ring', `240 10% 3.9%`);

        } else {
             // Clear custom properties when not in custom theme
            const root = document.documentElement;
            root.style.removeProperty('--background');
            root.style.removeProperty('--foreground');
            root.style.removeProperty('--primary');
            root.style.removeProperty('--accent');
            root.style.removeProperty('--card');
            root.style.removeProperty('--card-foreground');
            root.style.removeProperty('--popover');
            root.style.removeProperty('--popover-foreground');
            root.style.removeProperty('--primary-foreground');
            root.style.removeProperty('--secondary');
            root.style.removeProperty('--secondary-foreground');
            root.style.removeProperty('--muted');
            root.style.removeProperty('--muted-foreground');
            root.style.removeProperty('--accent-foreground');
            root.style.removeProperty('--border');
            root.style.removeProperty('--input');
            root.style.removeProperty('--ring');
        }

    }, [theme, profile.settings.customTheme]);

    return null;
}
