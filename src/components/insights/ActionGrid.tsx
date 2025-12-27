import React from 'react';
import './ActionGrid.css';

/**
 * 下钻操作卡片网格组件
 * 以2x3网格形式展示推荐的下钻分析方向
 */

export interface DrillDownAction {
    id: string;
    label: string;
    icon?: string;
    description?: string;
    isCustom?: boolean;
}

interface ActionGridProps {
    actions: DrillDownAction[];
    nodeId?: string; // 可选，避免警告
    onActionClick?: (action: DrillDownAction) => void;
}

export const ActionGrid: React.FC<ActionGridProps> = ({
    actions,
    onActionClick
}) => {
    const handleActionClick = (action: DrillDownAction) => {
        onActionClick?.(action);
        // TODO: 触发下钻逻辑，生成子节点
    };

    return (
        <div className="action-grid">
            {actions.map((action) => (
                <button
                    key={action.id}
                    className={`action-card ${action.isCustom ? 'action-card--custom' : ''}`}
                    onClick={() => handleActionClick(action)}
                >
                    {action.icon && (
                        <div className="action-card__icon">
                            {action.icon}
                        </div>
                    )}
                    <div className="action-card__content">
                        <h3 className="action-card__title">
                            {action.label}
                        </h3>
                        {action.description && (
                            <p className="action-card__description">
                                {action.description}
                            </p>
                        )}
                    </div>
                </button>
            ))}

            {/* 自定义分析卡片 */}
            <button className="action-card action-card--custom">
                <div className="action-card__icon">+</div>
                <div className="action-card__content">
                    <h3 className="action-card__title">
                        自定义分析
                    </h3>
                    <p className="action-card__description">
                        自定义下钻分析方向
                    </p>
                </div>
            </button>
        </div>
    );
};
