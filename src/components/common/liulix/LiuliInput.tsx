import React from 'react';
import './liulix.css';

export interface LiuliInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
    error?: boolean;
}

export const LiuliInput = ({
    icon,
    error = false,
    className = '',
    ...props
}: LiuliInputProps) => {
    return (
        <div className={`liuli-input-wrapper ${className}`}>
            <input
                className={`liuli-input ${icon ? 'has-icon' : ''} ${error ? 'error' : ''}`}
                {...props}
            />
            {icon && <span className="liuli-input-icon">{icon}</span>}
        </div>
    );
};
