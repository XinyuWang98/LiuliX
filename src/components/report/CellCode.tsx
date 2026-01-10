/**
 * CellCode 组件
 * 右侧代码域：显示去除 import 后的展示代码，支持折叠
 */

import { CodeBlock } from '../common/CodeBlock/CodeBlock';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { ReportCell } from '@/types/report';
import './CellCode.css';

interface CellCodeProps {
    /** Cell 数据 */
    cell: ReportCell;
    /** 是否折叠 */
    isCollapsed: boolean;
    /** 切换折叠状态回调 */
    onToggleCollapse: () => void;
}

/**
 * 右侧代码域组件
 * 复用 CodeBlock 组件展示代码高亮
 */
export function CellCode({ cell, isCollapsed, onToggleCollapse }: CellCodeProps) {
    const { t } = useI18n();
    // 优先使用 presentationCode（去除 import），否则使用原始 code
    const code = cell.presentationCode || cell.code;

    // 计算代码行数
    const lineCount = code.split('\n').length;

    return (
        <div className="cell-code">
            {/* 折叠头部 */}
            <div
                className="cell-code-header"
                onClick={onToggleCollapse}
                role="button"
                tabIndex={0}
                aria-expanded={!isCollapsed}
            >
                <span className="cell-code-icon">
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                </span>
                <span className="cell-code-title">{t('report.code.title')}</span>
                <span className="cell-code-meta">
                    {lineCount} {t('report.code.lines')}
                </span>
            </div>

            {/* 代码内容（非折叠时显示） */}
            {!isCollapsed && (
                <div className="cell-code-content">
                    <CodeBlock
                        code={code}
                        language={cell.language}
                        copyable={true}
                        formatted={false}
                        showLineNumbers={true}
                    />
                </div>
            )}
        </div>
    );
}
