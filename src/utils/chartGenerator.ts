/**
 * Chart.js 图表生成器工具
 * 用于洞察节点的图表创建、更新、销毁
 */

import { Chart, ChartConfiguration, ChartType as ChartJSType, registerables } from 'chart.js';
import { ChartType, ChartData } from '@/types/insightChain';

// 注册 Chart.js 所有组件
Chart.register(...registerables);

// Chart.js 类型映射
const CHART_TYPE_MAP: Record<ChartType, ChartJSType> = {
    histogram: 'bar',     // 直方图用柱状图实现
    scatter: 'scatter',   // 散点图
    bar: 'bar',           // 柱状图
    line: 'line',         // 折线图
    box: 'bar',           // 箱线图暂时用柱状图模拟
    table: 'bar',         // 表格降级（不应调用此函数）
};

/**
 * 创建 Chart.js 图表实例
 * @param canvasRef - Canvas 元素引用
 * @param chartType - 洞察链图表类型
 * @param chartData - Chart.js 数据
 * @returns Chart.js 实例
 */
export function createChart(
    canvasRef: HTMLCanvasElement,
    chartType: ChartType,
    chartData: ChartData
): Chart | null {
    if (chartType === 'table') {
        console.warn('表格类型不应调用 createChart');
        return null;
    }

    try {
        const config: ChartConfiguration = {
            type: CHART_TYPE_MAP[chartType] || 'bar',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2, // 宽高比 2:1
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: 'var(--text-primary)',
                            font: {
                                size: 12,
                            },
                        },
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'var(--bg-panel)',
                        titleColor: 'var(--text-primary)',
                        bodyColor: 'var(--text-secondary)',
                        borderColor: 'var(--border)',
                        borderWidth: 1,
                    },
                },
                scales: chartType === 'scatter' || chartType === 'line' || chartType === 'bar' || chartType === 'histogram' ? {
                    x: {
                        grid: {
                            color: 'var(--border-light)',
                        },
                        ticks: {
                            color: 'var(--text-secondary)',
                        },
                    },
                    y: {
                        grid: {
                            color: 'var(--border-light)',
                        },
                        ticks: {
                            color: 'var(--text-secondary)',
                        },
                    },
                } : undefined,
            },
        };

        return new Chart(canvasRef, config);
    } catch (error) {
        console.error('创建图表失败', error);
        return null;
    }
}

/**
 * 销毁 Chart.js 图表实例（防止内存泄漏）
 * @param chartInstance - Chart.js 实例
 */
export function destroyChart(chartInstance: Chart | null): void {
    if (chartInstance) {
        chartInstance.destroy();
    }
}

/**
 * 将 Chart.js 图表转换为 Base64 图片
 * @param chartInstance - Chart.js 实例
 * @returns Base64 字符串
 */
export function chartToBase64(chartInstance: Chart): string | null {
    try {
        const canvas = chartInstance.canvas;
        if (!canvas) {
            console.error('Chart 实例没有关联的 Canvas');
            return null;
        }

        return canvas.toDataURL('image/png');
    } catch (error) {
        console.error('图表转Base64失败:', error);
        return null;
    }
}

/**
 * 通过Canvas ID转换为Base64
 * @param canvasId - Canvas元素ID
 * @param format - 图片格式，default为'image/png'
 * @param quality - 图片质量(0-1)，仅对'image/jpeg'有效
 * @returns Base64字符串或null
 */
export function canvasToBase64(
    canvasId: string,
    format: 'image/png' | 'image/jpeg' = 'image/png',
    quality: number = 0.92
): string | null {
    try {
        const canvas = validateCanvas(canvasId);
        if (!canvas) {
            return null;
        }

        // PNG格式不需要quality参数
        if (format === 'image/png') {
            return canvas.toDataURL(format);
        }

        return canvas.toDataURL(format, quality);
    } catch (error) {
        console.error(`Canvas转Base64失败 (${canvasId}):`, error);
        return null;
    }
}

/**
 * 验证Canvas元素是否存在
 * @param canvasId - Canvas元素ID
 * @returns Canvas元素或null
 */
export function validateCanvas(canvasId: string): HTMLCanvasElement | null {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;

    if (!canvas) {
        console.error(`❌ Canvas元素不存在: ${canvasId}`);
        return null;
    }

    if (!(canvas instanceof HTMLCanvasElement)) {
        console.error(`❌ 元素不是Canvas: ${canvasId}`);
        return null;
    }

    return canvas;
}

/**
 * 更新图表数据
 * @param chartInstance - Chart.js 实例
 * @param newData - 新数据
 */
export function updateChart(chartInstance: Chart, newData: ChartData): void {
    chartInstance.data = newData;
    chartInstance.update();
}
