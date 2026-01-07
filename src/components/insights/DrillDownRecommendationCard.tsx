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
    /** 当前深度 (用于显示层级徽章) */
    depth: number;
}

export function DrillDownRecommendationCard({
    label,
    onClick,
    disabled = false,
    isRecommended = false,
    depth
}: DrillDownRecommendationCardProps) {
    // 下钻建议卡片显示的是下一层级 (depth + 1)
    const nextDepth = depth + 1;

    return (
        <div
            className={`drill-down-recommendation-card ${disabled ? 'drill-down-recommendation-card--disabled' : ''}`}
            onClick={disabled ? undefined : onClick}
            role="button"
            tabIndex={disabled ? -1 : 0}
        >
            {/* 左侧层级徽章 - 复用 InsightCardV2 的 card-icon 样式 */}
            <div className={`card-icon depth-${nextDepth}`}>
                L{nextDepth}
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
