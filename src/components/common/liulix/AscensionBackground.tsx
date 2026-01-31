import React from 'react';
import './AscensionBackground.css';

/**
 * AscensionBackground
 * 
 * The standard "Digital Ascension" background component.
 * Renders the Deep Blue-Black base, the Central Light Beam, and the Data Rain texture.
 * 
 * Usage: Place this component at the top level of a page or layout. 
 * It uses fixed positioning with z-index: -1 to stay behind content.
 */
export interface AscensionBackgroundProps {
    children?: React.ReactNode;
    className?: string;
}

export const AscensionBackground = ({ children, className = '' }: AscensionBackgroundProps) => {
    return (
        <div className={`ascension-bg-container ${className}`}>
            <div className="ascension-core-beam" /> {/* [NEW] The Holy Light Pillar */}
            <div className="ascension-bg-rain" />
            {children}
        </div>
    );
};
