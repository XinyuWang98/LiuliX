import { useI18n } from '@/contexts/I18nContext';
import { HistoryItem } from '../types/cleaning.types';
import { Droplets, Trash2, FileCheck, Wand2, Sparkles, AlertCircle } from 'lucide-react';
import './HistoryTab.css';

interface HistoryTabProps {
    history: HistoryItem[];
}

/**
 * 历史记录标签页组件
 * 职责：展示数据清洗历史记录列表，包含时间戳、操作描述和行数变化
 * @update 2026-01-04 视觉增强：引入图标、列名高亮、来源标签
 */
export function HistoryTab({ history }: HistoryTabProps) {
    const { t } = useI18n();

    if (history.length === 0) {
        return (
            <div className="historyEmpty">
                {t('cleaning.noHistory')}
            </div>
        );
    }

    // 根据操作内容获取对应的图标
    const getActionIcon = (action: string) => {
        if (action.includes('填充')) return <Droplets size={14} className="icon-fill" />;
        if (action.includes('删除') || action.includes('移除')) return <Trash2 size={14} className="icon-delete" />;
        if (action.includes('标准') || action.includes('类型')) return <FileCheck size={14} className="icon-type" />;
        if (action.includes('AI') || action.includes('智能')) return <Sparkles size={14} className="icon-ai" />;
        return <Wand2 size={14} className="icon-default" />;
    };

    // 高亮列名逻辑
    const renderActionText = (text: string) => {
        // 匹配规则：英文列名通常是 snake_case 或 camelCase，且被中文包围
        // 简单策略：匹配英文字符串作为潜在列名
        const parts = text.split(/([a-zA-Z0-9_]+)/g);

        return (
            <span className="actionText">
                {parts.map((part, index) => {
                    // 如果是连续的英文字符且长度大于1，视为潜在列名进行高亮
                    if (/[a-zA-Z0-9_]{2,}/.test(part)) {
                        return <code key={index} className="highlightColumn">{part}</code>;
                    }
                    return <span key={index}>{part}</span>;
                })}
            </span>
        );
    };

    return (
        <div className="historyList liuli-scroll">
            {history.map(record => {
                const delta = record.rowCountAfter - record.rowCountBefore;
                const isAI = record.id.startsWith('ai_') || record.action.includes('AI');

                return (
                    <div key={record.id} className="historyItem">
                        {/* 1. 左侧图标 */}
                        <div className="historyIconWrapper">
                            {getActionIcon(record.action)}
                        </div>

                        {/* 2. 中间内容区域 */}
                        <div className="historyContent">
                            <div className="historyHeader">
                                <span className="historyTime">
                                    {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                                {isAI && <span className="sourceTag ai">AI</span>}
                            </div>
                            <div className="historyAction">
                                {renderActionText(record.action)}
                            </div>
                        </div>

                        {/* 3. 右侧数据变化 */}
                        <div className="historyMeta">
                            <span className={`deltaTag ${delta < 0 ? 'negative' : (delta > 0 ? 'positive' : 'neutral')}`}>
                                <span className="count-before">{record.rowCountBefore}</span>
                                <span className="arrow">→</span>
                                <span className="count-after">{record.rowCountAfter}</span>
                                {delta !== 0 && <span className="delta-value">({delta > 0 ? '+' : ''}{delta})</span>}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
