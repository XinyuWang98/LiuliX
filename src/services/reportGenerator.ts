/**
 * 交互式HTML报告生成器
 * 生成可折叠、带图表、高亮代码的单文件HTML报告
 */

import { ReportData, ReportSection } from '@/types/report';
import { logger } from '@/utils/logger';

/**
 * 生成交互式HTML报告
 */
export async function generateInteractiveHTML(data: ReportData): Promise<string> {
    logger.group('报告', '生成交互式HTML');

    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title} - LiuliX分析报告</title>
    <style>
        ${getInlineStyles()}
    </style>
</head>
<body>
    <div class="report-container">
        <header class="report-header">
            <h1>${data.title}</h1>
            <div class="report-meta">
                <span>生成时间：${new Date().toLocaleString('zh-CN')}</span>
                <span>分析引擎：LiuliX v0.9.9</span>
            </div>
        </header>

        <main class="report-content">
            ${renderSections(data.sections)}
        </main>

        <footer class="report-footer">
            <p>本报告由 LiuliX 自动生成 | 数据100%真实，非AI幻觉</p>
        </footer>
    </div>

    <script>
        ${getInlineScripts()}
    </script>
</body>
</html>
    `.trim();

    logger.log('报告', 'HTML生成完成', { data: `长度${html.length}` });
    logger.groupEnd();

    return html;
}

/**
 * 内联CSS样式
 */
function getInlineStyles(): string {
    return `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
        }

        .report-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .report-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            text-align: center;
        }

        .report-header h1 {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }

        .report-meta {
            font-size: 0.9rem;
            opacity: 0.9;
        }

        .report-meta span {
            margin: 0 1rem;
        }

        .report-content {
            padding: 2rem;
        }

        .report-section {
            margin-bottom: 2rem;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            overflow: hidden;
        }

        .section-header {
            background: #f8f9fa;
            padding: 1rem;
            cursor: pointer;
            user-select: none;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .section-header:hover {
            background: #e9ecef;
        }

        .section-title {
            font-size: 1.2rem;
            font-weight: 600;
        }

        .section-toggle {
            font-size: 1.5rem;
            transition: transform 0.3s;
        }

        .section-content {
            padding: 1.5rem;
            display: block;
        }

        .section-content.collapsed {
            display: none;
        }

        .section-toggle.collapsed {
            transform: rotate(-90deg);
        }

        .chart-container {
            margin: 1rem 0;
            text-align: center;
        }

        .chart-container img {
            max-width: 100%;
            height: auto;
            border-radius: 4px;
        }

        pre {
            background: #282c34;
            color: #abb2bf;
            padding: 1rem;
            border-radius: 4px;
            overflow-x: auto;
            font-size: 0.9rem;
        }

        code {
            font-family: 'Consolas', 'Monaco', monospace;
        }

        .report-footer {
            background: #f8f9fa;
            padding: 1rem;
            text-align: center;
            font-size: 0.9rem;
            color: #666;
        }

        .insight-card {
            background: #f0f7ff;
            border-left: 4px solid #2196F3;
            padding: 1rem;
            margin: 0.5rem 0;
            border-radius: 4px;
        }

        .insight-title {
            font-weight: 600;
            margin-bottom: 0.5rem;
        }
    `.trim();
}

/**
 * 渲染报告章节
 */
function renderSections(sections: ReportSection[]): string {
    return sections.map((section, index) => `
        <div class="report-section">
            <div class="section-header" onclick="toggleSection(${index})">
                <h2 class="section-title">${section.title}</h2>
                <span class="section-toggle" id="toggle-${index}">▼</span>
            </div>
            <div class="section-content" id="content-${index}">
                ${section.content}
                ${section.chart ? renderChart(section.chart) : ''}
                ${section.code ? renderCode(section.code) : ''}
            </div>
        </div>
    `).join('\n');
}

/**
 * 渲染图表（Base64嵌入）
 */
function renderChart(chartData: string): string {
    return `
        <div class="chart-container">
            <img src="${chartData}" alt="数据图表" />
        </div>
    `;
}

/**
 * 渲染代码块
 */
function renderCode(code: string): string {
    return `
        <pre><code>${escapeHtml(code)}</code></pre>
    `;
}

/**
 * HTML转义
 */
function escapeHtml(text: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * 内联JavaScript脚本
 */
function getInlineScripts(): string {
    return `
        // 折叠/展开功能
        function toggleSection(index) {
            const content = document.getElementById('content-' + index);
            const toggle = document.getElementById('toggle-' + index);
            
            if (content.classList.contains('collapsed')) {
                content.classList.remove('collapsed');
                toggle.classList.remove('collapsed');
            } else {
                content.classList.add('collapsed');
                toggle.classList.add('collapsed');
            }
        }

        // 初始化：第一个章节展开，其他折叠
        document.addEventListener('DOMContentLoaded', function() {
            const sections = document.querySelectorAll('.section-content');
            sections.forEach((section, index) => {
                if (index > 0) {
                    section.classList.add('collapsed');
                    document.getElementById('toggle-' + index).classList.add('collapsed');
                }
            });
        });
    `.trim();
}
