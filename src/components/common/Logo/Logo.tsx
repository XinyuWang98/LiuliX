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
                {/* 方案 K (优化版): 磨砂层叠 - 高亮透透 (Brightened) */}

                {/* 1. 磨砂材质 (Frosted Material) - 乳白雾面 */}
                <linearGradient id="frostedGradient" x1="0" y1="100" x2="100" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
                    <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.4" />
                </linearGradient>

                {/* 2. 晶体材质 (Crystal Material) - 极亮，纯净 */}
                <linearGradient id="crystalGradient" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                    <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.8" />
                </linearGradient>

                {/* 3. 边缘光 (Edge Light) - 钻石切面光泽 */}
                <linearGradient id="sharpEdge" x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1.0" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.5" />
                </linearGradient>
            </defs>

            {/* 
               构造逻辑：
               X 由两块板构成。
               1. 底层板 (Bottom Slab) / : 磨砂亚克力材质，厚实，不透明度略高。
               2. 顶层板 (Top Slab) \ : 纯净玻璃材质，通透，边缘锐利，叠加在磨砂板之上。
            */}

            {/* Layer 1: 底层磨砂板 (Bottom-Left to Top-Right) */}
            <g transform="translate(0, 0)">
                {/* 主体 */}
                <path
                    d="M20 90 L38 90 L85 15 L67 15 Z"
                    fill="url(#frostedGradient)"
                    stroke="var(--text-primary)"
                    strokeWidth="0.5"
                    strokeOpacity="0.2"
                />

                {/* 侧边厚度暗示 */}
                <path
                    d="M20 90 L67 15 L65 15 L18 90 Z"
                    fill="var(--text-primary)"
                    fillOpacity="0.2"
                />
            </g>

            {/* Layer 2: 顶层晶体板 (Top-Left to Bottom-Right) */}
            <g>
                {/* 投影 (Shadow on bottom slab) - 仅在交汇处产生微弱投影 */}
                <path
                    d="M15 15 L33 15 L80 90 L62 90 Z"
                    fill="#000"
                    fillOpacity="0.2"
                    style={{ mixBlendMode: 'overlay', filter: 'blur(4px)' }}
                    transform="translate(2, 4)"
                />

                {/* 玻璃主体 */}
                <path
                    d="M15 15 L33 15 L80 90 L62 90 Z"
                    fill="url(#crystalGradient)"
                    stroke="url(#sharpEdge)"
                    strokeWidth="1.5"
                />

                {/* 内部高光折射 (Refraction Line) */}
                <path
                    d="M33 15 L30 15 L77 90 L80 90 Z"
                    fill="#fff"
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
            {/* 布局：[Liuli] [Icon(X)] 
               LogoIcon 仍然放在最后，作为单词的结尾。
            */}

            {showText && (
                <div className="logo-text">
                    <span className="logo-text-primary">Liuli</span>
                </div>
            )}

            <div className="logo-icon-wrapper">
                <LogoIcon />
            </div>
        </div>
    );
};
