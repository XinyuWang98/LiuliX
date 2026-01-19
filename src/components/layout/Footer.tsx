
import { useI18n } from '@/contexts/I18nContext';
import { Twitter, FileText, Github } from 'lucide-react';
import { EXTERNAL_LINKS } from '@/config/externalLinks';
// import { Github } from 'lucide-react';
import { DiscordIcon } from '@/components/common/DiscordIcon';
import './Footer.css';
import { Logo } from '@/components/common/Logo/Logo';

export function Footer() {
    const { t } = useI18n();
    const currentYear = new Date().getFullYear();

    return (
        <footer className="liulix-footer">
            <div className="footer-content">
                <div className="footer-brand">
                    <Logo layout="horizontal" size="m" />
                    <p className="footer-desc">
                        {t('welcome.hero.subtitle')}
                    </p>
                    <div className="footer-copyright">
                        © {currentYear} LiuliX. All Rights Reserved.
                    </div>
                </div>

                <div className="footer-links">
                    <div className="footer-col">
                        <h4>{t('footer.resources') || 'Resources'}</h4>
                        <a href="/whitepaper" target="_blank" rel="noopener noreferrer">
                            <FileText size={16} /> {t('nav.whitepaper') || 'Whitepaper'}
                        </a>
                    </div>
                    <div className="footer-col">
                        <h4>{t('footer.community')}</h4>
                        <a href={EXTERNAL_LINKS.github.repo} target="_blank" rel="noopener noreferrer" title="GitHub">
                            <Github size={16} /> GitHub
                        </a>
                        <a href={EXTERNAL_LINKS.discord.general} target="_blank" rel="noopener noreferrer" title="Discord">
                            <DiscordIcon size={16} /> Discord
                        </a>
                        <a href="https://www.reddit.com/r/LiuliX/" target="_blank" rel="noopener noreferrer" title="Reddit">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-reddit"><circle cx="12" cy="12" r="10" /><path d="M17 12a5 5 0 1 0-10 0" /><line x1="12" y1="2" x2="12" y2="4" /><line x1="4.93" y1="4.93" x2="6.34" y2="6.34" /><line x1="19.07" y1="4.93" x2="17.66" y2="6.34" /></svg> Reddit
                        </a>
                        <a href="https://twitter.com/LiuliX_AI" target="_blank" rel="noopener noreferrer" title="Twitter">
                            <Twitter size={16} /> Twitter
                        </a>
                    </div>
                </div>
                {/* 内测阶段隐藏法律链接 */}
                {/* <div className="footer-bottom-links" style={{ marginTop: '1rem', fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', gap: '16px' }}>
                    <a href="/whitepaper" target="_blank" title="Pending legal review">Terms of Service</a>
                    <a href="/whitepaper" target="_blank" title="See our Privacy First architecture">Privacy Policy</a>
                </div> */}
            </div>
        </footer>
    );
}
