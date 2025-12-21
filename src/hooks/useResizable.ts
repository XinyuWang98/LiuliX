import { useState, useCallback, useEffect } from 'react';

interface UseResizableProps {
    initialWidth: number;
    minWidth?: number;
    maxWidth?: number;
    direction?: 'left' | 'right';
    storageKey?: string;
}

export function useResizable({
    initialWidth,
    minWidth = 200,
    maxWidth = 600,
    direction = 'right',
    storageKey
}: UseResizableProps) {
    const [width, setWidth] = useState(() => {
        if (storageKey) {
            const saved = localStorage.getItem(storageKey);
            if (saved) return parseInt(saved, 10);
        }
        return initialWidth;
    });
    const [isResizing, setIsResizing] = useState(false);

    const startResizing = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    const stopResizing = useCallback(() => {
        setIsResizing(false);
        document.body.style.cursor = 'default';
        document.body.style.userSelect = '';
        if (storageKey) {
            localStorage.setItem(storageKey, width.toString());
        }
    }, [storageKey, width]);

    const resize = useCallback((e: MouseEvent) => {
        if (isResizing) {
            let newWidth;
            if (direction === 'right') {
                // Resize from left side (e.g., LeftSidebar)
                // Width is determined by mouse X relative to left edge (assumed 0)
                // Adjust this logic if sidebar is not at screen edge
                newWidth = e.clientX;
            } else {
                // Resize from right side (e.g., RightSidebar)
                // Width is distance from right edge
                newWidth = window.innerWidth - e.clientX;
            }

            if (newWidth >= minWidth && newWidth <= maxWidth) {
                setWidth(newWidth);
            }
        }
    }, [isResizing, minWidth, maxWidth, direction]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
        }

        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizing, resize, stopResizing]);

    return { width, startResizing, isResizing };
}
