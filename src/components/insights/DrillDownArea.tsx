/**
 * DrillDownArea 组件
 * 渲染推荐区 + 自选区
 */

import { useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { ActionChip } from './ActionChip';
import { DrillDownAction } from '@/types/insightTree';
import { promptRegistry } from '@/services/promptRegistry';
import { ChevronDown, Sparkles, Settings } from 'lucide-react';
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
    availableColumns,
    depth,
    maxDepth,
    onExecuteAction,
    onExecuteCustom,
    isExecuting = false
}: DrillDownAreaProps) {
    const { t } = useI18n();
    const [showCustom, setShowCustom] = useState(false);
    const [selectedPrompt, setSelectedPrompt] = useState('');
    const [selectedColumn, setSelectedColumn] = useState('');
    const [selectedColumn2, setSelectedColumn2] = useState('');

    // 检查是否已达到最大深度
    if (depth >= maxDepth) {
        return null;
    }

    // 获取可用的 L2 Prompts
    const availablePrompts = promptRegistry.listPrompts({ layer: 'L2_EXECUTION' });

    // 执行自选分析
    const handleCustomExecute = () => {
        if (!selectedPrompt || !selectedColumn) return;

        const params: Record<string, unknown> = {};

        // 根据 Prompt 类型设置参数
        if (selectedPrompt.includes('distribution')) {
            params.column_name = selectedColumn;
        } else if (selectedPrompt.includes('correlation')) {
            params.col_x = selectedColumn;
            params.col_y = selectedColumn2 || availableColumns.find(c => c !== selectedColumn) || selectedColumn;
        } else {
            params.column_name = selectedColumn;
        }

        onExecuteCustom(selectedPrompt, params);
        setShowCustom(false);
    };

    return (
        <div className="drill-down-area">
            {/* 推荐区 */}
            {recommendations.length > 0 && (
                <div className="drill-down-area__recommendations">
                    <div className="drill-down-area__label">
                        <Sparkles size={14} />
                        <span>{t('insight.recommendedActions')}</span>
                    </div>
                    <div className="drill-down-area__chips">
                        {recommendations.map((action, index) => (
                            <ActionChip
                                key={`${action.promptId}-${index}`}
                                label={action.label}
                                onClick={() => onExecuteAction(action)}
                                isRecommended={action.isRecommended}
                                disabled={isExecuting}
                                isLoading={isExecuting}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* 自选区触发器 */}
            <div className="drill-down-area__custom-trigger">
                <button
                    className="drill-down-area__custom-btn"
                    onClick={() => setShowCustom(!showCustom)}
                    disabled={isExecuting}
                >
                    <Settings size={14} />
                    <span>{t('insight.customAnalysis')}</span>
                    <ChevronDown
                        size={14}
                        className={`drill-down-area__chevron ${showCustom ? 'drill-down-area__chevron--open' : ''}`}
                    />
                </button>
            </div>

            {/* 自选区展开内容 */}
            {showCustom && (
                <div className="drill-down-area__custom-panel">
                    <div className="drill-down-area__row">
                        <label>{t('insight.selectMethod')}</label>
                        <select
                            value={selectedPrompt}
                            onChange={(e) => setSelectedPrompt(e.target.value)}
                        >
                            <option value="">{t('insight.pleaseSelect')}</option>
                            {availablePrompts.map(p => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="drill-down-area__row">
                        <label>{t('insight.selectColumn')}</label>
                        <select
                            value={selectedColumn}
                            onChange={(e) => setSelectedColumn(e.target.value)}
                        >
                            <option value="">{t('insight.pleaseSelect')}</option>
                            {availableColumns.map(col => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                    </div>

                    {/* 双变量时显示第二列选择 */}
                    {selectedPrompt.includes('correlation') && (
                        <div className="drill-down-area__row">
                            <label>{t('insight.selectColumn2')}</label>
                            <select
                                value={selectedColumn2}
                                onChange={(e) => setSelectedColumn2(e.target.value)}
                            >
                                <option value="">{t('insight.pleaseSelect')}</option>
                                {availableColumns.filter(c => c !== selectedColumn).map(col => (
                                    <option key={col} value={col}>{col}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button
                        className="drill-down-area__execute-btn"
                        onClick={handleCustomExecute}
                        disabled={!selectedPrompt || !selectedColumn || isExecuting}
                    >
                        {t('insight.execute')}
                    </button>
                </div>
            )}
        </div>
    );
}
