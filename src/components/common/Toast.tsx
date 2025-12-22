/**
 * Toast通知组件
 * 统一的消息提示UI
 */

import React, { useEffect, useState } from 'react';
import './Toast.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number;
    onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
    message,
    type = 'info',
    duration = 3000,
    onClose
}) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                setVisible(false);
                onClose?.();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    if (!visible) return null;

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    return (
        <div className={`toast toast-${type}`}>
            <span className="toast-icon">{icons[type]}</span>
            <span className="toast-message">{message}</span>
            <button
                className="toast-close"
                onClick={() => {
                    setVisible(false);
                    onClose?.();
                }}
            >
                ×
            </button>
        </div>
    );
};

/**
 * Toast管理器
 * 用于全局显示Toast通知
 */
export class ToastManager {
    private static container: HTMLDivElement | null = null;
    private static toasts: Map<string, HTMLDivElement> = new Map();

    private static ensureContainer() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
        return this.container;
    }

    static show(message: string, type: ToastType = 'info', duration = 3000) {
        const container = this.ensureContainer();
        const id = `toast-${Date.now()}`;

        const toastDiv = document.createElement('div');
        toastDiv.id = id;
        container.appendChild(toastDiv);

        import('react-dom/client').then(({ createRoot }) => {
            const root = createRoot(toastDiv);
            root.render(
                <Toast
                    message={message}
                    type={type}
                    duration={duration}
                    onClose={() => {
                        root.unmount();
                        toastDiv.remove();
                        this.toasts.delete(id);
                    }}
                />
            );
        });

        this.toasts.set(id, toastDiv);
    }

    static success(message: string, duration?: number) {
        this.show(message, 'success', duration);
    }

    static error(message: string, duration?: number) {
        this.show(message, 'error', duration);
    }

    static warning(message: string, duration?: number) {
        this.show(message, 'warning', duration);
    }

    static info(message: string, duration?: number) {
        this.show(message, 'info', duration);
    }
}

// 导出单例方法
export const toast = ToastManager;
