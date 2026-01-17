import { useI18n } from '@/contexts/I18nContext';
import { Lock, Shield, Monitor } from 'lucide-react';
import './TrustBadges.css';

/**
 * Trust Badges 组件 - 在 Hero Section CTA 按钮下方展示信任徽章
 * 用于消除用户上传文件的顾虑，强调本地执行、隐私保护、桌面优化
 */
export function TrustBadges() {
    const { t } = useI18n();

    return (
        <div className="trust-badges">
            <div className="trust-badge">
                <Lock size={14} className="trust-badge-icon" />
                <span>{t('welcome.hero.trustBadges.local')}</span>
            </div>
            <div className="trust-badge">
                <Shield size={14} className="trust-badge-icon" />
                <span>{t('welcome.hero.trustBadges.offline')}</span>
            </div>
            <div className="trust-badge">
                <Monitor size={14} className="trust-badge-icon" />
                <span>{t('welcome.hero.trustBadges.desktop')}</span>
            </div>
        </div>
    );
}
