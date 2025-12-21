/**
 * 本地模型加载进度 UI 组件
 */
import { useEffect, useState } from 'react';
import { localLLMService } from '@/services/localLLMService';
import { Loader } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';

interface LocalModelProgressProps {
    isLoading: boolean;
}

export function LocalModelProgress({ isLoading }: LocalModelProgressProps) {
    const { t } = useI18n();
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState(t('localModel.init'));

    useEffect(() => {
        if (!isLoading) return;

        // 设置进度回调
        localLLMService.setProgressCallback((prog, msg) => {
            setProgress(prog);
            setMessage(translateMessage(msg, t));
        });

        return () => {
            localLLMService.setProgressCallback(() => { });
        };
    }, [isLoading, t]);

    /**
     * 翻译 WebLLM 的进度消息
     */
    const translateMessage = (msg: string, t: any): string => {
        if (!msg) return t('localModel.status.loading');

        // Fetching param cache[1/88]: 33MB fetched...
        if (msg.includes('Fetching param cache')) {
            const match = msg.match(/\[(\d+)\/(\d+)\]/);
            const progressInfo = match ? `[${match[1]}/${match[2]}]` : '';
            return t('localModel.status.fetching').replace('{progress}', progressInfo);
        }

        // Loading model from cache...
        if (msg.includes('Loading model')) {
            return t('localModel.status.loading');
        }

        // Processing model weights...
        if (msg.includes('Processing model weights') || msg.includes('Finish loading')) {
            return t('localModel.status.processing');
        }

        // Engine ready
        if (msg.includes('Engine ready') || msg.includes('Model loaded')) {
            return t('localModel.status.ready');
        }

        return msg; // 默认或者已经是中文的直接返回
    };

    if (!isLoading) return null;

    return (
        <div style={{
            textAlign: 'center',
            padding: 'var(--gap-xl)',
            color: 'var(--text-secondary)'
        }}>
            <Loader size={32} className="spinning" style={{ margin: '0 auto' }} />

            {/* 进度条 */}
            <div style={{
                marginTop: 'var(--gap-m)',
                width: '100%',
                height: '8px',
                backgroundColor: 'var(--bg-hover)',
                borderRadius: 'var(--radius-s)',
                overflow: 'hidden',
            }}>
                <div style={{
                    width: `${progress}%`,
                    height: '100%',
                    backgroundColor: 'var(--primary)',
                    transition: 'width 0.3s',
                }} />
            </div>

            {/* 进度信息 */}
            <p style={{ marginTop: 'var(--gap-s)', fontSize: 'var(--fs-s)' }}>
                {message}
            </p>
            <p style={{
                marginTop: 'var(--gap-xs)',
                fontSize: 'var(--fs-xs)',
                color: 'var(--text-tertiary)',
            }}>
                {Math.round(progress)}%
            </p>

            {/* 首次下载提示 */}
            {progress < 10 && (
                <p style={{
                    marginTop: 'var(--gap-m)',
                    fontSize: 'var(--fs-xs)',
                    color: 'var(--warning)',
                    padding: 'var(--gap-s)',
                    backgroundColor: 'rgba(var(--warning-rgb), 0.1)',
                    borderRadius: 'var(--radius-s)',
                }}>
                    {t('localModel.downloadHint')}
                </p>
            )}
        </div>
    );
}
