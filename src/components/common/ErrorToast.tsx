import { AlertCircle, X } from 'lucide-react';
import { useEffect } from 'react';
import './ErrorToast.css';

interface ErrorToastAction {
    label: string;
    onClick: () => void;
}

interface ErrorToastProps {
    message: string;
    action?: ErrorToastAction;
    onClose: () => void;
    duration?: number; // 自动关闭时间（毫秒），0表示不自动关闭
}

/**
 * 错误提示Toast组件
 * 用于友好地显示错误信息和恢复操作
 */
export function ErrorToast({
    message,
    action,
    onClose,
    duration = 0
}: ErrorToastProps) {
    // 自动关闭逻辑
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    return (
        <div className="error-toast">
            <div className="error-toast__icon">
                <AlertCircle size={20} />
            </div>
            <div className="error-toast__content">
                <span className="error-toast__message">{message}</span>
                {action && (
                    <button
                        className="error-toast__action"
                        onClick={action.onClick}
                    >
                        {action.label}
                    </button>
                )}
            </div>
            <button className="error-toast__close" onClick={onClose}>
                <X size={16} />
            </button>
        </div>
    );
}
