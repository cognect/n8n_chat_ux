import React, { useEffect } from 'react';
import type { ConfigTheme, ConfigIdentity } from '../types';

interface ThemeInjectorProps {
    theme: ConfigTheme;
    identity?: ConfigIdentity;
    children: React.ReactNode;
}

/**
 * Injects CSS custom properties from theme configuration
 * Also updates browser title and favicon based on identity
 * Enables zero-code theming by reading values from config.json
 */
export const ThemeInjector: React.FC<ThemeInjectorProps> = ({ theme, identity, children }) => {
    useEffect(() => {
        // Apply theme variables to document root for global access
        const root = document.documentElement;

        root.style.setProperty('--color-primary', theme.primaryColor);
        root.style.setProperty('--color-secondary', theme.secondaryColor);
        root.style.setProperty('--color-background', theme.backgroundColor);
        root.style.setProperty('--color-surface', theme.surfaceColor);
        root.style.setProperty('--color-text', theme.textColor);
        root.style.setProperty('--color-text-secondary', theme.textSecondaryColor);
        root.style.setProperty('--color-error', theme.errorColor);
        root.style.setProperty('--color-success', theme.successColor);
        root.style.setProperty('--font-family', theme.fontFamily);
        root.style.setProperty('--bubble-radius', theme.bubbleRadius);
        root.style.setProperty('--input-background', theme.inputBackground);
    }, [theme]);

    // Update browser title based on bot name
    useEffect(() => {
        if (identity?.botName) {
            document.title = `${identity.botName} - AI Assistant`;
        }
    }, [identity?.botName]);

    // Update favicon based on avatar URL
    useEffect(() => {
        if (identity?.avatarUrl) {
            // Find or create favicon link
            let faviconLink = document.querySelector("link[rel='icon']") as HTMLLinkElement;
            if (!faviconLink) {
                faviconLink = document.createElement('link');
                faviconLink.rel = 'icon';
                document.head.appendChild(faviconLink);
            }
            faviconLink.href = identity.avatarUrl;
        }
    }, [identity?.avatarUrl]);

    const dynamicStyles: React.CSSProperties = {
        '--color-primary': theme.primaryColor,
        '--color-secondary': theme.secondaryColor,
        '--color-background': theme.backgroundColor,
        '--color-surface': theme.surfaceColor,
        '--color-text': theme.textColor,
        '--color-text-secondary': theme.textSecondaryColor,
        '--color-error': theme.errorColor,
        '--color-success': theme.successColor,
        '--font-family': theme.fontFamily,
        '--bubble-radius': theme.bubbleRadius,
        '--input-background': theme.inputBackground,
    } as React.CSSProperties;

    return (
        <div className="theme-root" style={dynamicStyles}>
            {children}
        </div>
    );
};
