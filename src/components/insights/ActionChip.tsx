/**
 * ActionChip 组件
 * 用于渲染下钻按钮 (Action Chips)
 */

import React from 'react';
import { useI18n } from '@/contexts/I18nContext';
import './ActionChip.css';

export interface ActionChipProps {
    /** 按钮文案 */
    label: string;
    /** 点击回调 */
    onClick: () => void;
    /** 是否为 AI 推荐 (高亮显示) */
    isRecommended?: boolean;
    /** 是否禁用 */
    disabled?: boolean;
    /** 是否正在加载 */
    isLoading?: boolean;
    /** 图标 (可选) */
    icon?: React.ReactNode;
}

export function ActionChip({
    label,
    onClick,
    isRecommended = false,
    disabled = false,
    isLoading = false,
    icon
}: ActionChipProps) {
    const { t } = useI18n();

    return (
        <button
            className={`action-chip ${isRecommended ? 'action-chip--recommended' : ''} ${disabled ? 'action-chip--disabled' : ''}`}
            onClick={onClick}
            disabled={disabled || isLoading}
            title={isRecommended ? t('insight.recommendedAction') : undefined}
        >
            {isLoading ? (
                <span className="action-chip__spinner" />
            ) : icon ? (
                <span className="action-chip__icon">{icon}</span>
            ) : null}
            <span className="action-chip__label">{label}</span>
            {isRecommended && (
                <span className="action-chip__badge">AI</span>
            )}
        </button>
    );
}
