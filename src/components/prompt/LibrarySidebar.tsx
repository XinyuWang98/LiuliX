import React, { useMemo } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { promptRegistry } from '@/services/promptRegistry';
import { PromptFilter } from '@/types/prompt';
import { BookOpen, Sparkles, Database, Filter } from 'lucide-react';
import './LibrarySidebar.css';

interface LibrarySidebarProps {
    currentFilter: PromptFilter;
    onFilterChange: (filter: PromptFilter) => void;
}

export const LibrarySidebar: React.FC<LibrarySidebarProps> = ({ currentFilter, onFilterChange }) => {
    const { t } = useI18n();

    // 获取实时计数
    const counts = useMemo(() => promptRegistry.getPromptCounts(), []);

    // 核心分类导航处理
    const handleCategoryClick = (category: 'all' | 'cleaning' | 'analysis') => {
        const newFilter = { ...currentFilter };

        if (category === 'all') {
            delete newFilter.tagCategory;
            delete newFilter.tagValue;
            delete newFilter.layer; // Reset all
        } else if (category === 'cleaning') {
            // Filter by any tag value "cleaning"
            delete newFilter.tagCategory;
            newFilter.tagValue = 'cleaning';
        } else if (category === 'analysis') {
            // Reset cleaning filter
            if (newFilter.tagValue === 'cleaning') {
                delete newFilter.tagCategory;
                delete newFilter.tagValue;
            }
        }

        onFilterChange(newFilter);
    };

    const isCategoryActive = (category: 'all' | 'cleaning' | 'analysis') => {
        if (category === 'all') {
            return !currentFilter.tagValue;
        }
        if (category === 'cleaning') {
            return currentFilter.tagValue === 'cleaning';
        }
        return false; // analysis logic needs refinement based on actual data structure
    };

    return (
        <aside className="library-sidebar">
            {/* 核心分类 */}
            <div className="sidebar-section">
                <div className="sidebar-section-title">{t('prompt.library.filter.all')}</div>
                <div className="sidebar-menu">
                    <div
                        className={`sidebar-menu-item ${!currentFilter.tagValue ? 'active' : ''}`}
                        onClick={() => handleCategoryClick('all')}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <BookOpen size={16} />
                            <span>{t('prompt.sidebar.all')}</span>
                        </div>
                        {/* <span className="count">{counts.analysis.total + counts.cleaning.total}</span> */}
                    </div>

                    <div
                        className={`sidebar-menu-item ${currentFilter.tagValue === 'cleaning' ? 'active' : ''}`}
                        onClick={() => handleCategoryClick('cleaning')}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Database size={16} />
                            <span>{t('prompt.sidebar.cleaning')}</span>
                        </div>
                        <span className="count">{counts.cleaning.all || 0}</span>
                    </div>

                    <div
                        className={`sidebar-menu-item ${false ? 'active' : ''}`} // Logic for Analysis active state
                        onClick={() => handleCategoryClick('analysis')}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Sparkles size={16} />
                            <span>{t('prompt.sidebar.analysis')}</span>
                        </div>
                        <span className="count">{counts.analysis.all || 0}</span>
                    </div>
                </div>
            </div>

            <div className="divider" style={{ height: '1px', background: 'var(--border)' }}></div>

            {/* 维度筛选 (Faceted Filters) */}
            <div className="sidebar-section">
                <div className="sidebar-section-title">
                    <Filter size={12} style={{ marginRight: 4 }} />
                    {t('prompt.library.filter.industry')}
                </div>
                <div className="sidebar-menu">
                    {Object.entries(counts.industry).map(([value, count]) => (
                        <div
                            key={value}
                            className={`sidebar-menu-item ${currentFilter.tagCategory === 'industry' && currentFilter.tagValue === value ? 'active' : ''}`}
                            onClick={() => onFilterChange({ ...currentFilter, tagCategory: 'industry', tagValue: value })}
                        >
                            <span>{value}</span> {/* TODO: Translate value if needed */}
                            <span className="count">{count as number}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="sidebar-section">
                <div className="sidebar-section-title">
                    <Filter size={12} style={{ marginRight: 4 }} />
                    {t('prompt.library.filter.intent')}
                </div>
                <div className="sidebar-menu">
                    {Object.entries(counts.intent).map(([value, count]) => (
                        <div
                            key={value}
                            className={`sidebar-menu-item ${currentFilter.tagCategory === 'intent' && currentFilter.tagValue === value ? 'active' : ''}`}
                            onClick={() => onFilterChange({ ...currentFilter, tagCategory: 'intent', tagValue: value })}
                        >
                            <span>{value}</span>
                            <span className="count">{count as number}</span>
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );
};
