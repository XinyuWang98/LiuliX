/**
 * 报告导出工具函数
 * 提供下载HTML/Markdown的便捷方法
 */

import { ReportData } from '@/types/report';
import { generateInteractiveHTML } from './reportGenerator';

/**
 * 下载文件到本地
 */
function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * 导出HTML报告
 */
export async function exportHTMLReport(data: ReportData, filename?: string) {
    const html = await generateInteractiveHTML(data);
    const finalFilename = filename || `DataPrism报告_${Date.now()}.html`;
    downloadFile(html, finalFilename, 'text/html;charset=utf-8');
}

/**
 * 导出Markdown报告
 */
export function exportMarkdownReport(data: ReportData, filename?: string) {
    let markdown = `# ${data.title}\n\n`;
    markdown += `> 生成时间：${new Date().toLocaleString('zh-CN')}\n\n`;

    data.sections.forEach(section => {
        markdown += `## ${section.title}\n\n`;
        markdown += `${section.content}\n\n`;

        if (section.code) {
            markdown += '```sql\n';
            markdown += section.code;
            markdown += '\n```\n\n';
        }
    });

    const finalFilename = filename || `DataPrism报告_${Date.now()}.md`;
    downloadFile(markdown, finalFilename, 'text/markdown;charset=utf-8');
}

/**
 * 复制报告到剪贴板（Markdown格式）
 */
export async function copyReportToClipboard(data: ReportData): Promise<boolean> {
    try {
        let markdown = `# ${data.title}\n\n`;
        data.sections.forEach(section => {
            markdown += `## ${section.title}\n${section.content}\n\n`;
        });

        await navigator.clipboard.writeText(markdown);
        return true;
    } catch (error) {
        console.error('复制失败:', error);
        return false;
    }
}
