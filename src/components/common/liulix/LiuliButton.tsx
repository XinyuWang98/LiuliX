import React from 'react';
import './liulix.css';

/**
 * LiuliButton Props
 */
export interface LiuliButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** 
     * 按钮样式变体 
     * - primary: 主按钮，高亮强调（默认）
     * - secondary: 次级按钮，玻璃态背景
     * - ghost: 幽灵按钮，无边框背景，仅文字/图标
     * - danger: 危险操作，红色警示
     */
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    /**
     * 按钮尺寸
     * - sm: 小号 (28px height)
     * - md: 中号 (36px height, 默认)
     * - lg: 大号 (44px height)
     * - icon: 图标按钮 (正方形)
     */
    size?: 'sm' | 'md' | 'lg' | 'icon';
    /** 是否显示加载状态 */
    isLoading?: boolean;
    /** 左侧图标 */
    leftIcon?: React.ReactNode;
    /** 右侧图标 */
    rightIcon?: React.ReactNode;
}

/**
 * Liuli Design System - Button Component
 * 
 * 核心交互组件，支持多种变体和尺寸。
 * 内部封装了加载状态和图标布局。
 * 
 * @example
 * <LiuliButton variant="primary" onClick={handleClick}>Submit</LiuliButton>
 * <LiuliButton variant="ghost" size="icon"><X size={16} /></LiuliButton>
 */
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
