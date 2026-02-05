import React from 'react';
import type { ConfigBranding } from '../types';
import './styles/BrandingWatermark.css';

interface BrandingWatermarkProps {
    branding?: ConfigBranding;
}

/**
 * Semi-transparent integrator branding watermark
 * Displays in a configurable corner position
 */
export const BrandingWatermark: React.FC<BrandingWatermarkProps> = ({ branding }) => {
    if (!branding?.enabled || !branding.logoUrl) {
        return null;
    }

    const positionStyles: React.CSSProperties = {
        [branding.position.includes('top') ? 'top' : 'bottom']: '12px',
        [branding.position.includes('left') ? 'left' : 'right']: '12px',
        opacity: branding.opacity,
        width: branding.size,
        height: branding.size,
    };

    const content = (
        <img
            src={branding.logoUrl}
            alt="Powered by"
            className="branding-watermark-image"
        />
    );

    // If link URL provided, wrap in anchor
    if (branding.linkUrl) {
        return (
            <a
                href={branding.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="branding-watermark"
                style={positionStyles}
                title="Powered by"
            >
                {content}
            </a>
        );
    }

    return (
        <div className="branding-watermark" style={positionStyles}>
            {content}
        </div>
    );
};
