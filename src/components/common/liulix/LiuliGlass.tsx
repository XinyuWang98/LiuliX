import React from 'react';
import './liulix.css';

export interface LiuliGlassProps extends React.HTMLAttributes<HTMLDivElement> {
    intensity?: 'light' | 'medium' | 'heavy';
    variant?: 'default' | 'vignette' | 'ultra-clear'; // [NEW] Style variant
    blur?: 'standard' | 'heavy' | 'ultra';            // [NEW] Blur override
    interactive?: boolean;
    glow?: boolean;
    children: React.ReactNode;
}

export const LiuliGlass = ({
    intensity = 'medium',
    variant = 'default',
    blur,
    interactive = false,
    glow = false,
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
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={classes} {...props}>
            {children}
        </div>
    );
};
