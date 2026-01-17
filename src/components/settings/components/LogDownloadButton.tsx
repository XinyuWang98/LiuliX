import { Download } from 'lucide-react';
import { logCapture } from '@/utils/logCapture';
import { useI18n } from '@/contexts/I18nContext';

/**
 * 开发者日志下载按钮组件
 */
export function LogDownloadButton() {
    const { t } = useI18n();

    const handleDownload = () => {
        logCapture.download('markdown');

        // 弹出确认提示
        const userConfirmed = confirm(t('settings.testLogDownloadSuccess'));

        // 用户点击"确定"后自动跳转到 Discord
        if (userConfirmed) {
            window.open('https://discord.gg/RnDvjtrs72', '_blank');
        }
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

