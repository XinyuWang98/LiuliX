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
               Geometric Prism Logic:
               1. A central triangle/pyramid shape.
               2. Lines representing light entering and refracting.
               3. Neon aesthetic strokes.
            */}

            {/* Main Pyramid Outline - Neon Blue */}
            <path
                d="M50 15L85 80H15L50 15Z"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
            />

            {/* Internal Refraction Lines - Cyan */}
            <path
                d="M50 15L50 80"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.6"
            />

            <path
                d="M50 45L85 80"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.6"
            />

            <path
                d="M50 45L15 80"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.6"
            />

            {/* Horizontal Light Beam (Entering) */}
            <path
                d="M-10 55L42 55"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                opacity="0.8"
                className="logo-beam-enter"
            />

            {/* Refracted Spectrum (Exiting) */}
            <path
                d="M58 55L110 40"
                stroke="#30D158"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.8"
            />
            <path
                d="M58 55L110 55"
                stroke="#007AFF"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.8"
            />
            <path
                d="M58 55L110 70"
                stroke="#BF5AF2"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.8"
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
    className = ''
}) => {
    return (
        <div
            className={`logo-container logo-layout-${layout} logo-size-${size} ${interactive ? 'interactive' : ''} ${className}`}
            onClick={onClick}
        >
            <div className="logo-icon-wrapper">
                <LogoIcon />
            </div>

            {showText && (
                <div className="logo-text">
                    <span className="logo-text-primary">Liuli</span>
                    <span className="logo-text-primary" style={{ color: 'var(--bg-accent)' }}>X</span>
                </div>
            )}
        </div>
    );
};
