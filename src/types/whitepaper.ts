/**
 * Whitepaper Portal Types
 */

export interface WhitepaperDoc {
    id: string;          // Route Slug (e.g., 'intro', 'architecture/local-first')
    title: string;       // Display Title (i18n key or string)
    path: string;        // Relative path in whitepaper/{lang}/
    hidden?: boolean;    // Visibility control
    children?: WhitepaperDoc[];
}

export interface WhitepaperConfig {
    docs: WhitepaperDoc[];
}
