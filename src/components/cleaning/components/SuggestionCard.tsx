// 建议卡片组件 - 简洁版 (In-Place Expansion Mode)

import React from 'react';
import { SimpleSuggestion } from '../types/cleaning.types';
import { useI18n } from '../../../contexts/I18nContext';
import { useEvidence } from '../../../contexts/EvidenceContext';
import { Sparkles, Trash2, Eraser, FileX, Calculator, Wand2, CheckCircle } from 'lucide-react';
import { CodeBlock } from '@/components/common/CodeBlock';
import './SuggestionCard.css';

interface SuggestionCardProps {
    suggestion: SimpleSuggestion;
    isSelected: boolean;
    isIgnored?: boolean; // 是否被忽略
    isSqlExpanded?: boolean; // 外部控制的展开状态
    onToggle: (id: string) => void;
    onToggleSql?: (id: string) => void; // SQL切换回调
    fileName?: string;  // CSV文件名，用于SQL显示
}

/**
 * 单个建议卡片（简洁文本型）
 * 格式：【PROMPT/AI】操作描述 推荐度XX%
 * 点击高亮选中，支持多选，选中后直接在卡片内展开详情
 */
export const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion, isSelected, isIgnored, isSqlExpanded = false, onToggle, fileName }) => {
    const { t } = useI18n();
    const { addRecord, records } = useEvidence();


    // 检查是否已采纳
    const isAdopted = records.some(r => r.metadata?.suggestionId === suggestion.id);

    // 采纳建议
    const handleAdopt = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isAdopted) return;

        addRecord({
            type: 'cleaning',
            title: suggestion.label,
            description: suggestion.reason || t('cleaning.defaultReason'),
            sql: suggestion.sql,
            metadata: {
                suggestionId: suggestion.id,
                fileName: fileName,
                confidence: suggestion.confidence
            }
        });
    };

    // ✅ 判断来源：优先使用source字段，回退到id前缀判断（向后兼容）
    const isFromRouter = suggestion.source === 'router' || suggestion.id.startsWith('cleaner-') || suggestion.id.startsWith('router-');
    const isFromAI = suggestion.source === 'ai' || (!suggestion.source && suggestion.id.startsWith('ai_'));

    // 置信度百分比
    const confidencePercent = Math.round(suggestion.confidence * 100);

    // 根据来源和内容判断图标
    // 根据来源和内容判断图标
    const getIcon = () => {
        // AI生成用sparkles图标 (优先级最高，因为AI建议通常比较特殊)
        if (isFromAI) return <Sparkles size={16} className="icon-ai" />;

        // 优先根据标签内容判断语义化图标
        const labelLower = suggestion.label.toLowerCase();
        if (labelLower.includes('删除') || labelLower.includes('drop')) return <Trash2 size={16} className="icon-delete" />;
        if (labelLower.includes('去重') || labelLower.includes('duplicate')) return <FileX size={16} className="icon-dedup" />;
        if (labelLower.includes('填充') || labelLower.includes('fill')) return <Eraser size={16} className="icon-fill" />;
        if (labelLower.includes('标准化') || labelLower.includes('normalize')) return <Calculator size={16} className="icon-calc" />;
        if (labelLower.includes('转换') || labelLower.includes('convert')) return <Wand2 size={16} className="icon-prompt" />;

        // Router/Prompt模板默认用wand图标
        if (isFromRouter) return <Wand2 size={16} className="icon-prompt" />;

        return <Sparkles size={16} className="icon-default" />;
    };

    // 获取图标类型对应的背景样式类
    const getIconType = () => {
        if (isFromAI) return 'bg-ai';

        const labelLower = suggestion.label.toLowerCase();
        if (labelLower.includes('删除') || labelLower.includes('drop')) return 'bg-danger';
        if (labelLower.includes('去重') || labelLower.includes('duplicate')) return 'bg-warning';
        if (labelLower.includes('填充') || labelLower.includes('fill')) return 'bg-info'; // 蓝色
        if (labelLower.includes('标准化') || labelLower.includes('normalize')) return 'bg-accent'; // 紫色/强调色

        if (isFromRouter) return 'bg-prompt';
        return 'bg-prompt';
    };

    // 格式化SQL展示：用CSV文件名替换DuckDB表名
    const displaySql = (() => {
        if (!suggestion.sql) return '';

        let sql = suggestion.sql;

        // 方案1：替换__TABLE_NAME__占位符
        if (sql.includes('__TABLE_NAME__')) {
            const csvName = fileName || 'your_table.csv';
            sql = sql.replace(/__TABLE_NAME__/g, csvName);
        }
        // 方案2：替换DuckDB实际表名(如t_xxx_working)
        else if (sql.match(/t_\d+_(original|working)/g)) {
            const csvName = fileName || 'your_table.csv';
            sql = sql.replace(/t_\d+_(original|working)/g, csvName);
        }

        // 添加提示注释
        // Note: Using a localized string for the SQL comment
        const warningText = t('cleaning.sqlWarning', { fileName: fileName || 'your_table.csv' });
        return `-- ${warningText}\n${sql}`;
    })();


    // 计算推荐度颜色
    const getConfidenceColor = (score: number) => {
        if (score >= 0.8) return 'var(--color-quality-healthy)'; // 强推荐 (Green)
        if (score >= 0.6) return 'var(--color-quality-warning)'; // 中等 (Orange)
        return 'var(--text-tertiary)'; // 低 (Grey) - 保持低调，或者用 Critical
    };

    return (
        <div
            className={`suggestionCard ${isSelected ? 'selected' : ''} ${isIgnored ? 'ignored' : ''} ${isFromAI ? 'card-ai' : 'card-prompt'}`}
            onClick={() => onToggle(suggestion.id)}
        >
            {/* 1. 头部：来源标签 + 标题 + 推荐度 */}
            <div className="cardHeader">
                <div className="headerLeft">
                    {/* 图标容器 */}
                    <div className={`iconContainer ${getIconType()}`}>
                        {getIcon()}
                    </div>

                    <div className="titleGroup">
                        <div className="titleRow">
                            <span className={`sourceLabel ${isFromAI ? 'ai' : 'prompt'}`}>
                                {isFromAI ? 'AI' : 'PROMPT'}
                            </span>
                            <span
                                className="confidenceText"
                                style={{ color: getConfidenceColor(suggestion.confidence) }}
                            >
                                {t('cleaning.recommendPercent', { percent: confidencePercent })}
                            </span>
                        </div>
                        <span className="suggestionTitle" title={suggestion.label}>
                            {suggestion.label}
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. 中部：详细说明 + SQL代码 */}
            <div className="detailContent">
                <div className="reasonText">{suggestion.reason || t('cleaning.defaultReason')}</div>

                {/* SQL Code Body (Above the Toggle) */}
                {suggestion.sql && isSqlExpanded && (
                    <div className="sqlBody">
                        <CodeBlock
                            code={displaySql}
                            language="sql"
                            formatted={true}
                            copyable={false}
                            className="liuli-code-block"
                        />
                    </div>
                )}
            </div>

            {/* 4. 采纳按钮 */}
            <div className="adoptBtn-container">
                <button
                    className={`adoptBtn ${isAdopted ? 'adopted' : ''}`}
                    onClick={handleAdopt}
                    disabled={isAdopted}
                    title={isAdopted ? t('evidence.adopted') : t('evidence.adopt')}
                >
                    {isAdopted ? (
                        <>
                            <CheckCircle size={14} />
                            <span>{t('evidence.adopted')}</span>
                        </>
                    ) : (
                        <span>{t('evidence.adopt')}</span>
                    )}
                </button>
            </div>
        </div>
    );
};
