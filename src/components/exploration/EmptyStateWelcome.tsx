import { useRef, useState, useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { UploadCloud, Search, Sparkles } from 'lucide-react';
import { FileUploader, FileUploaderRef } from '@/components/data/FileUploader';
import { ParsedFileData } from '@/utils/fileParser';
import { Logo } from '@/components/common/Logo/Logo';
import { getFileSizeLimit } from '@/utils/resourceLimits';
import { formatFileSize } from '@/utils/formatters';
import './EmptyStateWelcome.css';

interface EmptyStateWelcomeProps {
    onFilesUploaded: (files: ParsedFileData[], sampledFlags: boolean[]) => void;
}

/**
 * 首次使用欢迎界面 v2.0
 * 优化视觉层级，增强 Glassmorphism 质感
 */
export function EmptyStateWelcome({ onFilesUploaded }: EmptyStateWelcomeProps) {
    const { t } = useI18n();
    const uploaderRef = useRef<FileUploaderRef>(null);
    const [fileSizeLimit, setFileSizeLimit] = useState<string>('');

    // 动态获取文件大小限制
    useEffect(() => {
        const limit = getFileSizeLimit();
        setFileSizeLimit(formatFileSize(limit));
    }, []);

    const handleUploadClick = () => {
        uploaderRef.current?.triggerUpload();
    };

    return (
        <div className="empty-state-welcome">
            <div className="welcome-card">
                {/* 顶部：品牌展示 */}
                <div className="welcome-header">
                    <span className="welcome-prefix">{t('welcome.prefix')}</span>
                    {/* 使用 Glass 变体 Logo，启用流光动效 */}
                    <Logo layout="horizontal" size="xl" showText={true} variant="glass" />
                </div>

                {/* 副标题 */}
                <p className="welcome-subtitle">{t('welcome.subtitle')}</p>

                {/* 特性展示区 - 图标强调模式 */}
                <div className="welcome-features">
                    <div className="feature-item">
                        <div className="feature-icon-wrapper">
                            <UploadCloud size={28} strokeWidth={1.5} />
                        </div>
                        <span>{t('welcome.feature1')}</span>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon-wrapper">
                            <Search size={28} strokeWidth={1.5} />
                        </div>
                        <span>{t('welcome.feature2')}</span>
                    </div>
                    <div className="feature-item">
                        <div className="feature-icon-wrapper">
                            <Sparkles size={28} strokeWidth={1.5} />
                        </div>
                        <span>{t('welcome.feature3')}</span>
                    </div>
                </div>

                {/* 核心行动按钮 */}
                <button
                    className="welcome-upload-btn"
                    onClick={handleUploadClick}
                >
                    <UploadCloud size={20} />
                    {t('welcome.uploadButton')}
                </button>

                {/* 文件限制提示 */}
                {fileSizeLimit && (
                    <div style={{
                        textAlign: 'center',
                        fontSize: 'var(--fs-xs)',
                        color: 'var(--text-secondary)',
                        marginTop: 'var(--gap-s)',
                        lineHeight: 1.6
                    }}>
                        <div>{t('fileUpload.supportedFormatsWithLimit', { limit: fileSizeLimit })}</div>
                        <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>                            {t('fileUpload.deviceAdaptive')}
                        </div>
                    </div>
                )}

                {/* 隐藏的文件上传器 - 负责实际的文件处理 */}
                <div style={{ display: 'none' }}>
                    <FileUploader
                        ref={uploaderRef}
                        onFilesUploaded={onFilesUploaded}
                    />
                </div>
            </div>
        </div>
    );
}
