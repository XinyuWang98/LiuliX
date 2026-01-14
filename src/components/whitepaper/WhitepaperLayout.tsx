import React, { useState, useEffect } from 'react';
import { DocTableOfContents, TOCItem } from './DocTableOfContents';
import { DocSidebar } from './DocSidebar';
import { MarkdownViewer } from './MarkdownViewer';
import { whitepaperDocs } from '@/config/whitepaper';
import { useI18n } from '@/contexts/I18nContext';
import { Globe, Moon, Sun } from 'lucide-react';
import { WhitepaperDoc } from '@/types/whitepaper';
import { Logo } from '@/components/common/Logo/Logo';
import appleDarkTheme from '@/themes/apple-dark.json';
import appleLightTheme from '@/themes/apple-light.json';

interface WhitepaperLayoutProps {
    onBack: () => void;
    initialDocId?: string;
}

export const WhitepaperLayout: React.FC<WhitepaperLayoutProps> = ({ initialDocId }) => {
    const { language, setLanguage, t } = useI18n();

    // Isolated Theme State: Default to Dark, independent of global app theme
    const [isDark, setIsDark] = useState(true);

    const toggleTheme = () => setIsDark(!isDark);

    // Get current theme variables
    const currentThemeInfo = isDark ? appleDarkTheme : appleLightTheme;
    const themeVariables = currentThemeInfo.colors as React.CSSProperties;

    // Find first visible doc for default
    const findFirstDoc = (docs: WhitepaperDoc[]): string => {
        for (const doc of docs) {
            if (!doc.hidden) {
                if (doc.children && doc.children.length > 0) {
                    return findFirstDoc(doc.children);
                }
                return doc.id;
            }
        }
        return '';
    };

    const [activeDocId, setActiveDocId] = useState<string>(initialDocId || findFirstDoc(whitepaperDocs));
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [tocHeadings, setTocHeadings] = useState<TOCItem[]>([]);

    // Load content when activeDocId or language changes
    useEffect(() => {
        const loadDoc = async () => {
            if (!activeDocId) return;

            setLoading(true);
            setTocHeadings([]); // Reset TOC when loading new doc

            try {
                // 查找 activeDocId 对应的路径
                const findDocPath = (docs: WhitepaperDoc[], id: string): string | null => {
                    for (const doc of docs) {
                        if (doc.id === id) return doc.path;
                        if (doc.children) {
                            const found = findDocPath(doc.children, id);
                            if (found) return found;
                        }
                    }
                    return null;
                };

                const relativePath = findDocPath(whitepaperDocs, activeDocId);

                if (!relativePath) {
                    throw new Error('未找到文档配置');
                }

                // 使用 import.meta.glob 加载 Markdown 文件
                // 注意：Vite 要求 glob 模式必须是字符串字面量，不能注入变量。
                // 我们加载 whitepaper/ 下的所有 md 文件，然后按路径过滤。
                const modules = import.meta.glob('/src/whitepaper/**/*.md', { as: 'raw' });
                console.log('Whitepaper: Loaded modules keys:', Object.keys(modules));

                // 构建映射 key: /src/whitepaper/{zh-CN|en-US}/{relativePath}
                const langCode = language.code;
                const targetKey = `/src/whitepaper/${langCode}/${relativePath}`;

                // 如果特定语言文件丢失，回退到另一种语言（反之亦然）
                const fallbackKey = `/src/whitepaper/${langCode === 'zh-CN' ? 'en-US' : 'zh-CN'}/${relativePath}`;

                let loader = modules[targetKey];
                if (!loader && modules[fallbackKey]) {
                    console.warn(`Missing translation for ${targetKey}, using fallback.`);
                    loader = modules[fallbackKey];
                }

                if (!loader) {
                    // 尝试精确匹配（防止路径包含目录的情况）
                    const exactKey = `/src/whitepaper/${langCode}/${relativePath}`;
                    if (!modules[exactKey]) {
                        throw new Error(`File not found: ${targetKey}`);
                    }
                    loader = modules[exactKey];
                }

                const rawContent = await loader();
                setContent(rawContent);
            } catch (err: any) {
                console.error('Failed to load markdown:', err);
                setContent(t('whitepaper.common.error'));
            } finally {
                setLoading(false);
            }
        };

        loadDoc();
    }, [activeDocId, language.code]);

    return (
        <div className="whitepaper-layout" style={themeVariables}>
            {/* Top Bar */}
            <header className="wp-header">
                <div className="header-left">
                    <div className="brand">
                        <Logo className="wp-logo" showText={true} />
                        <span className="doc-title" style={{ marginLeft: 8 }}>{t('whitepaper.common.title')}</span>
                    </div>
                </div>
                <div className="header-right">
                    <button onClick={toggleTheme} className="icon-btn" title={t('whitepaper.actions.switchTheme')}>
                        {isDark ? <Moon size={18} /> : <Sun size={18} />}
                    </button>
                    <button
                        onClick={() => setLanguage(language.code === 'zh-CN' ? 'en-US' : 'zh-CN')}
                        className="lang-btn"
                    >
                        <Globe size={16} style={{ marginRight: 6 }} />
                        {language.code === 'zh-CN' ? t('language.zh') : t('language.en')}
                    </button>
                </div>
            </header>

            {/* Main Body */}
            <div className="wp-body">
                <DocSidebar
                    docs={whitepaperDocs}
                    activeDocId={activeDocId}
                    onSelect={setActiveDocId}
                />

                <main className="wp-content">
                    <div className="content-inner">
                        {loading ? (
                            <div className="loading-state">{t('whitepaper.common.loading')}</div>
                        ) : (
                            <MarkdownViewer
                                content={content}
                                onHeadingsChange={setTocHeadings}
                                isDark={isDark}
                            />
                        )}
                    </div>
                </main>

                {/* Right TOC */}
                <aside className="wp-toc">
                    <DocTableOfContents headings={tocHeadings} />
                </aside>
            </div>

            <style>{`
                .whitepaper-layout {
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    background: var(--bg-main);
                    color: var(--text-primary);
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    transition: background 0.3s ease, color 0.3s ease;
                }
                .wp-header {
                    height: 60px;
                    border-bottom: 1px solid var(--border);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 24px;
                    flex-shrink: 0;
                    background: var(--bg-panel);
                    backdrop-filter: blur(20px);
                }
                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .brand {
                    display: flex;
                    align-items: center;
                    font-weight: 600;
                    font-size: 16px;
                    line-height: 1; /* Force compact line-height for alignment */
                    color: var(--text-primary);
                }
                .brand .doc-title {
                    color: var(--text-secondary);
                    font-weight: 400;
                    font-size: 14px; /* Slightly smaller for subtitle effect */
                    margin-top: 2px; /* Micro-adjustment to align with logo text baseline */
                }
                .header-right {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .icon-btn {
                    padding: 8px;
                    background: transparent;
                    border: 1px solid var(--border);
                    border-radius: 4px;
                    color: var(--text-secondary);
                    cursor: pointer;
                    display: flex;
                }
                .lang-btn {
                    display: flex;
                    align-items: center;
                    padding: 6px 12px;
                    border: 1px solid var(--border);
                    border-radius: 4px;
                    background: transparent;
                    font-size: 13px;
                    color: var(--text-primary);
                    cursor: pointer;
                }
                .lang-btn:hover, .icon-btn:hover {
                    background: var(--bg-hover);
                }

                .wp-body {
                    flex: 1;
                    display: flex;
                    overflow: hidden;
                }
                .wp-content {
                    flex: 1;
                    overflow-y: auto;
                    display: flex;
                    justify-content: center;
                    padding: 40px 60px;
                }
                .content-inner {
                    width: 100%;
                    max-width: 900px;
                }
                .wp-toc {
                    width: 250px;
                    border-left: 1px solid var(--border);
                    display: none; /* Show only on large screens */
                    padding: 24px 16px;
                    background: var(--bg-main);
                }
                @media (min-width: 1400px) {
                    .wp-toc {
                        display: block;
                    }
                }
                /* Mobile optimization */
                @media (max-width: 768px) {
                    .wp-content {
                        padding: 20px;
                    }
                }
            `}</style>
        </div>
    );
};
