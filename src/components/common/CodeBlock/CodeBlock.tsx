import React, { useState, useEffect } from 'react';
import Prism from 'prismjs';
import { Copy, Check } from 'lucide-react';
import { formatCode } from '@/utils/codeFormatter';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-json';
import './CodeBlock.css';

interface CodeBlockProps {
    /** 代码内容 */
    code: string;
    /** 语言类型 */
    language: 'sql' | 'python' | 'json';
    /** 是否显示行号 */
    showLineNumbers?: boolean;
    /** 是否显示复制按钮 */
    copyable?: boolean;
    /** 是否自动格式化 */
    formatted?: boolean;
    /** 自定义类名 */
    className?: string;
}

/**
 * 通用代码块组件
 * 支持语法高亮、自动格式化、一键复制
 */
export const CodeBlock: React.FC<CodeBlockProps> = ({
    code,
    language,
    showLineNumbers = false,
    copyable = true,
    formatted = true,
    className = ''
}) => {
    const [copied, setCopied] = useState(false);
    const [displayCode, setDisplayCode] = useState('');

    // 格式化代码
    useEffect(() => {
        if (formatted) {
            setDisplayCode(formatCode(code, language));
        } else {
            setDisplayCode(code);
        }
    }, [code, language, formatted]);

    // 语法高亮
    useEffect(() => {
        Prism.highlightAll();
    }, [displayCode, language]);

    // 复制功能
    const handleCopy = () => {
        navigator.clipboard.writeText(displayCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`code-block ${className}`}>
            {copyable && (
                <button
                    className="code-block-copy"
                    onClick={handleCopy}
                    title="复制代码"
                >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
            )}
            <pre className={showLineNumbers ? 'line-numbers' : ''}>
                <code className={`language-${language}`}>
                    {displayCode}
                </code>
            </pre>
        </div>
    );
};
