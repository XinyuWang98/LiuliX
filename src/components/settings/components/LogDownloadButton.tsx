import { Download } from 'lucide-react';
import { logCapture } from '@/utils/logCapture';
import { useI18n } from '@/contexts/I18nContext';
import { toast } from '@/components/common/Toast';
import { EXTERNAL_LINKS } from '@/config/externalLinks';

/**
 * 开发者日志下载按钮组件
 */
export function LogDownloadButton() {
    const { t } = useI18n();

    const handleDownload = () => {
        logCapture.download('markdown');

        // 使用 Toast 提示用户
        toast.success(t('settings.testLogDownloadSuccess'), 5000);

        // 3秒后自动打开 Discord 链接
        setTimeout(() => {
            window.open(EXTERNAL_LINKS.discord.appRedirect, '_blank');
        }, 3000);
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

