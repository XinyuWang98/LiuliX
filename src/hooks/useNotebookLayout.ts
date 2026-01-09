/**
 * Notebook布局管理Hook
 * 负责:
 * - Notebook显示/隐藏状态
 * - Notebook宽度调整
 * - 拖拽交互
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { getCurrentRoleConfig } from '@/config/userRolePresets';

export function useNotebookLayout(externalShowNotebook?: boolean) {
    const roleConfig = getCurrentRoleConfig();

    // Notebook 显示/隐藏状态
    // 优先级: 外部prop > 用户手动设置 > 角色配置
    const [internalShowNotebook, setInternalShowNotebook] = useState(() => {
        if (externalShowNotebook !== undefined) return externalShowNotebook;

        const userPreference = localStorage.getItem('insights_notebook_manual');
        if (userPreference !== null) {
            return userPreference === 'true';
        }

        const showCode = localStorage.getItem('insights_show_code');
        return showCode === 'true' || (showCode === null && roleConfig.insights.showCode);
    });

    const showNotebook = externalShowNotebook !== undefined ? externalShowNotebook : internalShowNotebook;
    
    const setShowNotebook = (value: boolean) => {
        setInternalShowNotebook(value);
        // 保存用户手动偏好
        localStorage.setItem('insights_notebook_manual', String(value));
    };

    // Notebook 宽度状态 (默认50%)
    const [notebookWidthPercent, setNotebookWidthPercent] = useState(() => {
        const saved = localStorage.getItem('insightFlow.notebookWidth');
        return saved ? parseFloat(saved) : 50;
    });

    // 拖拽状态
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // 保存用户偏好
    useEffect(() => {
        localStorage.setItem('insightFlow.showNotebook', showNotebook.toString());
    }, [showNotebook]);

    useEffect(() => {
        localStorage.setItem('insightFlow.notebookWidth', notebookWidthPercent.toString());
    }, [notebookWidthPercent]);

    // 拖拽处理
    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';
    }, []);

    const handleResizeEnd = useCallback(() => {
        setIsResizing(false);
        document.body.style.cursor = 'default';
        document.body.style.userSelect = '';
    }, []);

    const handleResize = useCallback((e: MouseEvent) => {
        if (!isResizing || !containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const offsetX = e.clientX - containerRect.left;

        // 计算右侧Notebook的宽度百分比
        const newPercent = ((containerWidth - offsetX) / containerWidth) * 100;
        // 限制范围: 25% ~ 75%
        const clampedPercent = Math.max(25, Math.min(75, newPercent));
        setNotebookWidthPercent(clampedPercent);
    }, [isResizing]);

    // 全局事件监听
    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleResize);
            window.addEventListener('mouseup', handleResizeEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleResize);
            window.removeEventListener('mouseup', handleResizeEnd);
        };
    }, [isResizing, handleResize, handleResizeEnd]);

    return {
        showNotebook,
        setShowNotebook,
        notebookWidthPercent,
        isResizing,
        containerRef,
        handleResizeStart
    };
}
