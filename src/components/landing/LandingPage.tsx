import { useRef } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { UploadCloud, Lock, Shield, BrainCircuit } from 'lucide-react';
import { FileUploader, FileUploaderRef } from '@/components/data/FileUploader';
import { Logo } from '@/components/common/Logo/Logo';
import { TrustBadges } from './TrustBadges';
import { FeatureHighlights } from './FeatureHighlights';
import { Roadmap } from './Roadmap';
import { FeedbackSection } from './FeedbackSection';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import './LandingPage.css';
import '@/components/exploration/EmptyStateWelcome.css';
import '@/styles/scrollAnimations.css';

interface LandingPageProps {
    onFilesUploaded: (files: any[], sampledFlags: boolean[]) => void;
}

export function LandingPage({ onFilesUploaded }: LandingPageProps) {
    const { t } = useI18n();
    const uploaderRef = useRef<FileUploaderRef>(null);

    // 滚动动画Hooks
    const [cardsRef, cardsVisible] = useScrollAnimation(0.1);
    const [highlightsRef, highlightsVisible] = useScrollAnimation(0.1);
    const [roadmapRef, roadmapVisible] = useScrollAnimation(0.1);
    const [feedbackRef, feedbackVisible] = useScrollAnimation(0.1);

    const handleStartClick = () => {
        uploaderRef.current?.triggerUpload();
    };

    return (
        <div className="landing-page-container">
            {/* Header Removed - Using Global NavigationBar */}

            {/* Main Content */}
            <main className="landing-content">
                {/* Hero Section - 首屏 */}
                <div
                    className="hero-section hero-centered"
                    style={{
                        minHeight: '85vh',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        marginBottom: '80px'
                    }}
                    data-layout-fix="true"
                >
                    {/* 品牌 Logo - 添加到标题上方 */}
                    <div className="hero-logo">
                        <Logo layout="horizontal" size="xl" showText={true} />
                    </div>

                    {/* Hero Slogan - 更新为新文案 */}
                    <h1 className="hero-slogan">
                        {t('welcome.hero.title')}
                    </h1>
                    <p className="hero-subtitle">
                        {t('welcome.hero.subtitle')}
                    </p>

                    {/* CTA 按钮 */}
                    <button className="welcome-upload-btn hero-action-btn" onClick={handleStartClick}>
                        <UploadCloud size={20} />
                        {t('welcome.hero.uploadButton')}
                    </button>

                    {/* Trust Badges - 新增信任徽章 */}
                    <TrustBadges />
                </div>

                {/* Trust & Safety Cards - 信任层 */}
                <div
                    ref={cardsRef}
                    className={`features-grid scroll-fade-up ${cardsVisible ? 'animate' : ''}`}
                >
                    {/* 数据隐形衣 */}
                    <div className="landing-feature-card">
                        <div className="feature-icon-box">
                            <Lock size={24} />
                        </div>
                        <h3>{t('welcome.valueProps.privacy.title')}</h3>
                        <p>{t('welcome.valueProps.privacy.desc')}</p>
                    </div>

                    {/* 先预演再执行 */}
                    <div className="landing-feature-card">
                        <div className="feature-icon-box">
                            <Shield size={24} />
                        </div>
                        <h3>{t('welcome.valueProps.safety.title')}</h3>
                        <p>{t('welcome.valueProps.safety.desc')}</p>
                    </div>

                    {/* 听话的超级实习生 */}
                    <div className="landing-feature-card">
                        <div className="feature-icon-box">
                            <BrainCircuit size={24} />
                        </div>
                        <h3>{t('welcome.valueProps.control.title')}</h3>
                        <p>{t('welcome.valueProps.control.desc')}</p>
                    </div>
                </div>

                {/* Feature Highlights - 价值展示层 */}
                <div ref={highlightsRef} className={`section-wrapper scroll-fade-up ${highlightsVisible ? 'animate' : ''}`}>
                    <FeatureHighlights />
                </div>

                {/* Roadmap - 产品路线图 (P2) */}
                <div ref={roadmapRef} className={`section-wrapper scroll-fade-up ${roadmapVisible ? 'animate' : ''}`}>
                    <Roadmap />
                </div>

                {/* Feedback - 用户反馈区域 (P3) */}
                <div ref={feedbackRef} className={`section-wrapper scroll-fade-up ${feedbackVisible ? 'animate' : ''}`}>
                    <FeedbackSection />
                </div>
            </main>

            {/* Hidden Uploader */}
            <div style={{ display: 'none' }}>
                <FileUploader ref={uploaderRef} onFilesUploaded={onFilesUploaded} />
            </div>
        </div>
    );
}
