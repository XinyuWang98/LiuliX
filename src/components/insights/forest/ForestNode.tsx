import React, { useRef, useEffect } from 'react';
import { ForestNodeProps } from './types';
import { ChevronRight, ChevronDown, Activity, Box, Layers, PlayCircle } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { getRenderedCode } from '@/services/insights/inflater';

/**
 * ForestNode - 单个洞察卡片 (玻璃拟态 + 暗夜风格)
 */
export const ForestNode: React.FC<ForestNodeProps> = ({
    node,
    depth,
    parentId,
    onToggle,
    onDrillDown,
    availableColumns
}) => {
    const { t } = useI18n();
    const nodeRef = useRef<HTMLDivElement>(null);

    // 状态标签配置
    const getStatusTag = () => {
        if (depth === 0) return { label: 'SYSTEM CORE', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
        if (depth === 1) return { label: 'ANALYSIS', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
        return { label: 'EVIDENCE', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    };

    const tag = getStatusTag();
    const hasChildren = node.children && node.children.length > 0;
    const hasDrillActions = node.drillDownActions && node.drillDownActions.length > 0;

    // 结果渲染 (简化版，复用现有 InsightCard 逻辑或直接嵌入)
    // 这里为了演示 Forest 效果，我们先渲染图表 (Image) 和 简介 (Summary)

    return (
        <div
            id={`node-${node.id}`}
            ref={nodeRef}
            className={`
                relative group transition-all duration-300 ease-out
                flex flex-col
                backdrop-blur-md rounded-xl border
                hover:translate-x-1 hover:shadow-[var(--forest-glow)]
            `}
            style={{
                backgroundColor: 'var(--forest-card-bg)',
                borderColor: 'var(--forest-card-border)',
                width: 'var(--forest-card-width, 400px)',
                marginTop: depth === 0 ? 'var(--forest-node-spacing, 24px)' : '16px',
                marginLeft: depth === 0 ? '0' : 'var(--forest-level-spacing, 80px)',
            }}
        >
            {/* Root Node Spine Connector */}
            {depth === 0 && (
                <div className="absolute -left-[20px] top-[26px] w-[20px] h-[2px] bg-[var(--forest-spine-color)] opacity-60" />
            )}

            {/* Header Area */}
            <div
                className="flex items-center justify-between p-4 cursor-pointer border-b border-[var(--forest-card-border)]"
                onClick={() => onToggle(node.id)}
            >
                <div className="flex items-center gap-3">
                    <div className={`
                        p-2 rounded-lg 
                        ${depth === 0 ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-700/30 text-slate-400'}
                    `}>
                        {depth === 0 ? <Activity size={18} /> : <Layers size={18} />}
                    </div>

                    <div className="flex flex-col">
                        <span className="text-[var(--text-primary)] font-medium text-sm line-clamp-1">
                            {node.title}
                        </span>

                        <div className="flex items-center gap-2 mt-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded border ${tag.color} font-mono tracking-wide`}>
                                {tag.label}
                            </span>
                            <span className="text-[10px] text-[var(--forest-text-muted)] font-mono">
                                {node.columnsUsed.length} COLUMNS
                            </span>
                        </div>
                    </div>
                </div>

                <div className="text-[var(--forest-text-muted)] transition-transform duration-200">
                    {node.isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
            </div>

            {/* Content Area (Expandable) */}
            {node.isExpanded && (
                <div className="p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* Summary Text */}
                    {node.result?.summary && (
                        <p className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed font-sans">
                            {node.result.summary}
                        </p>
                    )}

                    {/* Chart / Visualization Placeholder */}
                    {node.result?.image ? (
                        <div className="rounded-lg overflow-hidden border border-[var(--forest-card-border)] bg-black/20">
                            <img
                                src={node.result.image.startsWith('data:image') ? node.result.image : `data:image/png;base64,${node.result.image}`}
                                alt="Chart"
                                className="w-full h-auto object-contain max-h-[200px]"
                            />
                        </div>
                    ) : node.isLoading ? (
                        <div className="h-[150px] flex items-center justify-center text-[var(--text-secondary)] text-xs animate-pulse">
                            Generating visualization...
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6 px-4 bg-slate-900/30 rounded-lg border border-dashed border-slate-700/50">
                            <Activity className="text-slate-600 mb-2" size={20} />
                            <p className="text-xs text-slate-500 font-medium">Low Visualization Confidence</p>
                            <p className="text-[10px] text-slate-600 mt-1">Data quality insufficient for chart generation</p>
                        </div>
                    )}

                    {/* Drill Down Actions Footer */}
                    {hasDrillActions && (
                        <div className="mt-4 pt-3 border-t border-[var(--forest-card-border)]">
                            <p className="text-[10px] text-[var(--forest-text-muted)] mb-2 uppercase tracking-wider">
                                Suggested Analysis
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {node.drillDownActions.map((action, idx) => (
                                    <button
                                        key={idx}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDrillDown(node, action);
                                        }}
                                        className="
                                            flex items-center gap-1.5 px-3 py-1.5 rounded-md
                                            text-xs font-medium text-slate-300
                                            bg-slate-800/50 border border-slate-700
                                            hover:bg-blue-500/10 hover:border-blue-500/50 hover:text-blue-300
                                            transition-colors
                                        "
                                    >
                                        <PlayCircle size={12} />
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
