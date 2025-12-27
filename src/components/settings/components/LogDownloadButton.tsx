import { Download } from 'lucide-react';
import { logCapture } from '@/utils/logCapture';
import { useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';

/**
 * 开发者日志下载按钮组件
 */
export function LogDownloadButton() {
    const { t } = useI18n();

    // 自动启动日志捕捉
    useEffect(() => {
        if (import.meta.env.DEV) {
            logCapture.start();
        }
    }, []);

    const handleDownload = () => {
        logCapture.download('markdown');
        alert(t('settings.testLogDownloadSuccess') || '✅ Logs downloaded!');
    };

    return (
        <button
            onClick={handleDownload}
            className="btnSecondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
            <Download size={16} />
            {t('settings.testLogDownload')}
        </button>
    );
}

