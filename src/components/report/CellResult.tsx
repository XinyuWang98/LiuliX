import { useState } from 'react';
import { ReportCell } from '@/types/report';
import { ChartImage } from '@/components/insights/ChartImage';
import { useI18n } from '@/contexts/I18nContext';
import './CellResult.css';

interface CellResultProps {
    cell: ReportCell;
    isLocked: boolean;
    onUpdate: (updates: Partial<ReportCell>) => void;
}

export function CellResult({ cell, isLocked, onUpdate }: CellResultProps) {
    const { t } = useI18n();
    const [isEditing, setIsEditing] = useState(false);

    // Get annotation from metadata
    const annotation = cell.metadata?.annotation || '';

    return (
        <div className="cell-result-container">
            {/* 1. Chart Section */}
            {cell.output.chartImage && (
                <div className="result-chart-wrapper">
                    <ChartImage
                        src={cell.output.chartImage}
                        alt={cell.output.summary || 'Chart'}
                        variant="report" // Matches --img-chart-max-height-report
                    />
                </div>
            )}

            {/* 2. Analysis Summary (AI Insight) */}
            {cell.output.summary && (
                <div className="result-summary">
                    <div className="summary-icon">💡</div>
                    <div className="summary-content">
                        {cell.output.summary}
                    </div>
                </div>
            )}

            {/* 3. Output / Error */}
            {cell.output.stdout && (
                <div className="result-stdout">
                    <pre>{cell.output.stdout}</pre>
                </div>
            )}

            {cell.output.error && (
                <div className="result-error">
                    <div className="error-icon">⚠️</div>
                    <pre>{cell.output.error}</pre>
                </div>
            )}

            {/* 4. Human Annotation Section */}
            <div className="result-annotation">
                {isLocked ? (
                    // Locked Mode (Read Only)
                    annotation ? (
                        <div className="annotation-read">
                            <span className="annotation-label">{t('report.annotation.placeholder')}:</span>
                            <p>{annotation}</p>
                        </div>
                    ) : null
                ) : (
                    // Editing Mode
                    <div className="annotation-edit">
                        <textarea
                            className="annotation-textarea"
                            placeholder={t('report.annotation.placeholder') || "Add your annotation here..."}
                            value={annotation}
                            onChange={(e) => onUpdate({
                                metadata: {
                                    ...cell.metadata,
                                    annotation: e.target.value
                                }
                            })}
                            onFocus={() => setIsEditing(true)}
                            onBlur={() => setIsEditing(false)}
                            rows={isEditing || annotation ? 3 : 1}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
