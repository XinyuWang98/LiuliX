import React, { useMemo } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { promptRegistry } from '@/services/promptRegistry';
import { PromptFilter } from '@/types/prompt';
import { BookOpen, Sparkles, Database, Filter } from 'lucide-react';
import { LiuliGlass } from '@/components/common/liulix/LiuliGlass';
import { LiuliButton } from '@/components/common/liulix/LiuliButton';
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

    const isAllActive = !currentFilter.tagValue;
    const isCleaningActive = currentFilter.tagValue === 'cleaning';
    const isAnalysisActive = false; // Add logic if needed

    return (
        <LiuliGlass className="library-sidebar" variant="vignette">
            {/* 核心分类 */}
            <div className="sidebar-section">
                <div className="sidebar-section-title">{t('prompt.library.filter.all')}</div>
                <div className="sidebar-menu">
                    <LiuliButton
                        variant={isAllActive ? 'secondary' : 'ghost'}
                        className={`sidebar-menu-btn ${isAllActive ? 'active' : ''}`}
                        onClick={() => handleCategoryClick('all')}
                        leftIcon={<BookOpen size={16} />}
                    >
                        <span className="menu-label">{t('prompt.sidebar.all')}</span>
                    </LiuliButton>

                    <LiuliButton
                        variant={isCleaningActive ? 'secondary' : 'ghost'}
                        className={`sidebar-menu-btn ${isCleaningActive ? 'active' : ''}`}
                        onClick={() => handleCategoryClick('cleaning')}
                        leftIcon={<Database size={16} />}
                    >
                        <span className="menu-label">{t('prompt.sidebar.cleaning')}</span>
                        <span className="menu-count">{counts.cleaning.all || 0}</span>
                    </LiuliButton>

                    <LiuliButton
                        variant={isAnalysisActive ? 'secondary' : 'ghost'}
                        className={`sidebar-menu-btn ${isAnalysisActive ? 'active' : ''}`}
                        onClick={() => handleCategoryClick('analysis')}
                        leftIcon={<Sparkles size={16} />}
                    >
                        <span className="menu-label">{t('prompt.sidebar.analysis')}</span>
                        <span className="menu-count">{counts.analysis.all || 0}</span>
                    </LiuliButton>
                </div>
            </div>

            <div className="sidebar-divider" />

            {/* 维度筛选 (Faceted Filters) */}
            <div className="sidebar-section">
                <div className="sidebar-section-title">
                    <Filter size={12} style={{ marginRight: 4 }} />
                    {t('prompt.library.filter.industry')}
                </div>
                <div className="sidebar-menu">
                    {Object.entries(counts.industry).map(([value, count]) => {
                        const isActive = currentFilter.tagCategory === 'industry' && currentFilter.tagValue === value;
                        return (
                            <LiuliButton
                                key={value}
                                variant={isActive ? 'secondary' : 'ghost'}
                                className={`sidebar-menu-btn ${isActive ? 'active' : ''}`}
                                onClick={() => onFilterChange({ ...currentFilter, tagCategory: 'industry', tagValue: value })}
                            >
                                <span className="menu-label">{t(`prompt.library.tags.industry.${value}`, { defaultValue: value })}</span>
                                <span className="menu-count">{count as number}</span>
                            </LiuliButton>
                        );
                    })}
                </div>
            </div>

            <div className="sidebar-section">
                <div className="sidebar-section-title">
                    <Filter size={12} style={{ marginRight: 4 }} />
                    {t('prompt.library.filter.intent')}
                </div>
                <div className="sidebar-menu">
                    {Object.entries(counts.intent).map(([value, count]) => {
                        const isActive = currentFilter.tagCategory === 'intent' && currentFilter.tagValue === value;
                        return (
                            <LiuliButton
                                key={value}
                                variant={isActive ? 'secondary' : 'ghost'}
                                className={`sidebar-menu-btn ${isActive ? 'active' : ''}`}
                                onClick={() => onFilterChange({ ...currentFilter, tagCategory: 'intent', tagValue: value })}
                            >
                                <span className="menu-label">{t(`prompt.library.tags.intent.${value}`, { defaultValue: value })}</span>
                                <span className="menu-count">{count as number}</span>
                            </LiuliButton>
                        );
                    })}
                </div>
            </div>
        </LiuliGlass>
    );
};
