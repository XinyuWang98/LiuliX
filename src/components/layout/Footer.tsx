
import { useI18n } from '@/contexts/I18nContext';
import { Twitter, FileText } from 'lucide-react';
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
                        <a href={EXTERNAL_LINKS.discord.general} target="_blank" rel="noopener noreferrer">
                            <DiscordIcon size={16} /> Discord
                        </a>
                        {/* <a href="https://github.com/LiuliX-Dev/LiuliX" target="_blank" rel="noopener noreferrer">
                            <Github size={16} /> GitHub
                        </a> */}
                        <a href="#" className="disabled">
                            <Twitter size={16} /> Twitter
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
