import { useI18n } from '@/contexts/I18nContext';
import './WorkbenchSidebar.css';

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    isCollapsed: boolean;
    isExternal?: boolean;
    onClick: () => void;
}

/**
 * 工作台侧边栏导航项组件
 * - 支持展开/收起状态（仅显示图标 vs 图标+文字）
 * - 支持激活状态高亮
 * - 支持外部链接标记（Prompt库）
 */
export function NavItem({
    icon,
    label,
    isActive,
    isCollapsed,
    isExternal = false,
    onClick,
}: NavItemProps) {
    const { t } = useI18n();

    return (
        <button
            className={`workbench-nav-item ${isActive ? 'active' : ''} ${isExternal ? 'external' : ''}`}
            onClick={onClick}
            title={isCollapsed ? label : undefined}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
        >
            <span className="nav-icon">{icon}</span>
            {!isCollapsed && (
                <>
                    <span className="nav-label">{label}</span>
                    {isExternal && (
                        <span className="external-hint" title={t('workbench.external.hint')}>
                            →
                        </span>
                    )}
                </>
            )}
        </button>
    );
}
