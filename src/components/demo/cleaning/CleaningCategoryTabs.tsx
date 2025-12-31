import './CleaningCategoryTabs.css';

export interface CategoryTabData {
    id: string;
    label: string;
    icon: React.ReactNode;
    count: number;
}

interface CleaningCategoryTabsProps {
    categories: CategoryTabData[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
}

/**
 * 数据清洗分类标签页组件（原子组件）
 * 遵循 LiuliX Ascension 视觉语言规范
 */
export const CleaningCategoryTabs = ({
    categories,
    activeTab,
    onTabChange
}: CleaningCategoryTabsProps) => {
    return (
        <div className="cleaning-category-tabs">
            {categories.map(cat => (
                <button
                    key={cat.id}
                    className={`category-tab ${activeTab === cat.id ? 'active' : ''} ${cat.id === 'ai' ? 'ai-tab' : ''}`}
                    onClick={() => onTabChange(cat.id)}
                >
                    <span className="tab-icon">{cat.icon}</span>
                    <span className="tab-label">{cat.label}</span>
                    <span className="tab-count">({cat.count})</span>
                </button>
            ))}
        </div>
    );
};
