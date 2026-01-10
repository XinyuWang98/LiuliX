/**
 * CellResult 组件
 * 左侧结论域：显示图表、AI摘要、stdout输出、用户注解
 */

import { useState } from 'react';
import { ChartImage } from '../insights/ChartImage';
import { useI18n } from '@/contexts/I18nContext';
import { ReportCell } from '@/types/report';
import './CellResult.css';

interface CellResultProps {
    /** Cell 数据 */
    cell: ReportCell;
    /** 注解变更回调 */
    onAnnotationChange: (annotation: string) => void;
    /** 是否锁定（签字后禁止编辑） */
    isLocked: boolean;
}

/**
 * 左侧结论域组件
 * 复用 ChartImage 组件展示图表
 */
export function CellResult({ cell, onAnnotationChange, isLocked }: CellResultProps) {
    const { t } = useI18n();
    const [isEditing, setIsEditing] = useState(false);
    const [annotationValue, setAnnotationValue] = useState(cell.metadata?.annotation || '');

    // 处理注解保存
    const handleAnnotationBlur = () => {
        setIsEditing(false);
        if (annotationValue !== cell.metadata?.annotation) {
            onAnnotationChange(annotationValue);
        }
    };

    return (
        <div className="cell-result">
            {/* 标题（如果有） */}
            {cell.metadata?.title && (
                <h4 className="cell-result-title">{cell.metadata.title}</h4>
            )}

            {/* 图表区 - 复用 ChartImage 组件 */}
            {cell.output.chartImage && (
                <div className="cell-result-chart">
                    <ChartImage
                        src={cell.output.chartImage}
                        alt={cell.metadata?.title || t('report.cell.defaultTitle')}
                        variant="report"
                        clickable={true}
                        downloadable={true}
                    />
                </div>
            )}

            {/* AI 摘要 */}
            {cell.output.summary && (
                <div className="cell-result-summary">
                    <blockquote>{cell.output.summary}</blockquote>
                </div>
            )}

            {/* stdout 输出 */}
            {cell.output.stdout && (
                <pre className="cell-result-stdout">{cell.output.stdout}</pre>
            )}

            {/* 用户注解（可编辑） */}
            <div className="cell-result-annotation">
                {isLocked ? (
                    // 锁定状态：只读显示
                    <p className="annotation-text">
                        {cell.metadata?.annotation || ''}
                    </p>
                ) : isEditing ? (
                    // 编辑状态：文本框
                    <textarea
                        className="annotation-editor"
                        value={annotationValue}
                        onChange={e => setAnnotationValue(e.target.value)}
                        onBlur={handleAnnotationBlur}
                        placeholder={t('report.annotation.placeholder')}
                        autoFocus
                    />
                ) : (
                    // 默认状态：点击编辑
                    <div
                        className="annotation-placeholder"
                        onClick={() => setIsEditing(true)}
                    >
                        {cell.metadata?.annotation || t('report.annotation.placeholder')}
                    </div>
                )}
            </div>
        </div>
    );
}
