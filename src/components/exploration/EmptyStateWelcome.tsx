import { useRef } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { UploadCloud, FileText, Sparkles } from 'lucide-react';
import { FileUploader, FileUploaderRef } from '@/components/data/FileUploader';
import { ParsedFileData } from '@/utils/fileParser';
import './EmptyStateWelcome.css';

interface EmptyStateWelcomeProps {
    onFilesUploaded: (files: ParsedFileData[], sampledFlags: boolean[]) => void;
}

/**
 * 首次使用欢迎界面 - 显示在页面中心
 * 集成了文件上传功能，点击按钮直接触发文件选择
 */
export function EmptyStateWelcome({ onFilesUploaded }: EmptyStateWelcomeProps) {
    const { t } = useI18n();
    const uploaderRef = useRef<FileUploaderRef>(null);

    const handleUploadClick = () => {
        uploaderRef.current?.triggerUpload();
    };

    return (
        <div className="empty-state-welcome">
            <div className="welcome-card">
                <div className="welcome-icon">
                    <Sparkles size={48} strokeWidth={1.5} />
                </div>

                <h1 className="welcome-title">
                    {t('welcome.title').replace('LiuliX', '').trim()}
                    <span className="liuli-brand">LiuliX</span>
                </h1>
                <p className="welcome-subtitle">{t('welcome.subtitle')}</p>

                <div className="welcome-features">
                    <div className="feature-item">
                        <UploadCloud size={20} />
                        <span>{t('welcome.feature1')}</span>
                    </div>
                    <div className="feature-item">
                        <FileText size={20} />
                        <span>{t('welcome.feature2')}</span>
                    </div>
                    <div className="feature-item">
                        <Sparkles size={20} />
                        <span>{t('welcome.feature3')}</span>
                    </div>
                </div>

                <button
                    className="btn-primary welcome-upload-btn"
                    onClick={handleUploadClick}
                >
                    <UploadCloud size={20} />
                    {t('welcome.uploadButton')}
                </button>

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
