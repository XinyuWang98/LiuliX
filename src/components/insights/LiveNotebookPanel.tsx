import { useState, useRef, useEffect } from 'react';
import { FileCode, Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';
import './LiveNotebookPanel.css';

interface LiveNotebookPanelProps {
    codeBlocks: Array<{ id: string; title: string; code: string }>;
    focusedId: string | null; // 当前焦点节点ID
}

/**
 * Live Notebook Panel - 右侧代码面板（支持焦点跟踪 + 折叠/展开）
 * 
 * 功能：
 * - 显示所有已解析节点的代码块列表
 * - 支持一键复制完整脚本
 * - 自动滚动到焦点代码块
 * - 焦点高亮效果
 * - 可折叠代码块（默认只展开聚焦的代码块）
 */
export function LiveNotebookPanel({ codeBlocks, focusedId }: LiveNotebookPanelProps) {
    const [copied, setCopied] = useState(false);
    const focusedBlockRef = useRef<HTMLDivElement>(null);

    // 🆕 折叠/展开状态管理
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const fullScript = codeBlocks.map(block => block.code).join('\n\n');

    const handleCopy = () => {
        navigator.clipboard.writeText(fullScript);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // 🆕 切换单个代码块的折叠状态
    const toggleExpand = (id: string) => {
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

    // 🆕 当 focusedId 变化时，自动展开聚焦的代码块，折叠其他代码块
    useEffect(() => {
        if (focusedId) {
            setExpandedIds(new Set([focusedId])); // 只展开聚焦的代码块
        }
    }, [focusedId]);

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
                <button className="copy-all-btn" onClick={handleCopy} title="复制完整代码">
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? '已复制' : '复制'}</span>
                </button>
            </div>

            {/* Content */}
            <div className="notebook-content">
                {codeBlocks.length === 0 ? (
                    <div className="notebook-empty">
                        <FileCode size={32} style={{ opacity: 0.2 }} />
                        <p>点击左侧节点即可生成代码</p>
                    </div>
                ) : (
                    codeBlocks.map((block, index) => {
                        const isFocused = block.id === focusedId;
                        const isExpanded = expandedIds.has(block.id);
                        return (
                            <div
                                key={block.id}
                                ref={isFocused ? focusedBlockRef : null}
                                className={`code-block-item ${isFocused ? 'focused' : ''} ${isExpanded ? 'expanded' : 'collapsed'}`}
                            >
                                {/* 🆕 可点击的标题栏 */}
                                <div
                                    className="code-step-label"
                                    onClick={() => toggleExpand(block.id)}
                                >
                                    {/* 展开/折叠图标 */}
                                    <span className="expand-icon">
                                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </span>
                                    <span>Step {index + 1}: {block.title}</span>
                                </div>

                                {/* 🆕 只在展开时显示代码 */}
                                {isExpanded && (
                                    <pre className="liuli-code-block">{block.code}</pre>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
