import './ExplorationHeader.css';

interface ExplorationHeaderProps {
    title: string;
}

/**
 * 数据探索模块顶部标题栏
 * 与左右侧边栏的 SidebarHeader 保持样式一致
 */
export function ExplorationHeader({ title }: ExplorationHeaderProps) {
    return (
        <div className="exploration-header-bar">
            <h2 className="exploration-title">{title}</h2>
        </div>
    );
}
