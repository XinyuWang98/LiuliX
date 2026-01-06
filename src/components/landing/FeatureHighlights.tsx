import { useI18n } from '@/contexts/I18nContext';
import { Zap, ScrollText, FileOutput } from 'lucide-react';
import './FeatureHighlights.css';

/**
 * Feature Highlights 组件 - 价值展示层
 * 展示 LiuliX 相比传统工具的 3 大核心优势：零配置极速启动、秒级回溯、分析即报告
 * 使用交错图文布局（左右交替）
 */
export function FeatureHighlights() {
    const { t } = useI18n();

    return (
        <section className="feature-highlights">
            <h2 className="feature-highlights-title">
                {t('welcome.featureHighlights.sectionTitle')}
            </h2>

            {/* Feature A: 零配置极速启动 - 左侧视觉，右侧内容 */}
            <div className="highlight-item feature-layout-left">
                <div className="feature-visual">
                    <div className="feature-visual-icon">
                        <Zap size={32} />
                    </div>
                    <span className="feature-label">{t('welcome.featureHighlights.zeroSetup.label')}</span>
                </div>
                <div className="feature-content">
                    <h3>{t('welcome.featureHighlights.zeroSetup.title')}</h3>
                    <p>{t('welcome.featureHighlights.zeroSetup.desc')}</p>
                </div>
            </div>

            {/* Feature B: 秒级回溯 - 右侧视觉，左侧内容 */}
            <div className="highlight-item feature-layout-right">
                <div className="feature-content">
                    <h3>{t('welcome.featureHighlights.audit.title')}</h3>
                    <p>{t('welcome.featureHighlights.audit.desc')}</p>
                </div>
                <div className="feature-visual">
                    <div className="feature-visual-icon">
                        <ScrollText size={32} />
                    </div>
                    <span className="feature-label">{t('welcome.featureHighlights.audit.label')}</span>
                </div>
            </div>

            {/* Feature C: 分析即报告 - 左侧视觉，右侧内容 */}
            <div className="highlight-item feature-layout-left">
                <div className="feature-visual">
                    <div className="feature-visual-icon">
                        <FileOutput size={32} />
                    </div>
                    <span className="feature-label">{t('welcome.featureHighlights.report.label')}</span>
                </div>
                <div className="feature-content">
                    <h3>{t('welcome.featureHighlights.report.title')}</h3>
                    <p>{t('welcome.featureHighlights.report.desc')}</p>
                </div>
            </div>
        </section>
    );
}
