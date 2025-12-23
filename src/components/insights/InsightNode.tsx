import { useEffect, useRef, useState } from 'react';
import { Copy, Check, ThumbsUp, ThumbsDown } from 'lucide-react';
import { InsightNode as InsightNodeType } from '@/types/insightChain';
import { createChart, destroyChart, chartToBase64 } from '@/utils/chartGenerator';
import { Chart } from 'chart.js';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css'; // 暗色主题
import { logger } from '../../utils/logger';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-sql';
import './InsightNode.css';

interface InsightNodeProps {
    node: InsightNodeType;
    onAdopt: () => void;
    onIgnore: () => void;
}

export function InsightNode({ node, onAdopt, onIgnore }: InsightNodeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<Chart | null>(null);
    const [isCopied, setIsCopied] = useState(false);
    const [isCodeExpanded, setIsCodeExpanded] = useState(false);
    const [chartBase64, setChartBase64] = useState<string | null>(null);

    // 创建图表
    useEffect(() => {
        if (node.chartType !== 'table' && node.chartData && canvasRef.current) {
            chartInstanceRef.current = createChart(canvasRef.current, node.chartType, node.chartData);

            // 图表渲染后立即转换为Base64
            setTimeout(() => {
                if (chartInstanceRef.current) {
                    const base64 = chartToBase64(chartInstanceRef.current);
                    if (base64) {
                        setChartBase64(base64);
                        logger.log('UI', '图表Base64已生成', { data: { preview: base64.substring(0, 50) + '...' } });
                    }
                }
            }, 100); // 等待图表完全渲染
        }

        // 清理函数
        return () => {
            if (chartInstanceRef.current) {
                destroyChart(chartInstanceRef.current);
                chartInstanceRef.current = null;
            }
        };
    }, [node.chartType, node.chartData]);

    // 代码高亮
    useEffect(() => {
        if (isCodeExpanded) {
            Prism.highlightAll();
        }
    }, [isCodeExpanded]);

    // 复制代码
    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(node.code);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('复制失败', err);
        }
    };

    return (
        <div className={`insight-node ${node.isAdopted ? 'adopted' : ''}`}>
            {/* 图表区域 */}
            {node.chartType !== 'table' && node.chartData && (
                <div className="insight-node__chart">
                    <canvas ref={canvasRef} />
                </div>
            )}

            {/* 表格降级显示 */}
            {node.chartType === 'table' && node.tableData && (
                <div className="insight-node__table">
                    <table>
                        <thead>
                            <tr>
                                {Object.keys(node.tableData[0] || {}).map(key => (
                                    <th key={key}>{key}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {node.tableData.slice(0, 10).map((row, idx) => (
                                <tr key={idx}>
                                    {Object.values(row).map((val, i) => (
                                        <td key={i}>{String(val)}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {node.tableData.length > 10 && (
                        <p className="insight-node__table-hint">
                            仅显示前 10 行，共 {node.tableData.length} 行
                        </p>
                    )}
                </div>
            )}

            {/* 结论 */}
            <div className="insight-node__conclusion">
                <strong>结论：</strong>
                {node.conclusion}
            </div>

            {/* 代码折叠区 */}
            <details
                className="insight-node__code"
                open={isCodeExpanded}
                onToggle={(e) => setIsCodeExpanded((e.target as HTMLDetailsElement).open)}
            >
                <summary className="insight-node__code-summary">
                    查看代码 ({node.codeLanguage.toUpperCase()})
                    <button
                        className="insight-node__copy-btn"
                        onClick={(e) => {
                            e.preventDefault();
                            handleCopyCode();
                        }}
                        title="复制代码"
                    >
                        {isCopied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                </summary>
                <div className="insight-node__code-block">
                    <pre>
                        <code className={`language-${node.codeLanguage}`}>
                            {node.code}
                        </code>
                    </pre>
                </div>
            </details>

            {/* 操作按钮 */}
            {!node.isAdopted && (
                <div className="insight-node__actions">
                    <button
                        className="btn-adopt"
                        onClick={() => {
                            logger.log('UI', '采纳洞察', { data: { hasChart: chartBase64 ? '已生成' : '未生成' } });
                            onAdopt();
                        }}
                    >
                        <ThumbsUp size={16} />
                        采纳
                    </button>
                    <button className="btn-ignore" onClick={onIgnore}>
                        <ThumbsDown size={16} />
                        忽略
                    </button>
                </div>
            )}

            {node.isAdopted && (
                <div className="insight-node__adopted-badge">
                    <Check size={16} />
                    已采纳
                </div>
            )}
        </div>
    );
}
