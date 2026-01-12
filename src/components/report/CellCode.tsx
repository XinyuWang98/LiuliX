import { ReportCell } from '@/types/report';
import { CodeBlock } from '@/components/common/CodeBlock/CodeBlock';
import './CellCode.css';

interface CellCodeProps {
    cell: ReportCell;
}

export function CellCode({ cell }: CellCodeProps) {

    // Use cell.code (which comes from presentationCode) for display
    // Fallback to rawCode only if code is empty
    const codeToDisplay = cell.code || cell.rawCode || '';

    return (
        <div className="cell-code-container">
            <div className="cell-code-header">
                <div className="header-left">
                    <span className="code-lang-tag">{cell.language.toUpperCase()}</span>
                    <span className="code-meta">Cell #{cell.id.slice(0, 6)}</span>
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
