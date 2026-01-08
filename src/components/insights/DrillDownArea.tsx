/**
 * DrillDownArea 组件
 * 渲染推荐区（自选区功能已清理 - 2026-01-08）
 */

import { DrillDownRecommendationCard } from './DrillDownRecommendationCard';
import { DrillDownAction } from '@/types/insightTree';
import './DrillDownArea.css';

export interface DrillDownAreaProps {
    /** AI 推荐的下钻动作 */
    recommendations?: DrillDownAction[];
    /** 可用的列名 (用于自选) */
    availableColumns: string[];
    /** 当前深度 */
    depth: number;
    /** 最大深度 */
    maxDepth: number;
    /** 执行推荐动作 */
    onExecuteAction: (action: DrillDownAction) => void;
    /** 执行自选分析 */
    onExecuteCustom: (promptId: string, params: Record<string, unknown>) => void;
    /** 是否正在执行 */
    isExecuting?: boolean;
}

export function DrillDownArea({
    recommendations = [],
    depth,
    maxDepth,
    onExecuteAction,
    isExecuting = false
}: DrillDownAreaProps) {

    // 检查是否已达到最大深度
    if (depth >= maxDepth) {
        return null;
    }

    return (
        <div className="drill-down-area">
            {/* 推荐区 - 使用卡片式布局 */}
            {recommendations.length > 0 && (
                <div className="drill-down-area__recommendations">
                    <div className="drill-down-area__cards">
                        {recommendations.map((action, index) => (
                            <DrillDownRecommendationCard
                                key={`${action.promptId}-${index}`}
                                label={action.label}
                                onClick={() => onExecuteAction(action)}
                                isRecommended={action.isRecommended}
                                disabled={isExecuting}
                                depth={depth}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

