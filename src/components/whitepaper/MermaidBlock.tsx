import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Loader2, AlertTriangle } from 'lucide-react';
import { logger } from '@/utils/logger';

interface MermaidBlockProps {
    chart: string;
    isDark?: boolean;
}

// Mermaid 全局初始化
mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose', // 允许HTML标签
    theme: 'base',
});

export const MermaidBlock: React.FC<MermaidBlockProps> = ({ chart, isDark = false }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svgContent, setSvgContent] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // 为每个图表生成唯一ID，避免冲突
    const id = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`).current;

    useEffect(() => {
        let mounted = true;

        const renderChart = async () => {
            if (!chart || !chart.trim()) return;

            setLoading(true);
            setError(null);

            try {
                // 根据主题配置 Mermaid
                // 注意：mermaid 配置是全局的，如果并发渲染多个图表可能彼此影响
                // 但在文档查看器场景下，通常是顺序渲染的
                mermaid.initialize({
                    startOnLoad: false,
                    theme: isDark ? 'dark' : 'default',
                    themeVariables: isDark ? {
                        // 暗色模式优化：提升对比度和可读性
                        primaryColor: '#60a5fa',        // 亮蓝色（原 #3b82f6 调亮）
                        primaryTextColor: '#f1f5f9',    // 高亮度文字
                        primaryBorderColor: '#60a5fa',
                        lineColor: '#cbd5e1',           // 连线颜色（原 #94a3b8 调亮）
                        secondaryColor: '#1e293b',      // 次要背景
                        tertiaryColor: '#334155',       // 第三级背景
                        textColor: '#f1f5f9',           // 主文字颜色（高对比）
                        mainBkg: '#0f172a',             // 主背景（更深）
                        secondaryBkg: '#1e293b',
                        tertiaryBkg: '#334155',
                        noteBkgColor: '#1e3a8a',        // 注释背景
                        noteTextColor: '#e0e7ff',       // 注释文字
                        activationBorderColor: '#60a5fa',
                        activationBkgColor: '#1e3a8a',  // 激活状态背景
                    } : {
                        // 亮色模式优化：确保阴影和边框清晰
                        primaryColor: '#3b82f6',
                        primaryTextColor: '#1e293b',
                        primaryBorderColor: '#2563eb',
                        lineColor: '#64748b',           // 连线颜色（原 #475569 调整）
                        secondaryColor: '#f1f5f9',
                        tertiaryColor: '#e2e8f0',
                        textColor: '#0f172a',           // 深色文字（高对比）
                        mainBkg: '#ffffff',
                        secondaryBkg: '#f8fafc',
                        tertiaryBkg: '#f1f5f9',
                        noteBkgColor: '#dbeafe',
                        noteTextColor: '#1e3a8a',
                        activationBorderColor: '#2563eb',
                        activationBkgColor: '#dbeafe',
                    }
                });

                const { svg } = await mermaid.render(id, chart);

                if (mounted) {
                    setSvgContent(svg);
                    setLoading(false);
                }
            } catch (err) {
                if (mounted) {
                    logger.error('UI', 'Mermaid 渲染失败', err);
                    setError('无法渲染图表，可以通过 "查看源码" 检查语法错误。');
                    setLoading(false);
                }
            }
        };

        renderChart();

        return () => {
            mounted = false;
        };
    }, [chart, isDark, id]);

    return (
        <div className="mermaid-block-container" style={{
            margin: '24px 0',
            padding: '24px',
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'center',
            overflowX: 'auto'
        }}>
            {loading && (
                <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
                    <Loader2 className="animate-spin" size={20} style={{ marginRight: 8 }} />
                    正在渲染图表...
                </div>
            )}

            {!loading && error && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--error)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                        <AlertTriangle size={20} style={{ marginRight: 8 }} />
                        {error}
                    </div>
                    <pre style={{
                        fontSize: 12,
                        background: 'var(--bg-code-block)',
                        padding: 8,
                        borderRadius: 4,
                        maxWidth: '100%',
                        overflowX: 'auto'
                    }}>
                        {chart}
                    </pre>
                </div>
            )}

            {!loading && !error && (
                <div
                    ref={containerRef}
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                    style={{ width: '100%', textAlign: 'center' }}
                />
            )}
        </div>
    );
};
