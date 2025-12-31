import { useState } from 'react';
import { Sparkles, Trash2, Eraser } from 'lucide-react';
import { CleaningSuggestionCard, CleaningSuggestionData } from './cleaning/CleaningSuggestionCard';
import { CleaningCategoryTabs, CategoryTabData } from './cleaning/CleaningCategoryTabs';
import { CleaningEmptyState } from './cleaning/CleaningEmptyState';
import './DataCleaningAtomicDemo.css';

/**
 * 数据清洗原子组件独立展示（分）
 * 用于单独调试和展示各个原子组件
 */
export const DataCleaningAtomicDemo = () => {
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [expandedSqlId, setExpandedSqlId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('ai');

    // Mock 数据
    const mockCards: CleaningSuggestionData[] = [
        {
            id: 'demo_ai',
            type: 'ai',
            label: '删除包含缺失值的行',
            reason: '检测到 email 列存在 240 个空值，建议删除这些行以保证数据完整性',
            confidence: 0.92,
            sql: "DELETE FROM users WHERE email IS NULL OR email = '';",
            category: 'ai'
        },
        {
            id: 'demo_prompt',
            type: 'prompt',
            label: '去除重复记录',
            reason: '发现基于 user_id 的重复记录，建议保留最新的记录',
            confidence: 0.78,
            sql: 'DELETE FROM users WHERE rowid NOT IN (SELECT MAX(rowid) FROM users GROUP BY user_id);',
            category: 'prompt'
        }
    ];

    const categories: CategoryTabData[] = [
        { id: 'ai', label: 'AI 建议', icon: <Sparkles size={14} />, count: 2 },
        { id: 'dedup', label: '去重', icon: <Trash2 size={14} />, count: 1 },
        { id: 'fill', label: '填充', icon: <Eraser size={14} />, count: 1 }
    ];

    return (
        <div className="data-cleaning-atomic-demo">
            {/* 组件1：建议卡片 */}
            <div className="atomic-section">
                <h3 className="atomic-section-title">组件 1：建议卡片 (SuggestionCard)</h3>
                <p className="atomic-section-desc">展示两种类型的建议卡片：AI 生成（蓝色高光）和 PROMPT 模板（主题色高光）</p>
                <div className="atomic-demo-grid">
                    {mockCards.map((card) => (
                        <div key={card.id} className="demo-card-wrapper">
                            <div className="demo-label">{card.type === 'ai' ? 'AI 卡片' : 'PROMPT 卡片'}</div>
                            <CleaningSuggestionCard
                                suggestion={card}
                                isSelected={selectedCardId === card.id}
                                isSqlExpanded={expandedSqlId === card.id}
                                onToggle={() => setSelectedCardId(selectedCardId === card.id ? null : card.id)}
                                onSqlToggle={() => setExpandedSqlId(expandedSqlId === card.id ? null : card.id)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* 组件2：分类标签页 */}
            <div className="atomic-section">
                <h3 className="atomic-section-title">组件 2：分类标签页 (CategoryTabs)</h3>
                <p className="atomic-section-desc">展示不同分类的标签页，点击切换激活状态</p>
                <div className="demo-tabs-wrapper">
                    <CleaningCategoryTabs
                        categories={categories}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                    />
                </div>
                <div className="demo-info">当前激活标签: <strong>{activeTab}</strong></div>
            </div>

            {/* 组件3：空状态 */}
            <div className="atomic-section">
                <h3 className="atomic-section-title">组件 3：空状态 (EmptyState)</h3>
                <p className="atomic-section-desc">展示不同类型的空状态提示</p>
                <div className="empty-states-grid">
                    <div className="empty-state-demo">
                        <div className="demo-label">初始状态</div>
                        <div className="empty-state-box">
                            <CleaningEmptyState type="initial" />
                        </div>
                    </div>
                    <div className="empty-state-demo">
                        <div className="demo-label">空分类</div>
                        <div className="empty-state-box">
                            <CleaningEmptyState type="empty" />
                        </div>
                    </div>
                    <div className="empty-state-demo">
                        <div className="demo-label">加载中</div>
                        <div className="empty-state-box">
                            <CleaningEmptyState type="loading" />
                        </div>
                    </div>
                    <div className="empty-state-demo">
                        <div className="demo-label">成功状态</div>
                        <div className="empty-state-box">
                            <CleaningEmptyState type="success" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
