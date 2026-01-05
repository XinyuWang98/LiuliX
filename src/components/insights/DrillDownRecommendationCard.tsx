/**
 * DrillDownRecommendationCard - 下钻推荐卡片组件
 * 以卡片形式展示下钻建议，替代原来的 ActionChip 列表
 */

import { Sparkles, ArrowRight } from 'lucide-react';
import './DrillDownRecommendationCard.css';

interface DrillDownRecommendationCardProps {
    /** 推荐标题 */
    label: string;
    /** 点击回调 */
    onClick: () => void;
    /** 是否禁用 */
    disabled?: boolean;
    /** 是否是 AI 推荐 */
    isRecommended?: boolean;
}

export function DrillDownRecommendationCard({
    label,
    onClick,
    disabled = false,
    isRecommended = false
}: DrillDownRecommendationCardProps) {
    return (
        <div
            className={`drill-down-recommendation-card ${disabled ? 'drill-down-recommendation-card--disabled' : ''}`}
            onClick={disabled ? undefined : onClick}
            role="button"
            tabIndex={disabled ? -1 : 0}
        >
            {/* 左侧图标 */}
            <div className="drill-down-recommendation-card__icon">
                <Sparkles size={16} />
            </div>

            {/* 中间标题 */}
            <div className="drill-down-recommendation-card__content">
                <div className="drill-down-recommendation-card__label">{label}</div>
                {isRecommended && (
                    <div className="drill-down-recommendation-card__badge">AI 推荐</div>
                )}
            </div>

            {/* 右侧箭头 */}
            <div className="drill-down-recommendation-card__arrow">
                <ArrowRight size={16} />
            </div>
        </div>
    );
}
