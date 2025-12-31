import React from 'react';
import './liulix.css';

export interface LiuliGlassProps extends React.HTMLAttributes<HTMLDivElement> {
    intensity?: 'light' | 'medium' | 'heavy';
    variant?: 'default' | 'vignette' | 'ultra-clear';
    blur?: 'standard' | 'heavy' | 'ultra';
    interactive?: boolean;
    glow?: boolean;
    children: React.ReactNode;
    /** Padding 大小: none (0), small (12px), medium (16px), large (24px), xlarge (32px) */
    padding?: 'none' | 'small' | 'medium' | 'large' | 'xlarge';
}

export const LiuliGlass = ({
    intensity = 'medium',
    variant = 'default',
    blur,
    interactive = false,
    glow = false,
    padding,
    className = '',
    children,
    ...props
}: LiuliGlassProps) => {
    // Construct class names based on props
    const classes = [
        'liuli-glass',
        `intensity-${intensity}`,
        variant !== 'default' ? `variant-${variant}` : '',
        blur ? `blur-${blur}` : '',
        interactive ? 'interactive' : '',
        glow ? 'has-glow' : '',
        padding ? `padding-${padding}` : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={classes} {...props}>
            {children}
        </div>
    );
};
