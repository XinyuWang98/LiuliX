import { useState } from 'react';
import { useEvidence } from '@/contexts/EvidenceContext';
import { FileText, ChevronDown, ChevronUp, Code } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { ChartImage } from '../insights/ChartImage';
import './ReportSummary.css';

export function ReportSummary() {
    const { records } = useEvidence();
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    // 过滤洞察链类型的证据
    const insightChainRecords = records.filter(r => r.type === 'insightChain');

    // 展开/收起证据
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

    // 导出 PDF
    const exportPDF = () => {
        const element = document.getElementById('report-content');
        if (!element) return;

        const opt: any = { // 类型断言
            margin: 10,
            filename: `DataPrism_报告_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
    };

    if (insightChainRecords.length === 0) {
        return (
            <div className="report-summary-container">
                <FileText size={48} className="report-summary-icon" />
                <p>暂无洞察链证据，请先完成数据分析并采纳证据</p>
            </div>
        );
    }

    return (
        <div className="report-summary">
            <div id="report-content" className="report-content">
                {/* AI 助手头像气泡 */}
                <div className="report-bubble ai-intro">
                    <div className="bubble-header">
                        <span className="ai-avatar">🤖</span>
                        <strong>AI 报告小助手</strong>
                    </div>
                    <p>已收集证据 #{String(insightChainRecords[0].id).padStart(3, '0')} - #{String(insightChainRecords[insightChainRecords.length - 1].id).padStart(3, '0')}，生成最终报告如下：</p>
                </div>

                {/* 遍历每条证据，生成独立气泡 */}
                {insightChainRecords.map((record) => {
                    const isExpanded = expandedIds.has(record.id);
                    const insightChain = record.metadata?.insightChain;

                    return (
                        <div key={record.id} className="report-bubble evidence-bubble">
                            <div className="bubble-header" onClick={() => toggleExpand(record.id)}>
                                <span className="evidence-number">#{String(record.id).padStart(3, '0')}</span>
                                <h3>{record.title}</h3>
                                <button className="expand-btn">
                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </button>
                            </div>

                            {isExpanded && insightChain && (
                                <div className="bubble-content">
                                    {/* 假设 */}
                                    <div className="section">
                                        <strong>假设：</strong>{insightChain.hypothesis.title}
                                    </div>

                                    {/* 遍历洞察节点 */}
                                    {insightChain.insights.map((node: any, nodeIdx: number) => (
                                        <div key={nodeIdx} className="insight-item">
                                            {/* 图表（如果是 base64） */}
                                            {node.chartImage && (
                                                <ChartImage
                                                    src={node.chartImage}
                                                    alt={`图表 ${nodeIdx + 1}`}
                                                    variant="report"
                                                    clickable={true}
                                                    downloadable={true}
                                                />
                                            )}

                                            {/* 表格降级 */}
                                            {node.tableData && (
                                                <div className="table-container">
                                                    <table>
                                                        <thead>
                                                            <tr>
                                                                {Object.keys(node.tableData[0] || {}).map(key => (
                                                                    <th key={key}>{key}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {node.tableData.slice(0, 5).map((row: any, rIdx: number) => (
                                                                <tr key={rIdx}>
                                                                    {Object.values(row).map((val, vIdx) => (
                                                                        <td key={vIdx}>{String(val)}</td>
                                                                    ))}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}

                                            {/* 结论 */}
                                            <div className="conclusion">
                                                <strong>结论：</strong>{node.conclusion}
                                            </div>

                                            {/* 代码（折叠） */}
                                            <details className="code-details">
                                                <summary>
                                                    <Code size={16} />
                                                    查看代码 ({node.codeLanguage.toUpperCase()})
                                                </summary>
                                                <pre>
                                                    <code>{node.code}</code>
                                                </pre>
                                            </details>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* 总体结论气泡 */}
                <div className="report-bubble ai-conclusion">
                    <div className="bubble-header">
                        <span className="ai-avatar">🤖</span>
                        <strong>总体结论</strong>
                    </div>
                    <p>基于以上 {insightChainRecords.length} 条洞察链分析，建议：</p>
                    <ul>
                        <li>对数据进行分层清洗，重点关注高影响字段</li>
                        <li>补充缺失值填充策略，避免偏差</li>
                        <li>定期复查重复数据，确保数据质量</li>
                    </ul>
                </div>
            </div>

            {/* 导出按钮（底部固定） */}
            <div className="report-actions">
                <button className="btn-export" onClick={exportPDF}>
                    <FileText size={20} />
                    下载完整报告 (PDF)
                </button>
            </div>
        </div>
    );
}
