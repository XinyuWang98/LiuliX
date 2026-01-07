import { useState, useRef, useEffect } from 'react';
import { FileCode, Copy, Check, ChevronDown, ChevronRight, Code, Shield } from 'lucide-react';
import { CodeBlock } from '@/components/common/CodeBlock/CodeBlock';
import { useI18n } from '@/contexts/I18nContext';
import './LiveNotebookPanel.css';

/**
 * 代码块数据结构
 */
interface CodeBlockItem {
    id: string;
    title: string;
    code: string;        // AST 增强版代码
    rawCode?: string;    // 纯净版代码（无防护注入）
}

interface LiveNotebookPanelProps {
    codeBlocks: Array<CodeBlockItem>;
    focusedId: string | null; // 当前焦点节点ID
    expandedIds?: Set<string>; // 外部控制的展开状态
}

/** 代码查看模式 */
type ViewMode = 'pure' | 'enhanced';

/** localStorage 存储键 */
const VIEW_MODE_STORAGE_KEY = 'notebook_view_mode';

/**
 * Live Notebook Panel - 右侧代码面板
 * 
 * v2.0 新功能：
 * - 支持「纯净代码 / 增强代码」切换
 * - 纯净代码：可直接复制到 Colab 运行
 * - 增强代码：包含防护逻辑，用于问题排查
 * - 复用 CodeBlock 组件实现语法高亮
 * - 切换状态 localStorage 持久化
 */
export function LiveNotebookPanel({ codeBlocks, focusedId, expandedIds }: LiveNotebookPanelProps) {
    const { t } = useI18n();
    const [copied, setCopied] = useState(false);
    const focusedBlockRef = useRef<HTMLDivElement>(null);

    // 内部展开状态管理（仅在没有外部控制时使用）
    const [internalExpandedIds, setInternalExpandedIds] = useState<Set<string>>(new Set());

    // 使用外部传入的 expandedIds，如果没有则使用内部状态
    const activeExpandedIds = expandedIds || internalExpandedIds;
    const setExpandedIds = expandedIds ? undefined : setInternalExpandedIds;

    // ✅ 代码查看模式状态（持久化）
    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
        return (saved as ViewMode) || 'pure'; // 默认纯净模式
    });

    // ✅ 持久化 viewMode 到 localStorage
    useEffect(() => {
        localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
    }, [viewMode]);

    // 🔍 调试：检查传入的 codeBlocks 数据
    useEffect(() => {
        if (codeBlocks.length > 0) {
            const sample = codeBlocks[0];
            console.log('[LiveNotebook 调试] 传入数据:', {
                viewMode,
                hasRawCode: !!sample.rawCode,
                rawCodeLength: sample.rawCode?.length,
                codeLength: sample.code.length,
                isSame: sample.rawCode === sample.code,
                rawPreview: sample.rawCode?.slice(0, 100),
                codePreview: sample.code.slice(0, 100)
            });
        }
    }, [codeBlocks, viewMode]);

    /**
     * 获取用于显示的代码
     * - pure 模式：返回 rawCode（无则回退到 code）
     * - enhanced 模式：返回 code
     */
    const getDisplayCode = (block: CodeBlockItem): string => {
        return viewMode === 'pure'
            ? (block.rawCode || block.code)
            : block.code;
    };

    /**
     * 获取完整脚本（用于一键复制）
     */
    const fullScript = codeBlocks
        .map(block => getDisplayCode(block))
        .join('\n\n');

    const handleCopy = () => {
        navigator.clipboard.writeText(fullScript);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // 切换单个代码块的折叠状态（仅在内部控制时有效）
    const toggleExpand = (id: string) => {
        if (!setExpandedIds) return; // 如果是外部控制，则不允许手动切换

        setExpandedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    // 当 focusedId 变化时，自动展开聚焦的代码块（仅在内部控制时）
    useEffect(() => {
        if (focusedId && setExpandedIds) {
            setExpandedIds(new Set([focusedId])); // 只展开聚焦的代码块
        }
    }, [focusedId, setExpandedIds]);

    // 自动滚动到焦点代码块
    useEffect(() => {
        if (focusedId && focusedBlockRef.current) {
            focusedBlockRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, [focusedId]);

    return (
        <div className="live-notebook-panel">
            {/* Header */}
            <div className="notebook-header">
                <div className="notebook-title">
                    <FileCode size={16} />
                    <span>Live Notebook</span>
                </div>

                <div className="notebook-header-actions">
                    {/* ✅ 代码模式切换按钮组 */}
                    <div className="view-mode-toggle" title={viewMode === 'pure'
                        ? t('report.notebook.viewMode.pureHint')
                        : t('report.notebook.viewMode.enhancedHint')}>
                        <button
                            className={`view-mode-btn ${viewMode === 'pure' ? 'active' : ''}`}
                            onClick={() => setViewMode('pure')}
                            aria-label={t('report.notebook.viewMode.pure')}
                        >
                            <Code size={12} />
                            <span>{t('report.notebook.viewMode.pure')}</span>
                        </button>
                        <button
                            className={`view-mode-btn ${viewMode === 'enhanced' ? 'active' : ''}`}
                            onClick={() => setViewMode('enhanced')}
                            aria-label={t('report.notebook.viewMode.enhanced')}
                        >
                            <Shield size={12} />
                            <span>{t('report.notebook.viewMode.enhanced')}</span>
                        </button>
                    </div>

                    {/* 复制按钮 */}
                    <button className="copy-all-btn" onClick={handleCopy} title={t('report.notebook.copyAllToColab')}>
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copied ? t('report.notebook.codeCopied') : t('report.copy')}</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="notebook-content">
                {codeBlocks.length === 0 ? (
                    <div className="notebook-empty">
                        <FileCode size={32} className="notebook-empty-icon" />
                        <p>{t('insightChain.noInsights') || '点击左侧节点即可生成代码'}</p>
                    </div>
                ) : (
                    codeBlocks.map((block, index) => {
                        const isFocused = block.id === focusedId;
                        const isExpanded = activeExpandedIds.has(block.id);
                        const displayCode = getDisplayCode(block);

                        return (
                            <div
                                key={block.id}
                                ref={isFocused ? focusedBlockRef : null}
                                className={`code-block-item ${isFocused ? 'focused' : ''} ${isExpanded ? 'expanded' : 'collapsed'}`}
                            >
                                {/* 可点击的标题栏 */}
                                <div
                                    className="code-step-label"
                                    onClick={() => toggleExpand(block.id)}
                                    style={{ cursor: expandedIds ? 'default' : 'pointer' }}
                                >
                                    {/* 展开/折叠图标 */}
                                    <span className="expand-icon">
                                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </span>
                                    <span>Step {index + 1}: {block.title}</span>
                                </div>

                                {/* ✅ 复用 CodeBlock 组件显示代码 */}
                                {isExpanded && (
                                    <CodeBlock
                                        key={`${block.id}-${viewMode}`}  // ✅ 包含 viewMode 的 key 强制重新渲染
                                        code={displayCode}
                                        language="python"
                                        copyable={true}
                                        showLineNumbers={false}
                                        formatted={false}
                                        className="notebook-code-block"
                                    />
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
