import { useEvidence } from '@/contexts/EvidenceContext';
import { useI18n } from '@/contexts/I18nContext';
import { Download, Copy, FileText, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { ReportSummary } from './ReportSummary';
import './ReportGenerator.css';

// 图标尺寸常量
const ICON_SIZE_MEDIUM = 18; // 中等图标尺寸

export function ReportGenerator() {
    const { t } = useI18n();
    const { records } = useEvidence();
    const [copied, setCopied] = useState(false);

    // 格式化时间戳为可读格式
    const formatTimestamp = (timestamp: number): string => {
        const date = new Date(timestamp);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // 获取证据类型的翻译
    const getTypeLabel = (type: string): string => {
        return t(`evidence.type.${type}` as any) || type;
    };

    // 生成 Markdown 格式报告
    const generateMarkdownReport = (): string => {
        const now = new Date();
        const timestamp = now.toLocaleString('zh-CN');

        // 按置顶和时间排序
        const sortedRecords = [...records].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return b.timestamp - a.timestamp;
        });

        let markdown = `# DataPrism 数据分析报告\n\n`;
        markdown += `**生成时间**: ${timestamp}\n`;
        markdown += `**数据源**: 示例数据\n`;
        markdown += `**证据总数**: ${records.length} 条\n\n`;

        markdown += `---\n\n`;

        // 按类型分组
        const cleaningRecords = sortedRecords.filter(r => r.type === 'cleaning');
        const analysisRecords = sortedRecords.filter(r => r.type === 'analysis');
        const insightRecords = sortedRecords.filter(r => r.type === 'insight');
        const visualizationRecords = sortedRecords.filter(r => r.type === 'visualization');

        // 数据清洗记录
        if (cleaningRecords.length > 0) {
            markdown += `## 数据清洗记录\n\n`;
            cleaningRecords.forEach((record, index) => {
                markdown += `### ${index + 1}. ${record.title}\n\n`;
                markdown += `- **时间**: ${formatTimestamp(record.timestamp)}\n`;
                markdown += `- **类型**: ${getTypeLabel(record.type)}\n`;

                if (record.beforeCount !== undefined && record.afterCount !== undefined) {
                    markdown += `- **影响**: ${record.beforeCount.toLocaleString()} 行 → ${record.afterCount.toLocaleString()} 行`;
                    if (record.affectedRows !== undefined) {
                        const change = record.afterCount - record.beforeCount;
                        markdown += ` (${change > 0 ? '+' : ''}${change.toLocaleString()} 行)\n`;
                    } else {
                        markdown += `\n`;
                    }
                } else if (record.affectedRows !== undefined) {
                    markdown += `- **影响**: ${record.affectedRows.toLocaleString()} 行\n`;
                }

                markdown += `- **操作说明**: ${record.description}\n`;

                if (record.sql) {
                    markdown += `- **SQL**:\n  \`\`\`sql\n  ${record.sql}\n  \`\`\`\n`;
                }

                if (record.tags && record.tags.length > 0) {
                    markdown += `- **标签**: ${record.tags.join(', ')}\n`;
                }

                markdown += `\n`;
            });
            markdown += `---\n\n`;
        }

        // 分析记录
        if (analysisRecords.length > 0) {
            markdown += `## 数据分析记录\n\n`;
            analysisRecords.forEach((record, index) => {
                markdown += `### ${index + 1}. ${record.title}\n\n`;
                markdown += `- **时间**: ${formatTimestamp(record.timestamp)}\n`;
                markdown += `- **分析结果**: ${record.description}\n`;

                if (record.sql) {
                    markdown += `- **分析 SQL**:\n  \`\`\`sql\n  ${record.sql}\n  \`\`\`\n`;
                }

                markdown += `\n`;
            });
            markdown += `---\n\n`;
        }

        // 关键洞见
        if (insightRecords.length > 0) {
            markdown += `## 关键洞见\n\n`;
            insightRecords.forEach((record, index) => {
                markdown += `### ${index + 1}. ${record.title}\n\n`;
                markdown += `${record.description}\n\n`;

                if (record.metadata) {
                    markdown += `**详细信息**:\n`;
                    Object.entries(record.metadata).forEach(([key, value]) => {
                        markdown += `- ${key}: ${value}\n`;
                    });
                    markdown += `\n`;
                }
            });
            markdown += `---\n\n`;
        }

        // 可视化建议
        if (visualizationRecords.length > 0) {
            markdown += `## 可视化建议\n\n`;
            visualizationRecords.forEach((record, index) => {
                markdown += `### ${index + 1}. ${record.title}\n\n`;
                markdown += `${record.description}\n\n`;
            });
            markdown += `---\n\n`;
        }

        // 后续计划（预留）
        markdown += `## 后续计划\n\n`;
        markdown += `_后续升级计划：_\n`;
        markdown += `- [ ] 升级为交互式 HTML 报告（支持点击证据展开 SQL）\n`;
        markdown += `- [ ] 嵌入数据表格和图表\n`;
        markdown += `- [ ] 支持主题样式切换\n`;
        markdown += `- [ ] 单文件 HTML 导出\n\n`;

        markdown += `---\n\n`;
        markdown += `*本报告由 DataPrism 自动生成*\n`;

        return markdown;
    };

    // 复制到剪贴板
    const handleCopy = async () => {
        const markdown = generateMarkdownReport();
        try {
            await navigator.clipboard.writeText(markdown);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('复制失败:', err);
        }
    };

    // 下载 Markdown 文件
    const handleDownload = () => {
        const markdown = generateMarkdownReport();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `report_${timestamp}.md`;

        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="report-generator">
            {/* 头部 */}
            <div className="report-header">
                <div className="report-title">
                    <FileText size={ICON_SIZE_MEDIUM + 4} />
                    <h3>{t('report.title')}</h3>
                </div>
                <div className="report-actions">
                    <button
                        className="btn-secondary report-btn"
                        onClick={handleCopy}
                        title={t('report.copyToClipboard')}
                    >
                        {copied ? (
                            <>
                                <CheckCircle size={ICON_SIZE_MEDIUM} />
                                {t('report.copied')}
                            </>
                        ) : (
                            <>
                                <Copy size={ICON_SIZE_MEDIUM} />
                                {t('report.copy')}
                            </>
                        )}
                    </button>
                    <button
                        className="btn-primary report-btn"
                        onClick={handleDownload}
                        title={t('report.downloadMarkdown')}
                    >
                        <Download size={ICON_SIZE_MEDIUM} />
                        {t('report.download')}
                    </button>
                </div>
            </div>

            {/* 报告内容 - 使用新的对话式报告页 */}
            <div className="report-preview">
                <ReportSummary />
            </div>
        </div>
    );
}
