import React, { useEffect, useState } from 'react';
import './DocTableOfContents.css';
import { useI18n } from '@/contexts/I18nContext';

export interface TOCItem {
    id: string;
    text: string;
    level: number;
}

interface DocTableOfContentsProps {
    headings: TOCItem[];
}

export const DocTableOfContents: React.FC<DocTableOfContentsProps> = ({ headings }) => {
    const [activeId, setActiveId] = useState<string>('');
    const { t } = useI18n();

    // Scroll Spy Logic
    useEffect(() => {
        if (headings.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            {
                rootMargin: '-80px 0px -80% 0px', // Trigger when heading is near top
                threshold: 0.1
            }
        );

        headings.forEach(({ id }) => {
            const element = document.getElementById(id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [headings]);

    const scrollTo = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            // Update URL hash without jumping
            window.history.pushState(null, '', `#${id}`);
            setActiveId(id);
        }
    };

    if (headings.length === 0) return null;

    return (
        <nav className="doc-toc">
            <div className="toc-title">{t('whitepaper.common.toc') || 'On this page'}</div>
            <ul className="toc-list">
                {headings.map((item) => (
                    <li
                        key={item.id}
                        className={`toc-item level-${item.level} ${activeId === item.id ? 'active' : ''}`}
                    >
                        <a href={`#${item.id}`} onClick={(e) => scrollTo(item.id, e)}>
                            {item.text}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
};
