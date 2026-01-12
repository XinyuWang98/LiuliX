import React from 'react';
import { Copy, Check } from 'lucide-react';
import { ReportCell } from '@/types/report';
import { CodeBlock } from '@/components/common/CodeBlock/CodeBlock';
import { useI18n } from '@/contexts/I18nContext';
import { logger } from '@/utils/logger';
import './CellCode.css';

interface CellCodeProps {
    cell: ReportCell;
}

export function CellCode({ cell }: CellCodeProps) {
    const { t } = useI18n();
    const [copied, setCopied] = React.useState(false);

    // CRITICAL: Display pure code (cleansed, no imports)
    // Use cell.code (which comes from presentationCode) for display
    // Fallback to rawCode only if code is empty
    const codeToDisplay = cell.code || cell.rawCode || '';

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(codeToDisplay);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            logger.log('UI', '代码已复制', { data: { cellId: cell.id } });
        } catch (err) {
            logger.error('UI', '复制失败', err);
        }
    };

    return (
        <div className="cell-code-container">
            <div className="cell-code-header">
                <div className="header-left">
                    <span className="code-lang-tag">{cell.language.toUpperCase()}</span>
                    <span className="code-meta">Cell #{cell.id.slice(0, 6)}</span>
                </div>

                <div className="header-actions">
                    <button
                        className="btn-icon-action"
                        onClick={handleCopy}
                        title={t('report.notebook.copyCode')}
                    >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    {/* Placeholder for future audit status icon */}
                </div>
            </div>

            <div className="cell-code-body">
                <CodeBlock
                    code={codeToDisplay}
                    language={cell.language}
                    copyable={false} // We have our own copy button in header
                    formatted={false}
                    showLineNumbers={false}
                // Ensure we rely on global CodeBlock styles but wrapped in our container
                />
            </div>
        </div>
    );
}
