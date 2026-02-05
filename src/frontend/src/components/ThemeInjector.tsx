import React, { useEffect } from 'react';
import type { ConfigTheme } from '../types';

interface ThemeInjectorProps {
    theme: ConfigTheme;
    children: React.ReactNode;
}

/**
 * Injects CSS custom properties from theme configuration
 * Enables zero-code theming by reading values from config.json
 */
export const ThemeInjector: React.FC<ThemeInjectorProps> = ({ theme, children }) => {
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
