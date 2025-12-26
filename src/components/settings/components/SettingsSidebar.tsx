
import { Search, Settings, Cpu, Zap, Gauge, Blocks } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import '../SettingsPage.css';

interface SettingsSidebarProps {
    activeCategory: string;
    onCategoryChange: (category: string) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

export const SettingsSidebar = ({ activeCategory, onCategoryChange, searchQuery, onSearchChange }: SettingsSidebarProps) => {
    const { t } = useI18n();

    const categories = [
        { id: 'commonly-used', label: t('settings.commonlyUsed'), icon: Settings },
        { id: 'ai-config', label: t('settings.aiConfig'), icon: Cpu },
        { id: 'analysis-packages', label: t('settings.analysisPackages') || '分析能力', icon: Blocks },
        { id: 'performance', label: t('config.performanceQuality'), icon: Gauge },
        { id: 'advanced', label: t('settings.advanced'), icon: Zap },
    ];

    const shouldShowCategory = (categoryId: string) => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        // Simple mapping for demo, usually this logic stays in parent or a hook
        const categoryLabels: Record<string, string[]> = {
            'commonly-used': ['常用', 'common', '本地', 'local', '模型', 'model'],
            'ai-config': ['ai', '配置', 'config', 'api', 'key', '硬件', 'hardware', '推荐', 'recommendation'],
            'analysis-packages': ['分析', 'analysis', '能力', 'package', 'sklearn', 'statsmodels', '机器学习'],
            'performance': ['性能', 'performance', '质量', 'quality', '列', 'column', '超时', 'timeout'],
            'advanced': ['高级', 'advanced']
        };
        return categoryLabels[categoryId]?.some(label => label.includes(query)) || false;
    };

    const filteredCategories = categories.filter(cat => shouldShowCategory(cat.id));

    return (
        <aside className="settings-sidebar">
            <div className="settings-sidebar-header">
                <div className="settings-search-box">
                    <Search size={14} style={{ opacity: 0.5 }} />
                    <input
                        type="text"
                        className="settings-search-input"
                        placeholder={t('settings.searchPlaceholder') || "Search..."}
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </div>

            <nav className="settings-nav">
                {filteredCategories.map(cat => {
                    const Icon = cat.icon;
                    return (
                        <button
                            key={cat.id}
                            className={`settings-nav-item ${activeCategory === cat.id ? 'active' : ''}`}
                            onClick={() => onCategoryChange(cat.id)}
                        >
                            <Icon size={18} />
                            <span>{cat.label}</span>
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
};
