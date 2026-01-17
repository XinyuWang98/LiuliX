import { useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import toast from 'react-hot-toast';

/**
 * 全局错误处理 Hook
 * 监听配额耗尽错误并显示用户友好的 toast 提示
 */
export function useGlobalErrorHandler() {
    const { t } = useI18n();

    useEffect(() => {
        // 监听未捕获的 Promise rejection
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            const error = event.reason;

            if (error?.message === 'QUOTA_EXHAUSTED') {
                event.preventDefault(); // 阻止默认错误处理

                // 显示自定义 toast
                showQuotaExhaustedToast(t);
            }
        };

        // 监听全局错误
        const handleError = (event: ErrorEvent) => {
            if (event.error?.message === 'QUOTA_EXHAUSTED') {
                event.preventDefault();
                showQuotaExhaustedToast(t);
            }
        };

        window.addEventListener('unhandledrejection', handleUnhandledRejection);
        window.addEventListener('error', handleError);

        return () => {
            window.removeEventListener('unhandledrejection', handleUnhandledRejection);
            window.removeEventListener('error', handleError);
        };
    }, [t]);
}

/**
 * 显示配额耗尽 Toast（包含两个按钮）
 */
function showQuotaExhaustedToast(t: (key: string) => string) {
    toast.error(
        t('common.quotaExhaustedMessage'),
        {
            duration: 15000, // 15秒
            icon: '⚠️',
            style: {
                minWidth: '400px',
                maxWidth: '500px',
                whiteSpace: 'pre-line' // 支持换行符
            }
        }
    );

    // 模拟按钮功能：显示确认对话框
    setTimeout(() => {
        const userChoice = confirm(`${t('common.quotaExhausted')}\n\n${t('common.quotaExhaustedMessage')}\n\n• 点击"确定"去 Discord 获取新邀请码\n• 点击"取消"返回首页`);

        if (userChoice) {
            // 去 Discord
            window.open('https://discord.gg/RnDvjtrs72', '_blank');
        } else {
            // 返回首页
            window.location.href = '/';
        }
    }, 1000);
}
