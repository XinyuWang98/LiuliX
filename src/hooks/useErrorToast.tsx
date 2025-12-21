import { useState, useCallback } from 'react';
import { ErrorToast } from '../components/common/ErrorToast';
import { createRoot } from 'react-dom/client';

interface ErrorToastOptions {
    message: string;
    actionLabel?: string;
    onAction?: () => void;
    duration?: number;
}

/**
 * ErrorToast使用Hook
 * 提供简便的错误提示显示方法
 */
export function useErrorToast() {
    const [toastElement, setToastElement] = useState<HTMLDivElement | null>(null);

    const showError = useCallback((options: ErrorToastOptions) => {
        // 移除已有toast
        if (toastElement) {
            document.body.removeChild(toastElement);
        }

        // 创建新toast容器
        const container = document.createElement('div');
        document.body.appendChild(container);
        setToastElement(container);

        const root = createRoot(container);

        const handleClose = () => {
            root.unmount();
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
            setToastElement(null);
        };

        root.render(
            <ErrorToast
                message={options.message}
                action={options.actionLabel && options.onAction ? {
                    label: options.actionLabel,
                    onClick: () => {
                        options.onAction?.();
                        handleClose();
                    }
                } : undefined}
                onClose={handleClose}
                duration={options.duration}
            />
        );
    }, [toastElement]);

    return { showError };
}
