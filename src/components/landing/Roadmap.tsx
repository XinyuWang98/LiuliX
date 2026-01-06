import { useI18n } from '@/contexts/I18nContext';
import { CheckCircle, Rocket, Sparkles } from 'lucide-react';
import './Roadmap.css';

/**
 * Roadmap 组件 - 产品路线图
 * 展示 LiuliX 的产品演进计划：V1.0（当前）/ V1.5（下一步）/ V2.0（未来）
 */
export function Roadmap() {
    const { t } = useI18n();

    return (
        <section className="roadmap-section">
            <h2 className="roadmap-title">
                {t('welcome.roadmap.sectionTitle')}
            </h2>
            <p className="roadmap-description">
                {t('welcome.roadmap.sectionDescription')}
            </p>

            <div className="roadmap-timeline">
                {/* V1.0 - Current */}
                <div className="roadmap-card-container roadmap-current">
                    <div className="roadmap-card-container-body">
                        <div className="roadmap-header">
                            <div className="roadmap-version-badge current-badge">
                                <CheckCircle size={16} />
                                <span>{t('welcome.roadmap.v1.label')}</span>
                            </div>
                            <h3 className="roadmap-version">{t('welcome.roadmap.v1.version')}</h3>
                            <p className="roadmap-subtitle">{t('welcome.roadmap.v1.subtitle')}</p>
                        </div>
                        <ul className="roadmap-features">
                            <li>{t('welcome.roadmap.v1.feature1')}</li>
                            <li>{t('welcome.roadmap.v1.feature2')}</li>
                            <li>{t('welcome.roadmap.v1.feature3')}</li>
                        </ul>
                    </div>
                </div>

                {/* V1.5 - Next */}
                <div className="roadmap-card-container roadmap-next">
                    <div className="roadmap-card-container-body">
                        <div className="roadmap-header">
                            <div className="roadmap-version-badge next-badge">
                                <Rocket size={16} />
                                <span>{t('welcome.roadmap.v15.label')}</span>
                            </div>
                            <h3 className="roadmap-version">{t('welcome.roadmap.v15.version')}</h3>
                            <p className="roadmap-subtitle">{t('welcome.roadmap.v15.subtitle')}</p>
                        </div>
                        <ul className="roadmap-features">
                            <li>{t('welcome.roadmap.v15.feature1')}</li>
                            <li>{t('welcome.roadmap.v15.feature2')}</li>
                            <li>{t('welcome.roadmap.v15.feature3')}</li>
                        </ul>
                    </div>
                </div>

                {/* V2.0 - Future */}
                <div className="roadmap-card-container roadmap-future">
                    <div className="roadmap-card-container-body">
                        <div className="roadmap-header">
                            <div className="roadmap-version-badge future-badge">
                                <Sparkles size={16} />
                                <span>{t('welcome.roadmap.v2.label')}</span>
                            </div>
                            <h3 className="roadmap-version">{t('welcome.roadmap.v2.version')}</h3>
                            <p className="roadmap-subtitle">{t('welcome.roadmap.v2.subtitle')}</p>
                        </div>
                        <ul className="roadmap-features">
                            <li>{t('welcome.roadmap.v2.feature1')}</li>
                            <li>{t('welcome.roadmap.v2.feature2')}</li>
                            <li>{t('welcome.roadmap.v2.feature3')}</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}
