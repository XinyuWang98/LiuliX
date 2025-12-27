import React from 'react';
import './InsightFocusMode.css';
import { useFocusMode } from '@/contexts/FocusModeContext';
import { TreeNavigator } from './TreeNavigator';
import { DetailPanel } from './DetailPanel';
import { EvidencePoolList } from '../evidence/EvidencePoolList';

/**
 * 洞察聚焦模式组件
 * 全屏沉浸式洞察详情查看器
 */

export const InsightFocusMode: React.FC = () => {
    const { focusedNode, exitFocusMode } = useFocusMode();

    if (!focusedNode) {
        return null; // 未聚焦时不渲染
    }

    // 阻止背景滚动
    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    // ESC键退出
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                exitFocusMode();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [exitFocusMode]);

    return (
        <div className="insight-focus-mode">
            {/* 顶部工具栏 */}
            <div className="insight-focus-mode__header">
                <button
                    className="insight-focus-mode__back-btn"
                    onClick={exitFocusMode}
                >
                    ← 返回
                </button>
                <div className="insight-focus-mode__title">
                    洞察详情
                </div>
                <button
                    className="insight-focus-mode__close-btn"
                    onClick={exitFocusMode}
                >
                    ×
                </button>
            </div>

            {/* 主内容区：左侧导航 + 右侧详情 + 证据池 */}
            <div className="insight-focus-mode__body">
                {/* 左侧树形导航 */}
                <aside className="insight-focus-mode__sidebar">
                    <TreeNavigator />
                </aside>

                {/* 右侧详情面板 */}
                <main className="insight-focus-mode__main">
                    <DetailPanel node={focusedNode} />
                </main>

                {/* 右侧证据池 */}
                <aside className="insight-focus-mode__evidence">
                    <EvidencePoolList />
                </aside>
            </div>
        </div>
    );
};
