import './ExplorationHeader.css';

interface ExplorationHeaderProps {
    title: string;
    progress?: number;  // 可选的进度百分比 (0-100)
}

/**
 * 数据探索模块顶部标题栏
 * 与左右侧边栏的 SidebarHeader 保持样式一致
 */
export function ExplorationHeader({ title, progress }: ExplorationHeaderProps) {
    return (
        <div className="exploration-header-bar">
            <h2 className="exploration-title">{title}</h2>

            {/* 进度指示条（可选） */}
            {progress !== undefined && (
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </div>
    );
}
