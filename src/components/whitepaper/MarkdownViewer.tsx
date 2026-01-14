import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkAlert from 'remark-github-blockquote-alert';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import { MermaidBlock } from './MermaidBlock';

// 注册 SyntaxHighlighter 支持的编程语言
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('sql', sql);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('ts', typescript);

// 主题背景色常量 (用于解决 Local Theme 与 Global Variable 不同步的问题)
const THEME_BG_DARK = '#1C1C1E'; // matches apple-dark.json --bg-code-block
const THEME_BG_LIGHT = 'rgba(245, 245, 247, 1)'; // matches apple-light.json --bg-code-block

const getCustomStyle = (isDark: boolean) => {
    const baseStyle = isDark ? vscDarkPlus : vs;
    return {
        ...baseStyle,
        'code[class*="language-"]': {
            ...baseStyle['code[class*="language-"]'],
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            color: 'inherit',
            textShadow: 'none',
        }
    };
};

const generateId = (text: string) => {
    return text
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\u4e00-\u9fa5-]/g, '');
};

/**
 * 从任意节点类型中提取纯文本（递归处理）
 * 用于标题ID生成等场景
 */
const extractText = (node: any): string => {
    if (node === null || node === undefined) return '';
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(extractText).join('');

    if (React.isValidElement(node)) {
        return extractText((node.props as any).children);
    }

    const nodeObj = node as any;
    if (typeof nodeObj === 'object') {
        if (nodeObj.value) return String(nodeObj.value);
        if (nodeObj.children) return extractText(nodeObj.children);
        if (nodeObj.props && nodeObj.props.children) return extractText(nodeObj.props.children);
    }

    return '';
};

/**
 * 从 HAST 代码节点中提取代码文本（核心修复）
 * react-markdown v10 传递的 children 是 HAST 节点数组，需直接访问 node.children[0].value
 */
const extractCodeFromNode = (node: any, children: any): string => {
    // 策略 1: 直接从 HAST node 提取（最可靠）
    if (node?.children?.[0]?.value) {
        return String(node.children[0].value);
    }

    // 策略 2: 尝试从 children 提取（降级方案）
    const fallback = extractText(children);
    if (fallback && fallback !== '[object Object]') {
        return fallback;
    }

    // 策略 3: 最终降级：返回空字符串（避免显示 [object Object]）
    return '';
};

interface TOCItem {
    id: string;
    text: string;
    level: number;
}

interface MarkdownViewerProps {
    content: string;
    onHeadingsChange?: (headings: TOCItem[]) => void;
    isDark?: boolean;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, onHeadingsChange, isDark = false }) => {

    // 提取标题用于目录生成
    React.useEffect(() => {
        if (!onHeadingsChange) return;
        const lines = content.split('\n');
        const headings: TOCItem[] = [];
        let inCodeBlock = false;

        lines.forEach(line => {
            if (line.trim().startsWith('```')) {
                inCodeBlock = !inCodeBlock;
                return;
            }
            if (inCodeBlock) return;

            const match = line.match(/^(#{1,3})\s+(.+)$/);
            if (match) {
                const level = match[1].length;
                const text = match[2].trim().replace(/[*_`]/g, '');
                headings.push({
                    id: generateId(text),
                    text,
                    level
                });
            }
        });
        onHeadingsChange(headings);
    }, [content, onHeadingsChange]);

    // 标题渲染器（带ID锚点）
    const HeadingRenderer = ({ level, children, ...props }: any) => {
        const text = extractText(children);
        const id = generateId(text);
        const Tag = `h${level}` as keyof JSX.IntrinsicElements;
        return <Tag id={id} {...props}>{children}</Tag>;
    };

    return (
        <div className={`whitepaper-markdown ${isDark ? 'theme-dark' : 'theme-light'}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkAlert]}
                components={{
                    h1: ({ node, ...props }) => <HeadingRenderer level={1} {...props} />,
                    h2: ({ node, ...props }) => <HeadingRenderer level={2} {...props} />,
                    h3: ({ node, ...props }) => <HeadingRenderer level={3} {...props} />,

                    // 链接渲染器：外部链接添加图标和新窗口打开
                    a: ({ node, href, children, ...props }: any) => {
                        const safeHref = String(href || '');
                        const isExternal = safeHref.startsWith('http');

                        if (isExternal) {
                            return (
                                <a
                                    href={safeHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    {...props}
                                    style={{ display: 'inline-flex', alignItems: 'center' }}
                                >
                                    {children}
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px', opacity: 0.8, color: 'var(--primary)' }}>
                                        <title>外部链接</title>
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                        <polyline points="15 3 21 3 21 9" />
                                        <line x1="10" y1="14" x2="21" y2="3" />
                                    </svg>
                                </a>
                            );
                        }
                        return <a href={safeHref} {...props}>{children}</a>;
                    },

                    // 代码块渲染器（核心修复：解决 [object Object] 问题）
                    code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');

                        // 使用修复后的提取函数（避免 [object Object]）
                        const codeText = extractCodeFromNode(node, children);

                        // Mermaid 图表特殊处理
                        if (!inline && match && match[1] === 'mermaid') {
                            return <MermaidBlock chart={codeText.replace(/\n$/, '')} isDark={isDark} />;
                        }

                        // 代码块高亮渲染
                        if (!inline && match) {
                            return (
                                <SyntaxHighlighter
                                    style={getCustomStyle(isDark) as any}
                                    language={match[1]}
                                    customStyle={{
                                        background: isDark ? THEME_BG_DARK : THEME_BG_LIGHT,
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-md)',
                                        margin: '16px 0',
                                        padding: '16px',
                                    }}
                                    {...props}
                                >
                                    {codeText.replace(/\n$/, '')}
                                </SyntaxHighlighter>
                            );
                        }

                        // 行内代码或降级处理
                        return (
                            <code className={className} {...props} style={{
                                background: 'var(--bg-hover)',
                                padding: '2px 4px',
                                borderRadius: '4px',
                                fontSize: '0.9em',
                                fontFamily: 'var(--font-mono)'
                            }}>
                                {children}
                            </code>
                        );
                    },

                    // 图片渲染器：添加容器和标题
                    img({ node, ...props }: any) {
                        return (
                            <div className="md-image-container">
                                <img {...props} style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
                                {props.alt && <span className="img-caption">{props.alt}</span>}
                            </div>
                        );
                    }
                }}
            >
                {content}
            </ReactMarkdown>

            <style>{`
                .whitepaper-markdown { color: var(--text-primary); line-height: 1.7; font-size: 16px; }
                .whitepaper-markdown h1 { font-size: 32px; font-weight: 700; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border); scroll-margin-top: 80px; }
                .whitepaper-markdown h2 { font-size: 24px; font-weight: 600; margin-top: 40px; margin-bottom: 16px; scroll-margin-top: 80px; }
                .whitepaper-markdown h3 { font-size: 20px; font-weight: 600; margin-top: 24px; margin-bottom: 12px; scroll-margin-top: 80px; }
                .whitepaper-markdown p { margin-bottom: 16px; }
                .whitepaper-markdown ul, .whitepaper-markdown ol { padding-left: 24px; margin-bottom: 16px; }
                .whitepaper-markdown li { margin-bottom: 8px; }
                .whitepaper-markdown blockquote:not(.markdown-alert) { border-left: 4px solid var(--primary); padding: 8px 16px; background: var(--bg-hover); border-radius: 0 4px 4px 0; margin: 24px 0; color: var(--text-secondary); }
                .whitepaper-markdown table { width: 100%; border-collapse: collapse; margin: 24px 0; }
                .whitepaper-markdown th, .whitepaper-markdown td { border: 1px solid var(--border); padding: 12px; text-align: left; }
                .whitepaper-markdown th { background: var(--bg-panel); font-weight: 600; }
                .whitepaper-markdown a { color: var(--primary); text-decoration: none; }
                .whitepaper-markdown a:hover { text-decoration: underline; }
                .md-image-container { margin: 24px 0; text-align: center; display: flex; flexDirection: column; alignItems: center; }
                .img-caption { font-size: 12px; color: var(--text-secondary); margin-top: 8px; }
                
                /* GitHub-style Alerts 样式 */
                .markdown-alert { padding: 0.5rem 1rem; margin-bottom: 1rem; border-left: 0.25em solid var(--border-color); background-color: var(--bg-hover); }
                .markdown-alert-note { border-left-color: #0969da; }
                .markdown-alert-tip { border-left-color: #1a7f37; }
                .markdown-alert-important { border-left-color: #8250df; }
                .markdown-alert-warning { border-left-color: #9a6700; }
                .markdown-alert-caution { border-left-color: #cf222e; }
                .markdown-alert-title { display: flex; font-weight: 600; align-items: center; line-height: 1; margin-bottom: 4px; }
                .markdown-alert-note .markdown-alert-title { color: #0969da; }
                .markdown-alert-tip .markdown-alert-title { color: #1a7f37; }
                .markdown-alert-important .markdown-alert-title { color: #8250df; }
                .markdown-alert-warning .markdown-alert-title { color: #9a6700; }
                .markdown-alert-caution .markdown-alert-title { color: #cf222e; }
            `}</style>
        </div>
    );
};
