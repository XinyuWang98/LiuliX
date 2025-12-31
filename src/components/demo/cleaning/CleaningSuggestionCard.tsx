import { Sparkles, Trash2, Eraser, FileX, Wand2, ChevronDown, ChevronRight, Copy } from 'lucide-react';
import { LiuliGlass } from '@/components/common/liulix/LiuliGlass';
import './CleaningSuggestionCard.css';

export interface CleaningSuggestionData {
    id: string;
    type: 'ai' | 'prompt';
    label: string;
    reason: string;
    confidence: number;
    sql?: string;
    category: string;
}

interface CleaningSuggestionCardProps {
    suggestion: CleaningSuggestionData;
    isSelected: boolean;
    isSqlExpanded: boolean;
    onToggle: () => void;
    onSqlToggle: () => void;
}

/**
 * 数据清洗建议卡片（原子组件）
 * 遵循 LiuliX Ascension 视觉语言规范
 */
export const CleaningSuggestionCard = ({
    suggestion,
    isSelected,
    isSqlExpanded,
    onToggle,
    onSqlToggle
}: CleaningSuggestionCardProps) => {
    const getConfidenceColor = (score: number) => {
        if (score >= 0.8) return 'var(--success)';
        if (score >= 0.6) return 'var(--warning)';
        return 'var(--text-dim)';
    };

    const getIcon = () => {
        if (suggestion.type === 'ai') return <Sparkles size={16} />;
        const labelLower = suggestion.label.toLowerCase();
        if (labelLower.includes('删除') || labelLower.includes('drop')) return <Trash2 size={16} />;
        if (labelLower.includes('去重') || labelLower.includes('duplicate')) return <FileX size={16} />;
        if (labelLower.includes('填充') || labelLower.includes('fill')) return <Eraser size={16} />;
        return <Wand2 size={16} />;
    };

    return (
        <LiuliGlass
            className={`cleaning-suggestion-card ${isSelected ? 'selected' : ''} ${suggestion.type === 'ai' ? 'card-ai' : 'card-prompt'}`}
            onClick={onToggle}
        >
            {/* 卡片头部 */}
            <div className="card-header">
                <div className="header-left-content">
                    <span className={`source-tag ${suggestion.type === 'ai' ? 'tag-ai' : 'tag-prompt'}`}>
                        {getIcon()}
                        {suggestion.type === 'ai' ? 'AI' : 'PROMPT'}
                    </span>
                    <span className="suggestion-label">{suggestion.label}</span>
                </div>
                <span
                    className="confidence-badge"
                    style={{ color: getConfidenceColor(suggestion.confidence) }}
                >
                    推荐 {Math.round(suggestion.confidence * 100)}%
                </span>
            </div>

            {/* 详情内容 */}
            <div className="card-content">
                <p className="reason-text">{suggestion.reason}</p>

                {/* SQL 代码展开区域 */}
                {suggestion.sql && isSqlExpanded && (
                    <div className="sql-code-block">
                        <code className="sql-code">{suggestion.sql}</code>
                    </div>
                )}
            </div>

            {/* SQL 操作栏 */}
            {suggestion.sql && (
                <div
                    className="card-footer"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSqlToggle();
                    }}
                >
                    <div className="sql-toggle">
                        {isSqlExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <span className="sql-label">EXECUTE SQL</span>
                    </div>
                    {isSqlExpanded && (
                        <button
                            className="copy-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(suggestion.sql || '');
                            }}
                        >
                            <Copy size={12} />
                        </button>
                    )}
                </div>
            )}
        </LiuliGlass>
    );
};
