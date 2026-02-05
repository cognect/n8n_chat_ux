import React from 'react';
import type { ConfigBranding, BrandedCompany } from '../types';
import './styles/BrandingWatermark.css';

interface BrandingWatermarkProps {
    branding?: ConfigBranding;
}

/**
 * Renders a single company logo with optional link
 */
const CompanyLogo: React.FC<{
    company: BrandedCompany;
    size: number;
}> = ({ company, size }) => {
    const imgElement = (
        <img
            src={company.logoUrl}
            alt={company.name || 'Partner'}
            className="branding-watermark-image"
            style={{ width: size, height: size }}
            title={company.name}
        />
    );

    if (company.linkUrl) {
        return (
            <a
                href={company.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="branding-logo-link"
                title={company.name}
            >
                {imgElement}
            </a>
        );
    }

    return <div className="branding-logo-wrapper">{imgElement}</div>;
};

/**
 * Semi-transparent integrator branding watermark
 * Displays multiple company logos grouped together in a configurable corner position
 */
export const BrandingWatermark: React.FC<BrandingWatermarkProps> = ({ branding }) => {
    // Filter out companies with no logo URL
    const validCompanies = branding?.companies?.filter(c => c.logoUrl) || [];

    if (!branding?.enabled || validCompanies.length === 0) {
        return null;
    }

    const positionStyles: React.CSSProperties = {
        [branding.position.includes('top') ? 'top' : 'bottom']: '12px',
        [branding.position.includes('left') ? 'left' : 'right']: '12px',
        opacity: branding.opacity,
    };

    return (
        <div className="branding-watermark" style={positionStyles}>
            <div className="branding-logos-container">
                {validCompanies.map((company) => (
                    <CompanyLogo
                        key={company.id}
                        company={company}
                        size={branding.size}
                    />
                ))}
            </div>
        </div>
    );
};
