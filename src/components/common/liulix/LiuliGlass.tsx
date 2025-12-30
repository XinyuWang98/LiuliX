import React from 'react';
import './liulix.css';

export interface LiuliGlassProps extends React.HTMLAttributes<HTMLDivElement> {
    intensity?: 'light' | 'medium' | 'heavy';
    interactive?: boolean;
    glow?: boolean;
    children: React.ReactNode;
}

export const LiuliGlass = ({
    intensity = 'medium',
    interactive = false,
    glow = false,
    className = '',
    children,
    ...props
}: LiuliGlassProps) => {
    return (
        <div
            className={`
                liuli-glass 
                intensity-${intensity} 
                ${interactive ? 'interactive' : ''} 
                ${glow ? 'has-glow' : ''} 
                ${className}
            `}
            {...props}
        >
            {children}
        </div>
    );
};
