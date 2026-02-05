/**
 * Perplexity API Service
 * Extracts branding, colors, and theme settings from websites using AI
 */

export interface ExtractedTheme {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    surfaceColor?: string;
    textColor?: string;
    textSecondaryColor?: string;
    fontFamily?: string;
    botName?: string;
    inputBackground?: string;
    introMessage?: string;
    systemPrompt?: string;
}

export interface ExtractionResult {
    success: boolean;
    data?: ExtractedTheme;
    error?: string;
}

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

/**
 * Generates a favicon URL using Google's favicon service
 * This is more reliable than asking AI to extract logo URLs
 */
const getFaviconUrl = (websiteUrl: string): string => {
    try {
        const url = new URL(websiteUrl);
        // Google's favicon service - reliable and works for most sites
        return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=128`;
    } catch {
        return '';
    }
};

// =============================================================================
// Color Contrast Utilities (WCAG 2.1 compliant)
// =============================================================================

/**
 * Converts a hex color to RGB components
 */
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        }
        : null;
};

/**
 * Converts RGB to hex color
 */
const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => {
        const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
};

/**
 * Calculates relative luminance per WCAG 2.1
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
const getRelativeLuminance = (hex: string): number => {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;

    const [rs, gs, bs] = [rgb.r, rgb.g, rgb.b].map(c => {
        const sRGB = c / 255;
        return sRGB <= 0.03928
            ? sRGB / 12.92
            : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Calculates contrast ratio between two colors
 * WCAG recommends: 4.5:1 for normal text, 3:1 for large text
 */
const getContrastRatio = (color1: string, color2: string): number => {
    const l1 = getRelativeLuminance(color1);
    const l2 = getRelativeLuminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Determines if a color is "dark" (luminance < 0.5)
 */
const isDarkColor = (hex: string): boolean => {
    return getRelativeLuminance(hex) < 0.179; // Threshold for dark colors
};

/**
 * Lightens a color by a percentage
 */
const lightenColor = (hex: string, percent: number): string => {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    const factor = percent / 100;
    return rgbToHex(
        rgb.r + (255 - rgb.r) * factor,
        rgb.g + (255 - rgb.g) * factor,
        rgb.b + (255 - rgb.b) * factor
    );
};

/**
 * Darkens a color by a percentage
 */
const darkenColor = (hex: string, percent: number): string => {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    const factor = 1 - (percent / 100);
    return rgbToHex(
        rgb.r * factor,
        rgb.g * factor,
        rgb.b * factor
    );
};

/**
 * Ensures a text color has sufficient contrast against a background
 * Returns adjusted color if needed, original if already good
 */
const ensureTextContrast = (
    textColor: string,
    backgroundColor: string,
    minContrast: number = 4.5
): string => {
    let contrast = getContrastRatio(textColor, backgroundColor);

    if (contrast >= minContrast) {
        return textColor; // Already sufficient
    }

    const bgIsDark = isDarkColor(backgroundColor);
    let adjusted = textColor;
    let iterations = 0;
    const maxIterations = 20;

    // Iteratively adjust until we reach target contrast
    while (contrast < minContrast && iterations < maxIterations) {
        if (bgIsDark) {
            // Light background needs dark text, or dark bg needs light text
            adjusted = lightenColor(adjusted, 10);
        } else {
            adjusted = darkenColor(adjusted, 10);
        }
        contrast = getContrastRatio(adjusted, backgroundColor);
        iterations++;
    }

    // If still not enough contrast, use pure white or black
    if (contrast < minContrast) {
        return bgIsDark ? '#ffffff' : '#000000';
    }

    return adjusted;
};

/**
 * Validates and adjusts extracted theme colors for readability
 * Also derives missing colors to ensure a complete, usable theme
 */
const ensureReadableTheme = (theme: ExtractedTheme): ExtractedTheme => {
    const adjusted = { ...theme };

    // If we don't have a background color, can't validate
    if (!adjusted.backgroundColor) {
        return adjusted;
    }

    const bgColor = adjusted.backgroundColor;
    const bgIsDark = isDarkColor(bgColor);

    // === DERIVE MISSING COLORS ===

    // If no text color, derive from background
    if (!adjusted.textColor) {
        adjusted.textColor = bgIsDark ? '#ffffff' : '#1a1a2e';
    }

    // If no secondary text color, derive from text color
    if (!adjusted.textSecondaryColor && adjusted.textColor) {
        adjusted.textSecondaryColor = bgIsDark
            ? darkenColor(adjusted.textColor, 35)
            : lightenColor(adjusted.textColor, 35);
    }

    // If no surface color, derive from background
    if (!adjusted.surfaceColor) {
        adjusted.surfaceColor = bgIsDark
            ? lightenColor(bgColor, 8)
            : darkenColor(bgColor, 5);
    }

    // If no input background, derive from surface
    if (!adjusted.inputBackground) {
        adjusted.inputBackground = bgIsDark
            ? darkenColor(adjusted.surfaceColor, 15)
            : lightenColor(adjusted.surfaceColor, 5);
    }

    // If no secondary color, derive from primary
    if (!adjusted.secondaryColor && adjusted.primaryColor) {
        adjusted.secondaryColor = bgIsDark
            ? lightenColor(adjusted.primaryColor, 15)
            : darkenColor(adjusted.primaryColor, 15);
    }

    // === ENSURE CONTRAST ===

    // Ensure text color has good contrast against background (4.5:1 for normal text)
    adjusted.textColor = ensureTextContrast(adjusted.textColor, bgColor, 4.5);

    // Ensure text also works on surface color
    if (adjusted.surfaceColor) {
        const surfaceContrast = getContrastRatio(adjusted.textColor, adjusted.surfaceColor);
        if (surfaceContrast < 4.5) {
            adjusted.textColor = ensureTextContrast(adjusted.textColor, adjusted.surfaceColor, 4.5);
        }
    }

    // Ensure text works on input background
    if (adjusted.inputBackground) {
        const inputContrast = getContrastRatio(adjusted.textColor, adjusted.inputBackground);
        if (inputContrast < 4.5) {
            adjusted.textColor = ensureTextContrast(adjusted.textColor, adjusted.inputBackground, 4.5);
        }
    }

    // Ensure secondary text has at least 3:1 contrast (WCAG AA for large text)
    if (adjusted.textSecondaryColor) {
        adjusted.textSecondaryColor = ensureTextContrast(
            adjusted.textSecondaryColor,
            bgColor,
            3.0
        );
        // Also check against surface
        if (adjusted.surfaceColor) {
            const surfaceSecondaryContrast = getContrastRatio(adjusted.textSecondaryColor, adjusted.surfaceColor);
            if (surfaceSecondaryContrast < 3.0) {
                adjusted.textSecondaryColor = ensureTextContrast(
                    adjusted.textSecondaryColor,
                    adjusted.surfaceColor,
                    3.0
                );
            }
        }
    }

    // Ensure primary color is visible on background (for buttons, links)
    if (adjusted.primaryColor) {
        const primaryContrast = getContrastRatio(adjusted.primaryColor, bgColor);
        if (primaryContrast < 3.0) {
            // Adjust primary color for visibility
            if (bgIsDark) {
                adjusted.primaryColor = lightenColor(adjusted.primaryColor, 25);
            } else {
                adjusted.primaryColor = darkenColor(adjusted.primaryColor, 25);
            }
        }
        // Update secondary after primary adjustment
        if (adjusted.secondaryColor) {
            adjusted.secondaryColor = bgIsDark
                ? lightenColor(adjusted.primaryColor, 15)
                : darkenColor(adjusted.primaryColor, 15);
        }
    }

    console.log('Theme readability adjustments applied:', {
        original: theme,
        adjusted,
        bgIsDark,
        contrastRatios: {
            textVsBg: getContrastRatio(adjusted.textColor!, bgColor),
            textVsSurface: adjusted.surfaceColor ? getContrastRatio(adjusted.textColor!, adjusted.surfaceColor) : 'N/A',
            primaryVsBg: adjusted.primaryColor ? getContrastRatio(adjusted.primaryColor, bgColor) : 'N/A'
        }
    });

    return adjusted;
};

/**
 * Builds the extraction prompt for Perplexity
 * Note: We don't ask for logo URL as AI cannot reliably extract actual image URLs
 */
const buildExtractionPrompt = (websiteUrl: string): string => {
    return `Analyze the website at ${websiteUrl} and extract its color scheme, branding, and create appropriate AI assistant messaging. Return ONLY a valid JSON object (no markdown, no explanation) with the following structure:

{
    "primaryColor": "main brand color in hex format (e.g., #6366f1)",
    "secondaryColor": "secondary/accent brand color in hex format",
    "backgroundColor": "main page background color in hex format",
    "surfaceColor": "card/container background color in hex format",
    "textColor": "main text color in hex format",
    "textSecondaryColor": "secondary/muted text color in hex format",
    "fontFamily": "primary font family name (just the font name, e.g., 'Inter' or 'Roboto')",
    "botName": "a friendly assistant name based on the brand (e.g., if site is 'Acme Corp', suggest 'Acme Assistant')",
    "introMessage": "a welcoming introduction message that the AI assistant would say to greet users, incorporating the brand personality (1-2 sentences)",
    "systemPrompt": "a professional system prompt for the AI assistant that defines its role, personality, and behavior based on the brand's tone and purpose (3-5 sentences)"
}

For introMessage, make it friendly and aligned with the brand's voice.
For systemPrompt, include: the assistant's role, the brand context, communication style, and key behaviors.

If you cannot determine a value, use null for that field. Focus on extracting the dominant brand colors visible on the website.`;
};

/**
 * Extracts theme and branding from a website URL using Perplexity API
 */
export const extractWebsiteTheme = async (
    websiteUrl: string,
    apiKey: string,
    model: string = 'sonar'
): Promise<ExtractionResult> => {
    // Validate URL
    try {
        new URL(websiteUrl);
    } catch {
        return {
            success: false,
            error: 'Invalid URL format. Please enter a valid website URL.'
        };
    }

    try {
        const response = await fetch(PERPLEXITY_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a web design analyst. You analyze websites and extract their branding, color schemes, and visual identity. Always respond with valid JSON only, no additional text or markdown formatting.'
                    },
                    {
                        role: 'user',
                        content: buildExtractionPrompt(websiteUrl)
                    }
                ],
                temperature: 0.1,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error?.message || `API request failed with status ${response.status}`;
            return {
                success: false,
                error: errorMessage
            };
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            return {
                success: false,
                error: 'No content received from Perplexity API'
            };
        }

        // Parse the JSON response
        try {
            // Clean up the response - remove any markdown code blocks if present
            let cleanContent = content.trim();
            if (cleanContent.startsWith('```json')) {
                cleanContent = cleanContent.slice(7);
            } else if (cleanContent.startsWith('```')) {
                cleanContent = cleanContent.slice(3);
            }
            if (cleanContent.endsWith('```')) {
                cleanContent = cleanContent.slice(0, -3);
            }
            cleanContent = cleanContent.trim();

            const extractedData = JSON.parse(cleanContent) as ExtractedTheme;

            // Validate that we got at least some usable data (colors are the primary extraction target)
            const hasUsableData = extractedData.primaryColor ||
                extractedData.backgroundColor ||
                extractedData.secondaryColor;

            if (!hasUsableData) {
                return {
                    success: false,
                    error: 'Could not extract meaningful theme data from the website'
                };
            }

            // Add favicon URL as a reliable logo fallback
            // Google's favicon service works for virtually any website
            extractedData.logoUrl = getFaviconUrl(websiteUrl);

            // Validate and adjust colors for readability (WCAG compliance)
            const readableTheme = ensureReadableTheme(extractedData);

            return {
                success: true,
                data: readableTheme
            };
        } catch (parseError) {
            console.error('Failed to parse Perplexity response:', content);
            return {
                success: false,
                error: 'Failed to parse theme data from API response'
            };
        }
    } catch (error) {
        console.error('Perplexity API error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
};
