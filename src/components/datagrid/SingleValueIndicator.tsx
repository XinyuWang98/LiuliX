import React from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { formatTimestamp } from '../../utils/dateUtils';

interface SingleValueIndicatorProps {
    value: any;
    type: string;
    // 传入 formatCellValue 以复用逻辑，或者在组件内简单处理
}

export const SingleValueIndicator: React.FC<SingleValueIndicatorProps> = ({ value, type }) => {
    const { t } = useI18n();

    // 简化的格式化逻辑，避免循环依赖
    const formatValue = (v: any) => {
        if (v === null || v === undefined) return '-';
        const typeUpper = type.toUpperCase();
        if (typeUpper.includes('DATE') || typeUpper.includes('TIMESTAMP')) {
            return formatTimestamp(v, typeUpper.includes('TIMESTAMP'));
        }
        if (typeUpper === 'BOOLEAN') return v ? t('common.yes') : t('common.no');
        return String(v);
    };

    const displayValue = formatValue(value);

    return (
        <div className="headerMiniHistogram single-value-indicator">
            <div className="single-value-badge" title={t('grid.singleValueTitle', { value: displayValue })}>
                <span className="single-value-label">{t('grid.singleValueLabel')}</span>
                <span className="single-value-text">{displayValue}</span>
            </div>
        </div>
    );
};
