import React from 'react';
import { Sparkles, TrendingUp, Lightbulb, Target } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { Project } from '../../utils/projectUtils';
import './AIWorkshopTools.css';

interface AIWorkshopToolsProps {
    project: Project | null;
    onToolClick?: (toolId: string) => void;
}

// 图标尺寸常量
const ICON_SIZE = 24; // 工具卡片图标尺寸

export const AIWorkshopTools: React.FC<AIWorkshopToolsProps> = ({ project, onToolClick }) => {
    const { t, language } = useI18n();

    // 调试i18n
    console.log('=== AIWorkshopTools i18n调试 ===');
    console.log('language.translations.workshop:', language.translations.workshop);
    console.log('language.translations.workshop.tools:', language.translations.workshop?.tools);

    const tools = [
        {
            id: 'cleaning',
            icon: <Sparkles size={ICON_SIZE} />,
            title: t('workshop.tools.cleaning.title'),
            description: t('workshop.tools.cleaning.desc'),
            action: t('workshop.tools.cleaning.action'),
            available: !!project,
        },
        {
            id: 'exploration',
            icon: <TrendingUp size={ICON_SIZE} />,
            title: t('workshop.tools.exploration.title'),
            description: t('workshop.tools.exploration.desc'),
            action: t('workshop.tools.exploration.action'),
            available: !!project,
        },
        {
            id: 'hypothesis',
            icon: <Lightbulb size={ICON_SIZE} />,
            title: t('workshop.tools.hypothesis.title'),
            description: t('workshop.tools.hypothesis.desc'),
            action: t('workshop.tools.hypothesis.action'),
            available: !!project,
        },
        {
            id: 'suggestions',
            icon: <Target size={ICON_SIZE} />,
            title: t('workshop.tools.suggestions.title'),
            description: t('workshop.tools.suggestions.desc'),
            action: t('workshop.tools.suggestions.action'),
            available: !!project,
        },
    ];

    const handleToolClick = (toolId: string) => {
        console.log(`工坊工具被点击: ${toolId}`);
        if (onToolClick) {
            onToolClick(toolId);
        }
        // TODO: 实现具体的工具逻辑
    };

    return (
        <div className="workshopTools">
            {tools.map(tool => (
                <div key={tool.id} className={`toolCard ${!tool.available ? 'disabled' : ''}`}>
                    <div className="toolIcon">{tool.icon}</div>
                    <div className="toolContent">
                        <h3 className="toolTitle">{tool.title}</h3>
                        <p className="toolDesc">{tool.description}</p>
                    </div>
                    <button
                        className="toolButton"
                        onClick={() => handleToolClick(tool.id)}
                        disabled={!tool.available}
                    >
                        {tool.action}
                    </button>
                </div>
            ))}
        </div>
    );
};
