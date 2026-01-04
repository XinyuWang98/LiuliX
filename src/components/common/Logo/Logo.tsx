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
            <defs>
                {/* 
                    琉璃质感增强：使用多层渐变模拟厚度和光线折射 
                */}

                {/* 后置玻璃棒 (Back Bar) - 稍暗，模拟在后方 */}
                <linearGradient id="glassBack" x1="80" y1="20" x2="20" y2="80" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="var(--text-primary)" stopOpacity="0.4" />
                    <stop offset="50%" stopColor="var(--text-primary)" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="var(--text-primary)" stopOpacity="0.6" />
                </linearGradient>

                {/* 前置玻璃棒 (Front Bar) - 亮，清晰，覆盖在上方 */}
                <linearGradient id="glassFront" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="var(--text-primary)" stopOpacity="0.8" />
                    <stop offset="45%" stopColor="var(--text-primary)" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="var(--text-primary)" stopOpacity="0.9" />
                </linearGradient>

                {/* 边缘高光 (Edge Highlight) */}
                <linearGradient id="edgeGlow" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#fff" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#fff" stopOpacity="0.2" />
                </linearGradient>
            </defs>

            {/* 1. 后置棒 (Back Bar): Top-Right to Bottom-Left ( / ) */}
            <path
                d="M75 15 L85 15 L25 85 L15 85 Z"
                fill="url(#glassBack)"
                stroke="url(#edgeGlow)"
                strokeWidth="2"
            />
            {/* 侧边厚度 - 增加立体感 */}
            <path
                d="M25 85 L15 85 L17 83 L27 83 Z"
                fill="var(--text-primary)"
                fillOpacity="0.4"
            />

            {/* 2. 前置棒 (Front Bar): Top-Left to Bottom-Right ( \ ) */}
            <g>
                <path
                    d="M15 15 L25 15 L85 85 L75 85 Z"
                    fill="url(#glassFront)"
                    stroke="url(#edgeGlow)"
                    strokeWidth="2"
                    /* 投射阴影，增强前后层次 */
                    style={{ filter: "drop-shadow(0 4px 4px rgba(0,0,0,0.15))" }}
                />

                {/* 表面高光反射 */}
                <path
                    d="M18 15 L22 15 L82 85 L78 85 Z"
                    fill="url(#edgeGlow)"
                    fillOpacity="0.4"
                    style={{ mixBlendMode: 'overlay' }}
                />
            </g>
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
            {/* 核心改动：LogoIcon 现在就是文字的一部分 (X) */}

            {showText && (
                <div className="logo-text">
                    {/* "Liuli" 部分 */}
                    <span className="logo-text-primary">Liuli</span>
                </div>
            )}

            {/* "X" 部分 (图标) - 紧跟在文字后面，或者单独显示 */}
            <div className="logo-icon-wrapper">
                <LogoIcon />
            </div>
        </div>
    );
};
