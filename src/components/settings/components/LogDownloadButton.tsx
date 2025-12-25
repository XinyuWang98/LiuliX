import { Download } from 'lucide-react';
import { logCapture } from '@/utils/logCapture';
import { useEffect } from 'react';

/**
 * 开发者日志下载按钮组件
 */
export function LogDownloadButton() {
    // 自动启动日志捕捉
    useEffect(() => {
        if (import.meta.env.DEV) {
            logCapture.start();
        }
    }, []);

    const handleDownload = () => {
        logCapture.download('markdown');
        alert('✅ 日志已下载！\n\n文件格式: Markdown\n建议用途: 提交Issue、问题诊断');
    };

    return (
        <button
            onClick={handleDownload}
            className="btnSecondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
            <Download size={16} />
            下载测试日志
        </button>
    );
}
