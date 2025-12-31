import { useState } from 'react';
import { Sparkles, Play, CheckCircle2, X, RefreshCw, Eraser, FileX, Database } from 'lucide-react';
import { LiuliGlass } from '@/components/common/liulix/LiuliGlass';
import { LiuliButton } from '@/components/common/liulix/LiuliButton';
import { LiuliTag } from '@/components/common/liulix/LiuliTag';
import { CleaningSuggestionCard, CleaningSuggestionData } from './cleaning/CleaningSuggestionCard';
import { CleaningCategoryTabs, CategoryTabData } from './cleaning/CleaningCategoryTabs';
import { CleaningEmptyState } from './cleaning/CleaningEmptyState';
import { DataViewerDemo } from './DataViewerDemo';
import './DataCleaningDemo.css';

/**
 * 数据清洗建议模块完整演示（总览 - 统一版）
 *  DataViewer + 清洗建议融合为一个完整组件
 * 遵循 LiuliX Ascension 视觉语言规范
 */
export const DataCleaningDemo = () => {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState('ai');
    const [expandedSqlId, setExpandedSqlId] = useState<string | null>(null);

    // Mock 数据
    const mockSuggestions: CleaningSuggestionData[] = [
        {
            id: 'ai_1',
            type: 'ai',
            label: '删除包含缺失值的行',
            reason: '检测到 email 列存在 240 个空值，建议删除这些行以保证数据完整性',
            confidence: 0.92,
            sql: "DELETE FROM users WHERE email IS NULL OR email = '';",
            category: 'ai'
        },
        {
            id: 'ai_2',
            type: 'ai',
            label: '标准化日期格式',
            reason: '发现 created_at 列存在多种日期格式，建议统一为 ISO 8601 格式',
            confidence: 0.85,
            sql: "UPDATE users SET created_at = strftime('%Y-%m-%d', created_at);",
            category: 'ai'
        },
        {
            id: 'prompt_1',
            type: 'prompt',
            label: '去除重复记录',
            reason: '发现基于 user_id 的重复记录，建议保留最新的记录',
            confidence: 0.78,
            sql: 'DELETE FROM users WHERE rowid NOT IN (SELECT MAX(rowid) FROM users GROUP BY user_id);',
            category: 'dedup'
        },
        {
            id: 'prompt_2',
            type: 'prompt',
            label: '填充默认值',
            reason: '建议将 status 列的空值填充为默认值 "active"',
            confidence: 0.65,
            sql: "UPDATE users SET status = 'active' WHERE status IS NULL;",
            category: 'fill'
        }
    ];

    const categories: CategoryTabData[] = [
        { id: 'ai', label: 'AI 建议', icon: <Sparkles size={14} />, count: 2 },
        { id: 'dedup', label: '去重', icon: <FileX size={14} />, count: 1 },
        { id: 'fill', label: '填充', icon: <Eraser size={14} />, count: 1 }
    ];

    const filteredSuggestions = mockSuggestions.filter(s => s.category === activeTab);

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredSuggestions.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredSuggestions.map(s => s.id));
        }
    };

    return (
        <div className="data-cleaning-demo">
            {/* 统一的玻璃态容器 - 完整的数据清洗工作流模块 */}
            <LiuliGlass className="unified-cleaning-container" variant="default">
                {/* 顶部：DataViewer 数据展示区 */}
                <div className="data-section">
                    <div className="section-header">
                        <h3 className="section-title">
                            <Database size={18} />
                            数据预览
                        </h3>
                    </div>
                    <DataViewerDemo />
                </div>

                {/* 底部：清洗建议区 */}
                <div className="suggestions-section">
                    {/* 建议区标题栏 */}
                    <div className="cleaning-header">
                        <div className="header-left">
                            <h3 className="cleaning-title">
                                <Sparkles size={18} className="title-icon" />
                                数据清洗建议
                            </h3>
                            <LiuliTag variant="primary">{mockSuggestions.length} 条建议</LiuliTag>
                        </div>
                        <div className="header-actions">
                            <LiuliButton
                                variant="ghost"
                                size="sm"
                                onClick={toggleSelectAll}
                            >
                                <CheckCircle2 size={14} />
                                {selectedIds.length === filteredSuggestions.length ? '取消全选' : '全选'}
                            </LiuliButton>
                            <LiuliButton
                                variant="primary"
                                size="sm"
                                disabled={selectedIds.length === 0}
                            >
                                <Play size={14} />
                                应用选中 ({selectedIds.length})
                            </LiuliButton>
                            <LiuliButton
                                variant="ghost"
                                size="sm"
                                disabled={selectedIds.length === 0}
                            >
                                <X size={14} />
                                忽略
                            </LiuliButton>
                            <LiuliButton variant="secondary" size="sm">
                                <RefreshCw size={14} />
                                刷新AI建议
                            </LiuliButton>
                        </div>
                    </div>

                    {/* 分类标签页 */}
                    <CleaningCategoryTabs
                        categories={categories}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                    />

                    {/* 建议卡片列表 */}
                    <div className="cleaning-content">
                        {filteredSuggestions.length > 0 ? (
                            <div className="suggestion-list">
                                {filteredSuggestions.map(suggestion => (
                                    <CleaningSuggestionCard
                                        key={suggestion.id}
                                        suggestion={suggestion}
                                        isSelected={selectedIds.includes(suggestion.id)}
                                        isSqlExpanded={expandedSqlId === suggestion.id}
                                        onToggle={() => toggleSelect(suggestion.id)}
                                        onSqlToggle={() => setExpandedSqlId(expandedSqlId === suggestion.id ? null : suggestion.id)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <CleaningEmptyState type="empty" />
                        )}
                    </div>
                </div>
            </LiuliGlass>
        </div>
    );
};
