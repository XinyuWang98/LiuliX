import { Logo } from '../Logo/Logo';
import { useI18n } from '@/contexts/I18nContext';
import './LoadingScreen.css';

interface LoadingScreenProps {
    progress: number;
    message: string;
}

/**
 * LoadingScreen - 加载页面组件
 * 用于 Pyodide 初始化时显示进度
 */
export function LoadingScreen({ progress, message }: LoadingScreenProps) {
    const { t } = useI18n();
    return (
        <div className="loading-screen">
            <Logo layout="vertical" size="l" variant="flow" />
            <div className="loading-status">
                <p className="loading-text">
                    {message || t('common.initializing')}
                </p>
                {progress > 0 && (
                    <div className="loading-progress-container">
                        <span className="loading-progress-percent">{Math.round(progress)}%</span>
                    </div>
                )}
            </div>
        </div>
    );
}
