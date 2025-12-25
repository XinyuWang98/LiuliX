import React from 'react';
import './Logo.css';

interface LogoProps {
    /** Layout direction: 'horizontal' (default) or 'vertical' */
    layout?: 'horizontal' | 'vertical';
    /** Size preset: 's' | 'm' (default) | 'l' | 'xl' */
    size?: 's' | 'm' | 'l' | 'xl';
    /** Whether to show the text label */
    showText?: boolean;
    /** Whether the logo responds to hover events */
    interactive?: boolean;
    /** Optional click handler */
    onClick?: () => void;
    /** Custom class name */
    className?: string;
    /** Visual variant: 'default' | 'neon' | 'flow' | 'glass' */
    variant?: 'default' | 'neon' | 'flow' | 'glass';
}

const LogoIcon: React.FC = () => {
    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="logo-icon-svg"
            aria-hidden="true"
        >
            {/* 
               Geometric Prism Logic - Minimalist Version
               不再使用霓虹色，而是依靠线条粗细和透明度来表达结构
            */}

            {/* Main Pyramid Outline */}
            <path
                d="M50 15L85 80H15L50 15Z"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
            />

            {/* Internal Refraction Lines */}
            <path
                d="M50 15L50 80"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.4"
            />

            <path
                d="M50 45L85 80"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.4"
            />

            <path
                d="M50 45L15 80"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.4"
            />

            {/* Horizontal Light Beam (Entering) */}
            <path
                d="M-10 55L42 55"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.6"
            />

            {/* Refracted Spectrum (Exiting) - Simplified to single hue/monochrome */}
            <path
                d="M58 55L110 40"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.5"
            />
            <path
                d="M58 55L110 55"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.5"
            />
            <path
                d="M58 55L110 70"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.5"
            />
        </svg>
    );
};

export const Logo: React.FC<LogoProps> = ({
    layout = 'horizontal',
    size = 'm',
    showText = true,
    interactive = false,
    onClick,
    className = '',
    variant = 'default'
}) => {
    return (
        <div
            className={`logo-container logo-layout-${layout} logo-size-${size} ${interactive ? 'interactive' : ''} variant-${variant} ${className}`}
            onClick={onClick}
        >
            <div className="logo-icon-wrapper">
                <LogoIcon />
            </div>

            {showText && (
                <div className="logo-text">
                    <span className="logo-text-primary">Liuli</span>
                    <span className="logo-text-secondary">X</span>
                </div>
            )}
        </div>
    );
};
