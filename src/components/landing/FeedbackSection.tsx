import { useI18n } from '@/contexts/I18nContext';
// import { Github } from 'lucide-react';
import { EXTERNAL_LINKS } from '@/config/externalLinks';
import { DiscordIcon } from '@/components/common/DiscordIcon';
import './FeedbackSection.css';

/**
 * 社区互动区域 (原 FeedbackSection)
 * 引导用户加入 Discord 或 GitHub
 */
export function FeedbackSection() {
    const { t } = useI18n();

    return (
        <section className="feedback-section">
            <div className="feedback-container">
                <div className="feedback-header">
                    <h2 className="feedback-title">
                        {t('welcome.community.title')}
                    </h2>
                    <p className="feedback-subtitle">
                        {t('welcome.community.subtitle')}
                    </p>
                </div>

                <div className="community-grid">
                    {/* Discord Card */}
                    <a
                        href={EXTERNAL_LINKS.discord.general}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="community-card is-discord"
                    >
                        <DiscordIcon size={48} className="community-icon" />
                        <div className="card-title">{t('welcome.community.discordTitle')}</div>
                        <div className="card-desc">{t('welcome.community.discordDesc')}</div>
                        <div className="card-action">
                            {t('welcome.community.joinDiscord')} →
                        </div>
                    </a>

                    {/* GitHub Card - Temporarily hidden for closed source phase */}
                    {/* <a
                        href="https://github.com/LiuliX-Dev/LiuliX"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="community-card is-github"
                    >
                        <Github size={48} className="community-icon" />
                        <div className="card-title">{t('welcome.community.githubTitle')}</div>
                        <div className="card-desc">{t('welcome.community.githubDesc')}</div>
                        <div className="card-action">
                            {t('welcome.community.starGithub')} →
                        </div>
                    </a> */}
                </div>
            </div>
        </section>
    );
}
