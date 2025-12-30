import React from 'react';
import './liulix.css';

export interface LiuliButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const LiuliButton = ({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    className = '',
    children,
    disabled,
    ...props
}: LiuliButtonProps) => {
    return (
        <button
            className={`liuli-button variant-${variant} size-${size} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <div className="liuli-spinner" />}
            {!isLoading && leftIcon}
            {children}
            {!isLoading && rightIcon}
        </button>
    );
};
