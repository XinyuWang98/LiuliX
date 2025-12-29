import React, { useRef } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { Logo } from '@/components/common/Logo/Logo';
import { UploadCloud, Sparkles, Search, Command, ShieldCheck, BrainCircuit, FileSearch } from 'lucide-react';
import { FileUploader, FileUploaderRef } from '@/components/data/FileUploader';
import './LandingPage.css';
import '@/components/exploration/EmptyStateWelcome.css';

interface LandingPageProps {
    onFilesUploaded: (files: any[], sampledFlags: boolean[]) => void;
}

export function LandingPage({ onFilesUploaded }: LandingPageProps) {
    const { t } = useI18n();
    const uploaderRef = useRef<FileUploaderRef>(null);

    const handleStartClick = () => {
        uploaderRef.current?.triggerUpload();
    };

    return (
        <div className="landing-page-container">
            {/* Header Removed - Using Global NavigationBar */}

            {/* Main Content */}
            <main className="landing-content">
                <div className="hero-section">
                    <h1 className="hero-slogan">
                        {t('welcome.heroTitle')}
                    </h1>
                    <p className="hero-subtitle">
                        {t('welcome.heroSubtitle')}
                    </p>

                    <button className="welcome-upload-btn hero-action-btn" onClick={handleStartClick}>
                        <UploadCloud size={20} />
                        {t('welcome.uploadButton')}
                    </button>
                </div>

                <div className="features-grid">
                    <div className="landing-feature-card">
                        <div className="feature-icon-box">
                            <ShieldCheck size={24} />
                        </div>
                        <h3>{t('welcome.feature1').split('\n')[0]}</h3>
                        <p>{t('welcome.feature1').split('\n')[1] || '本地隐私安全'}</p>
                    </div>

                    <div className="landing-feature-card">
                        <div className="feature-icon-box">
                            <BrainCircuit size={24} />
                        </div>
                        <h3>{t('welcome.feature2').split('\n')[0]}</h3>
                        <p>{t('welcome.feature2').split('\n')[1] || '专家大脑引擎'}</p>
                    </div>

                    <div className="landing-feature-card">
                        <div className="feature-icon-box">
                            <FileSearch size={24} />
                        </div>
                        <h3>{t('welcome.feature3').split('\n')[0]}</h3>
                        <p>{t('welcome.feature3').split('\n')[1] || '白盒化可追溯'}</p>
                    </div>
                </div>
            </main>

            {/* Hidden Uploader */}
            <div style={{ display: 'none' }}>
                <FileUploader ref={uploaderRef} onFilesUploaded={onFilesUploaded} />
            </div>
        </div>
    );
}
