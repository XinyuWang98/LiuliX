import { ReportDocument } from '@/types/report';
import { formatTimestamp } from '@/utils/dateUtils';

/**
 * 将报告 cells 转换为 Markdown 字符串
 */
export function generateMarkdown(document: ReportDocument): string {
    const lines: string[] = [];

    // 标题
    lines.push(`# ${document.title}`);
    lines.push(`> 生成时间: ${formatTimestamp(document.signedAt || Date.now())}`);
    if (document.signedBy) {
        lines.push(`> 审计人: ${document.signedBy}`);
    }
    lines.push('');

    // 遍历单元格
    document.cells.forEach((cell, index) => {
        lines.push(`## 步骤 ${index + 1}`);

        // 摘要/结论
        if (cell.output.summary) {
            lines.push(cell.output.summary);
            lines.push('');
        }

        // 代码块
        if (cell.code) {
            lines.push('```' + cell.language);
            lines.push(cell.code);
            lines.push('```');
            lines.push('');
        }

        // 审计备注
        if (cell.auditNote) {
            lines.push(`> **审计备注**: ${cell.auditNote}`);
            lines.push('');
        }

        lines.push('---');
        lines.push('');
    });

    return lines.join('\n');
}

/**
 * 生成 HTML 报告内容
 * V0 MVP: 简单的单文件 HTML，包含内联样式
 */
export function generateHTML(document: ReportDocument): string {

    // 简单的 Markdown -> HTML 转换 (V0 使用极简替换，实际项目可能需要 marked 库)
    // 这里为了不引入新依赖，我们构建一个基础的 HTML 结构，主要展示内容
    // 实际内容如果需要渲染 Markdown，建议在前端渲染好 innerHTML 传进来，或者这里只做简单文本处理

    // MVP策略：直接将内容放入 <pre> 标签或者简单的容器中，
    // 或者只导出核心结构的 HTML 表格化展示。
    // 为了美观，我们使用一个构建好的 HTML 模板，将核心数据注入。

    const cellsHtml = document.cells.map((cell, index) => `
        <div class="cell">
            <div class="cell-header">
                <h3>步骤 ${index + 1}</h3>
                <span class="badge ${cell.auditStatus.toLowerCase()}">${cell.auditStatus}</span>
            </div>
            
            ${cell.output.summary ? `<div class="summary">${cell.output.summary}</div>` : ''}
            
            <div class="code-block">
                <pre><code class="language-${cell.language}">${cell.code}</code></pre>
            </div>
            
            ${cell.output.chartImage ? `
            <div class="chart-container">
                <img src="${cell.output.chartImage}" alt="Chart" />
            </div>` : ''}
            
            ${cell.auditNote ? `<div class="audit-note"><strong>审计备注:</strong> ${cell.auditNote}</div>` : ''}
        </div>
    `).join('\n');

    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${document.title}</title>
    <style>
        :root {
            --primary: #00E5FF;
            --bg: #0A0A0A;
            --surface: #1A1A1A;
            --text: #E0E0E0;
            --border: #333;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg);
            color: var(--text);
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
            line-height: 1.6;
        }
        h1 { border-bottom: 2px solid var(--primary); padding-bottom: 10px; }
        .meta { color: #888; font-size: 0.9em; margin-bottom: 40px; }
        
        .cell {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
        }
        .cell-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            border-bottom: 1px solid var(--border);
            padding-bottom: 10px;
        }
        .cell-header h3 { margin: 0; color: var(--primary); }
        
        .code-block {
            background: #000;
            padding: 15px;
            border-radius: 6px;
            overflow-x: auto;
            font-family: 'Consolas', monospace;
            margin: 15px 0;
            border: 1px solid #333;
        }
        
        .chart-container img {
            max-width: 100%;
            border-radius: 4px;
            border: 1px solid var(--border);
        }
        
        .audit-note {
            background: rgba(255, 193, 7, 0.1);
            border-left: 3px solid #FFC107;
            padding: 10px;
            margin-top: 15px;
            font-size: 0.9em;
        }
        
        .badge {
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            text-transform: uppercase;
        }
        .badge.approved { background: rgba(76, 175, 80, 0.2); color: #4CAF50; }
        .badge.pending { background: rgba(255, 193, 7, 0.2); color: #FFC107; }
    </style>
</head>
<body>
    <h1>${document.title}</h1>
    <div class="meta">
        生成的报告 • ${formatTimestamp(Date.now())} 
        ${document.signedBy ? `• 审计人: ${document.signedBy}` : ''}
    </div>
    
    ${cellsHtml}
    
    <footer style="text-align: center; margin-top: 50px; color: #666; font-size: 0.8em;">
        Generated by LiuliX DataPrism
    </footer>
</body>
</html>
    `;
}
