import { useState, useEffect } from 'react';
import { FolderOpen, Database, Lightbulb, FileText, BookOpen, Menu, Settings } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { Logo } from '@/components/common/Logo/Logo';
import { FreeTrialBadge } from '@/components/Header/FreeTrialBadge';
import { NavItem } from './NavItem';
import { logger } from '@/utils/logger';
import './WorkbenchSidebar.css';

export type WorkbenchSection = 'project-selection' | 'cleaning' | 'insights' | 'report';

interface WorkbenchSidebarProps {
    selectedSection: WorkbenchSection;
    onSectionChange: (section: WorkbenchSection) => void;
    projectCount?: number;
    backendStatus?: 'connected' | 'disconnected' | 'checking';
    onOpenAPISettings?: () => void;
}

/**
 * 工作台 Kaggle 式侧边栏
 * - 可展开/收起（64px <-> 240px）
 * - Logo 点击跳转欢迎页
 * - 状态栏显示后端状态 + 免费额度
 * - Prompt库和设置新标签页/弹窗打开
 * - 状态持久化到 localStorage
 */
export function WorkbenchSidebar({
    selectedSection,
    onSectionChange,
    onOpenAPISettings,
}: WorkbenchSidebarProps) {
    const { t } = useI18n();
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const stored = localStorage.getItem('workbench.sidebarCollapsed');
        return stored === 'true';
    });

    const [useLocalModel, setUseLocalModel] = useState(() => {
        return localStorage.getItem('use_local_model') === 'true';
    });

    // 持久化收起状态
    useEffect(() => {
        localStorage.setItem('workbench.sidebarCollapsed', String(isCollapsed));
        logger.log('UI', `侧边栏${isCollapsed ? '收起' : '展开'}`);
    }, [isCollapsed]);

    // 监听本地模型设置变化
    useEffect(() => {
        const handleStorageChange = () => {
            setUseLocalModel(localStorage.getItem('use_local_model') === 'true');
        };
        window.addEventListener('storage', handleStorageChange);
        // 设置页修改后手动触发（同页面）
        const interval = setInterval(handleStorageChange, 1000);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, []);

    // Logo 点击跳转欢迎页
    const handleLogoClick = () => {
        logger.log('UI', '点击Logo，跳转欢迎页');
        window.history.pushState(null, '', '/welcome');
        window.dispatchEvent(new PopStateEvent('popstate'));
    };

    // Prompt库新标签页打开
    const handlePromptLibraryClick = () => {
        logger.log('UI', 'Prompt库新标签页打开');
        window.open('/prompts', '_blank');
    };

    // 设置按钮点击
    const handleSettingsClick = () => {
        logger.log('UI', '打开设置弹窗');
        onOpenAPISettings?.();
    };

    // 切换收起/展开
    const toggleSidebar = () => {
        setIsCollapsed(prev => !prev);
    };

    // 模型状态文字和颜色
    const getStatusInfo = () => {
        if (useLocalModel) {
            return {
                color: 'var(--success)',
                text: t('workbench.localModel'),
                glow: '0 0 8px var(--success)'
            };
        } else {
            return {
                color: 'var(--accent)',
                text: t('workbench.apiModel'),
                glow: '0 0 8px var(--accent)'
            };
        }
    };

    const statusInfo = getStatusInfo();

    return (
        <aside
            className={`workbench-sidebar liuli-glass ${isCollapsed ? 'collapsed' : 'expanded'}`}
            aria-label={t('workbench.toggleSidebar')}
        >
            {/* Logo 区域 */}
            <div
                className="sidebar-logo-area"
                onClick={handleLogoClick}
                role="button"
                tabIndex={0}
                aria-label={t('workbench.backToWelcome')}
                title={t('workbench.backToWelcome')}
            >
                <Logo
                    size="l"  /* F-16: 调整为大号 */
                    variant="flow"
                    layout="horizontal"
                    showText={!isCollapsed}
                />
            </div>

            {/* 状态栏：模型类型 + 免费额度 */}
            <div className="sidebar-status-bar">
                <div
                    className="backend-status"
                    title={statusInfo.text}
                />
                {!isCollapsed && (
                    <>
                        <span className="status-text">{statusInfo.text}</span>
                        <FreeTrialBadge />
                    </>
                )}
            </div>

            {/* 展开/收起按钮 */}
            <button
                className="sidebar-toggle-btn"
                onClick={toggleSidebar}
                aria-label={t('workbench.toggleSidebar')}
                title={t('workbench.toggleSidebar')}
            >
                <Menu size={20} />
            </button>

            {/* 导航项列表 */}
            <nav className="sidebar-nav">
                <NavItem
                    icon={<FolderOpen size={20} />}
                    label={t('workbench.projectSelection')}
                    isActive={selectedSection === 'project-selection'}
                    isCollapsed={isCollapsed}
                    onClick={() => onSectionChange('project-selection')}
                />
                <NavItem
                    icon={<Database size={20} />}
                    label={t('workbench.cleaning')}
                    isActive={selectedSection === 'cleaning'}
                    isCollapsed={isCollapsed}
                    onClick={() => onSectionChange('cleaning')}
                />
                <NavItem
                    icon={<Lightbulb size={20} />}
                    label={t('workbench.insights')}
                    isActive={selectedSection === 'insights'}
                    isCollapsed={isCollapsed}
                    onClick={() => onSectionChange('insights')}
                />
                <NavItem
                    icon={<FileText size={20} />}
                    label={t('workbench.report')}
                    isActive={selectedSection === 'report'}
                    isCollapsed={isCollapsed}
                    onClick={() => onSectionChange('report')}
                />
            </nav>

            {/* 底部工具区：Prompt库 + 设置 */}
            <div className="sidebar-footer">
                <NavItem
                    icon={<BookOpen size={20} />}
                    label={t('workbench.promptLibrary')}
                    isActive={false}
                    isCollapsed={isCollapsed}
                    isExternal
                    onClick={handlePromptLibraryClick}
                />
                <NavItem
                    icon={<Settings size={20} />}
                    label={t('nav.settings')}
                    isActive={false}
                    isCollapsed={isCollapsed}
                    onClick={handleSettingsClick}
                />
            </div>
        </aside>
    );
}
