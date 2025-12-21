/**
 * Skills执行进度指示器
 * 显示多步任务的执行进度
 */

import React from 'react';
import './SkillsProgressIndicator.css';

interface SkillsProgressIndicatorProps {
    current: number;
    total: number;
    message?: string;
}

export const SkillsProgressIndicator: React.FC<SkillsProgressIndicatorProps> = ({
    current,
    total,
    message
}) => {
    const percentage = Math.round((current / total) * 100);

    return (
        <div className="skills-progress-indicator">
            <div className="skills-progress-header">
                <span className="skills-progress-label">
                    🔄 Skills执行中
                </span>
                <span className="skills-progress-step">
                    第 {current}/{total} 步
                </span>
            </div>

            <div className="skills-progress-bar">
                <div
                    className="skills-progress-fill"
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {message && (
                <div className="skills-progress-message">
                    {message}
                </div>
            )}
        </div>
    );
};
