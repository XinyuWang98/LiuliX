/**
 * InsightChainDemo 组件 (Split View Version)
 * 洞察分析链 V2 演示 - 双栏布局：左树右码
 * 
 * 核心设计:
 * 1. 左侧 (65%) - 交互树：图表、结论、下钻操作
 * 2. 右侧 (35%) - Live Notebook：整合所有代码，实时追加
 * 3. 代码累积逻辑：按节点顺序展示，形成完整脚本
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { LiuliGlass } from '@/components/common/liulix/LiuliGlass';
import {
    ChevronDown,
    ChevronRight,
    BarChart2,
    RefreshCw,
    Sparkles,  // Header 中使用
    ThumbsUp,
    ThumbsDown,
    Copy,
    Check,
    FileCode
} from 'lucide-react';
import './InsightChainDemo.css';

// ========== Types ==========

type NodeStatus = 'pending' | 'loading' | 'resolved';

interface InsightNodeModel {
    id: string;
    label: string; // 胶囊显示的文字
    status: NodeStatus;

    // Resolved 状态才有的数据
    title?: string;
    conclusion?: string;
    code?: string;
    columnsUsed?: string[];

    // 数据上下文
    fileName?: string;      // 分析的文件名
    columnName?: string;    // 分析的列名

    // 洞察链路径（面包屑）
    breadcrumbPath?: string[];  // 例如: ['根洞察', '分析缺失值']

    // 子节点 (下一级建议)
    children?: InsightNodeModel[];

    isRecommended?: boolean; // 是否是 AI 强推
}

// ========== Mock Data Generators ==========

const CODE_TEMPLATES = {
    root1: `import pandas as pd
import numpy as np

# Step 1: 分析缺失值分布
missing_counts = df.isnull().sum()
missing_pct = (missing_counts / len(df)) * 100
print(f"总缺失值: {missing_counts.sum()}")`,

    root2: `# Step 2: 检查异常值 (IQR方法)
Q1 = df.select_dtypes(include=[np.number]).quantile(0.25)
Q3 = df.select_dtypes(include=[np.number]).quantile(0.75)
IQR = Q3 - Q1
outliers = ((df < (Q1 - 1.5 * IQR)) | (df > (Q3 + 1.5 * IQR))).sum()`,

    child1: `# Step 3: 深入分析收入分布
income_dist = df['median_income'].describe()
print(income_dist)`,

    child2: `# Step 4: 房龄影响关联分析
correlation = df[['housing_median_age', 'median_house_value']].corr()
print(correlation)`
};

const generateChildSuggestions = (
    parentId: string,
    parentNode: InsightNodeModel,
    depth: number
): InsightNodeModel[] => [
        {
            id: `${parentId}-child-1`,
            label: `深入分析: ${depth === 0 ? '收入分布' : '异常值检测'}`,
            status: 'pending',
            isRecommended: true,
            fileName: parentNode.fileName,
            columnName: parentNode.columnName,
            breadcrumbPath: [...(parentNode.breadcrumbPath || []), parentNode.title || parentNode.label]
        },
        {
            id: `${parentId}-child-2`,
            label: `关联分析: ${depth === 0 ? '房龄影响' : '地理位置'}`,
            status: 'pending',
            isRecommended: false,
            fileName: parentNode.fileName,
            columnName: parentNode.columnName,
            breadcrumbPath: [...(parentNode.breadcrumbPath || []), parentNode.title || parentNode.label]
        }
    ];

const MOCK_INITIAL_ROOTS: InsightNodeModel[] = [
    {
        id: 'root-1',
        label: '分析缺失值分布',
        status: 'pending',
        isRecommended: true,
        fileName: 'california_housing.csv',
        columnName: 'median_income',
        breadcrumbPath: []
    },
    {
        id: 'root-2',
        label: '检查异常值',
        status: 'pending',
        isRecommended: true,
        fileName: 'california_housing.csv',
        columnName: 'housing_median_age',
        breadcrumbPath: []
    },
    {
        id: 'root-3',
        label: '数值列概览',
        status: 'pending',
        isRecommended: false,
        fileName: 'california_housing.csv',
        columnName: '*',
        breadcrumbPath: []
    },
];

// ========== 辅助函数：收集所有已解析节点的代码 ==========

const collectResolvedCodes = (nodes: InsightNodeModel[]): Array<{ id: string; title: string; code: string }> => {
    const results: Array<{ id: string; title: string; code: string }> = [];

    const traverse = (nodeList: InsightNodeModel[]) => {
        for (const node of nodeList) {
            if (node.status === 'resolved' && node.code) {
                results.push({
                    id: node.id,
                    title: node.title || node.label,
                    code: node.code
                });
            }
            if (node.children) {
                traverse(node.children);
            }
        }
    };

    traverse(nodes);
    return results;
};

// ========== Components ==========

/** Live Notebook Panel - 右侧代码面板（支持焦点跟踪）*/
const LiveNotebookPanel: React.FC<{
    codeBlocks: Array<{ id: string; title: string; code: string }>;
    focusedId: string | null; // 新增：当前焦点节点ID
}> = ({ codeBlocks, focusedId }) => {
    const [copied, setCopied] = useState(false);
    const focusedBlockRef = useRef<HTMLDivElement>(null);

    const fullScript = codeBlocks.map(block => block.code).join('\n\n');

    const handleCopy = () => {
        navigator.clipboard.writeText(fullScript);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

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
                        return (
                            <div
                                key={block.id}
                                ref={isFocused ? focusedBlockRef : null}
                                className={`code-block-item ${isFocused ? 'focused' : ''}`}
                            >
                                <div className="code-step-label">
                                    Step {index + 1}: {block.title}
                                </div>
                                <pre className="code-content">{block.code}</pre>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

/** Resolved Card - 展开的果实（支持嵌套子卡片）*/
const InsightCard: React.FC<{
    node: InsightNodeModel;
    depth: number;
    onToggle: () => void;
    isExpanded: boolean;
    onFocus?: (nodeId: string) => void; // 焦点事件回调
    isPending?: boolean; // 标记是否为pending状态
    children?: React.ReactNode; // 嵌套的子节点
}> = ({ node, depth: _depth, onToggle, isExpanded, onFocus, isPending = false, children }) => {
    return (
        <div className={`insight-card-v2 ${isPending ? 'is-pending' : ''} ${children ? 'has-children' : ''}`}>
            {/* Header */}
            <div
                className="insight-card-header"
                onClick={() => {
                    onToggle(); // 触发加载或展开/折叠
                    if (!isPending) {
                        onFocus?.(node.id); // pending状态不触发焦点
                    }
                }}
            >
                {/* 左侧：卡片图标 */}
                <div className="card-icon">
                    <BarChart2 size={18} />
                </div>

                {/* 中间：信息区域 */}
                <div className="card-info">
                    {/* 行1：标题 */}
                    <div className="card-title">{node.title || node.label}</div>

                    {/* 行2：数据上下文（文件名 + 列名）*/}
                    {(node.fileName || node.columnName) && (
                        <div className="card-context">
                            {node.fileName && (
                                <span className="context-badge context-file">{node.fileName}</span>
                            )}
                            {node.columnName && (
                                <span className="context-badge context-column">{node.columnName}</span>
                            )}
                        </div>
                    )}

                    {/* 行3：面包屑路径 */}
                    {node.breadcrumbPath && node.breadcrumbPath.length > 0 && (
                        <div className="card-breadcrumb">
                            {node.breadcrumbPath.map((item, index) => (
                                <React.Fragment key={index}>
                                    <span className="breadcrumb-item">{item}</span>
                                    {index < node.breadcrumbPath!.length - 1 && (
                                        <span className="breadcrumb-separator">›</span>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                </div>

                {/* 右侧：操作按钮区域 */}
                <div className="card-actions">
                    {/* 投票按钮 - 仅在resolved状态显示 */}
                    {!isPending && (
                        <div className="vote-actions" onClick={(e) => e.stopPropagation()}>
                            <button className="icon-btn" title="采纳">
                                <ThumbsUp size={14} />
                            </button>
                            <button className="icon-btn" title="忽略">
                                <ThumbsDown size={14} />
                            </button>
                        </div>
                    )}

                    {/* 展开/折叠图标 */}
                    <div className="toggle-icon">
                        {isPending ? null : (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
                    </div>
                </div>
            </div>

            {/* Body - 仅在resolved且展开时显示 */}
            {!isPending && isExpanded && (
                <div className="insight-card-body">
                    {/* Chart Area */}
                    <div className="chart-preview-area">
                        <div className="mock-chart-bars">
                            {[60, 40, 80, 55, 70, 45, 90].map((h, i) => (
                                <div key={i} className="bar" style={{ height: `${h}%` }} />
                            ))}
                        </div>
                        <div className="chart-label">分析图表可视化</div>
                    </div>

                    {/* Conclusion */}
                    <div className="conclusion-box">
                        <strong>AI 结论：</strong>
                        {node.conclusion || '数据表明该字段存在显著的长尾分布特征，建议进行对数变换处理。'}
                    </div>

                    {/* 嵌套子卡片区域 */}
                    {children && (
                        <div className="nested-children">
                            {children}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


/** Recursive Tree Renderer */
const RecursiveTree: React.FC<{
    nodes: InsightNodeModel[];
    depth: number;
    onNodeClick: (nodeId: string) => void;
    onCardFocus?: (nodeId: string) => void; // 新增：卡片焦点事件
}> = ({ nodes, depth, onNodeClick, onCardFocus }) => {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const toggleExpand = (id: string) => {
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedIds(newSet);
    };

    return (
        <div className="tree-level">
            {nodes.map((node) => (
                <div key={node.id} className="tree-item-wrapper">
                    <div className="tree-content">
                        {/* State 1: Pending - 使用卡片形式，未展开内容 */}
                        {node.status === 'pending' && (
                            <InsightCard
                                node={node}
                                depth={depth}
                                isExpanded={false}  // pending状态默认折叠
                                onToggle={() => onNodeClick(node.id)}  // 点击触发加载
                                isPending={true}  // 标记为pending状态
                            />
                        )}

                        {/* State 2: Loading */}
                        {node.status === 'loading' && (
                            <div className="node-loading">
                                <div className="spinner-mini" />
                                <span>AI 分析中...</span>
                            </div>
                        )}

                        {/* State 3: Resolved - 卡片内嵌套子节点 */}
                        {node.status === 'resolved' && (
                            <InsightCard
                                node={node}
                                depth={depth}
                                isExpanded={!expandedIds.has(node.id)}
                                onToggle={() => toggleExpand(node.id)}
                                onFocus={onCardFocus}
                            >
                                {/* 子节点嵌套在卡片内部 */}
                                {(!expandedIds.has(node.id)) && node.children && node.children.length > 0 && (
                                    <RecursiveTree
                                        nodes={node.children}
                                        depth={depth + 1}
                                        onNodeClick={onNodeClick}
                                        onCardFocus={onCardFocus}
                                    />
                                )}
                            </InsightCard>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

// ========== Main Component ==========

export const InsightChainDemo: React.FC = () => {
    const { t } = useI18n();
    const [treeData, setTreeData] = useState<InsightNodeModel[]>(MOCK_INITIAL_ROOTS);
    const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null); // 新增：焦点节点ID

    // 收集所有已解析节点的代码
    const resolvedCodes = useMemo(() => collectResolvedCodes(treeData), [treeData]);

    // Deep update helper
    const updateNodeStatus = (nodes: InsightNodeModel[], targetId: string, newStatus: NodeStatus): InsightNodeModel[] => {
        return nodes.map(node => {
            if (node.id === targetId) {
                const isResolve = newStatus === 'resolved';
                // 分配 Mock 代码
                const mockCode = CODE_TEMPLATES[targetId as keyof typeof CODE_TEMPLATES] ||
                    CODE_TEMPLATES.child1;

                return {
                    ...node,
                    status: newStatus,
                    code: isResolve ? mockCode : node.code,
                    children: isResolve ? generateChildSuggestions(node.id, node, 0) : node.children
                };
            }
            if (node.children) {
                return { ...node, children: updateNodeStatus(node.children, targetId, newStatus) };
            }
            return node;
        });
    };

    const handleNodeClick = (nodeId: string) => {
        // 1. Set to loading
        setTreeData(prev => updateNodeStatus(prev, nodeId, 'loading'));

        // 2. Simulate AI delay -> Resolved
        setTimeout(() => {
            setTreeData(prev => updateNodeStatus(prev, nodeId, 'resolved'));
            // 3. 自动设置焦点到新解析的节点
            setFocusedNodeId(nodeId);
        }, 1200);
    };

    // 新增：处理卡片焦点事件
    const handleCardFocus = (nodeId: string) => {
        setFocusedNodeId(nodeId);
    };

    const handleReset = () => {
        setTreeData([...MOCK_INITIAL_ROOTS]);
    };

    return (
        <div className="insight-chain-demo-wrapper">
            <LiuliGlass className="insight-chain-v2" padding="none">
                {/* Header */}
                <div className="insight-chain-header">
                    <div className="title-section">
                        <Sparkles size={20} className="title-icon" />
                        <h3>{t('insightChain.title')}</h3>
                    </div>
                    <button className="refresh-btn" onClick={handleReset} title="重置演示">
                        <RefreshCw size={16} />
                    </button>
                </div>

                {/* Split View: 左树 + 右码 */}
                <div className="split-view-layout">
                    {/* 左侧：洞察树 */}
                    <div className="tree-panel">
                        <RecursiveTree
                            nodes={treeData}
                            depth={0}
                            onNodeClick={handleNodeClick}
                            onCardFocus={handleCardFocus} // 传递焦点事件处理器
                        />
                    </div>

                    {/* 右侧：Live Notebook */}
                    <LiveNotebookPanel
                        codeBlocks={resolvedCodes}
                        focusedId={focusedNodeId} // 传递焦点ID
                    />
                </div>
            </LiuliGlass>

            <div className="demo-hint-text">
                💡 交互演示：点击左侧的 Action Chips (树枝) 触发分析，右侧代码面板会实时累积生成的脚本。
            </div>
        </div>
    );
};
