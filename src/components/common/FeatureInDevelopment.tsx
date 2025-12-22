/**
 * 功能开发中提示组件
 * 用于未完成功能的优雅降级UI
 */

import React from 'react';
import './FeatureInDevelopment.css';

export interface FeatureInDevelopmentProps {
    featureName: string;          // 功能名称
    description?: string;         // 功能描述
    expectedDate?: string;        // 预计完成日期
    showButton?: boolean;         // 是否显示按钮
    onRequestEarlyAccess?: () => void;  // 早期访问回调
}

export const FeatureInDevelopment: React.FC<FeatureInDevelopmentProps> = ({
    featureName,
    description,
    expectedDate,
    showButton = false,
    onRequestEarlyAccess
}) => {
    return (
        <div className="feature-in-development">
            <div className="feature-icon">🚧</div>
            <h3 className="feature-title">{featureName}</h3>

            {description && (
                <p className="feature-description">{description}</p>
            )}

            <div className="feature-status">
                <span className="status-badge">功能开发中</span>
                {expectedDate && (
                    <span className="expected-date">
                        预计完成：{expectedDate}
                    </span>
                )}
            </div>

            {showButton && onRequestEarlyAccess && (
                <button
                    className="early-access-btn"
                    onClick={onRequestEarlyAccess}
                >
                    申请早期访问
                </button>
            )}
        </div>
    );
};

/**
 * 禁用功能包装器
 * 包装未完成功能，显示禁用状态
 */
export interface DisabledFeatureWrapperProps {
    enabled: boolean;
    featureName: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const DisabledFeatureWrapper: React.FC<DisabledFeatureWrapperProps> = ({
    enabled,
    featureName,
    children,
    fallback
}) => {
    if (enabled) {
        return <>{children}</>;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    return <FeatureInDevelopment featureName={featureName} />;
};
