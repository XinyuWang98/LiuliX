import React from 'react';
import './liulix.css';

/**
 * LiuliInput Props
 */
export interface LiuliInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    /** 输入框内部左侧图标 */
    icon?: React.ReactNode;
    /** 错误信息，存在时显示红框 */
    error?: boolean;
    /** 标签（目前未在组件内实现显示，预留） */
    label?: string;
}

/**
 * Liuli Design System - Input Component
 * 
 * 基础输入框组件，支持图标前缀和错误状态。
 * 样式符合玻璃态设计规范。
 * 
 * @example
 * <LiuliInput placeholder="Search..." icon={<Search size={14} />} />
 */
export const LiuliInput = React.forwardRef<HTMLInputElement, LiuliInputProps>(({
    icon,
    error = false,
    className = '',
    ...props
}, ref) => {
    return (
        <div className={`liuli-input-wrapper ${className}`}>
            <input
                ref={ref}
                className={`liuli-input ${icon ? 'has-icon' : ''} ${error ? 'error' : ''}`}
                {...props}
            />
            {icon && <span className="liuli-input-icon">{icon}</span>}
        </div>
    );
});
