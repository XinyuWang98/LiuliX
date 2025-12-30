import React from 'react';
import './liulix.css';

export interface LiuliTagProps {
    variant?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger';
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export const LiuliTag = ({
    variant = 'neutral',
    children,
    className = '',
    onClick
}: LiuliTagProps) => {
    return (
        <span
            className={`liuli-tag variant-${variant} ${className} ${onClick ? 'interactive' : ''}`}
            onClick={onClick}
        >
            {children}
        </span>
    );
};
