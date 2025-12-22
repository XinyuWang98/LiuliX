/**
 * Chart.js图表生成辅助函数
 * 用于将数据转换为Chart.js Base64图片
 */

import { Chart, ChartConfiguration } from 'chart.js/auto';

export interface ChartData {
    labels: string[];
    datasets: Array<{
        label: string;
        data: number[];
        backgroundColor?: string | string[];
        borderColor?: string;
    }>;
}

/**
 * 生成Chart.js图表并返回Base64
 */
export async function generateChartBase64(
    type: 'bar' | 'line' | 'pie' | 'scatter',
    data: ChartData,
    title?: string
): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            // 创建临时canvas
            const canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 400;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('无法获取Canvas上下文'));
                return;
            }

            const config: ChartConfiguration = {
                type,
                data,
                options: {
                    responsive: false,
                    plugins: {
                        title: {
                            display: !!title,
                            text: title || ''
                        },
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    }
                }
            };

            const chart = new Chart(ctx, config);

            // 等待图表渲染完成
            setTimeout(() => {
                const base64 = canvas.toDataURL('image/png');
                chart.destroy();
                resolve(base64);
            }, 500);

        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 从DuckDB查询结果生成图表
 */
export function queryResultToChartData(
    rows: any[],
    xColumn: string,
    yColumn: string
): ChartData {
    return {
        labels: rows.map(row => String(row[xColumn])),
        datasets: [{
            label: yColumn,
            data: rows.map(row => Number(row[yColumn])),
            backgroundColor: 'rgba(102, 126, 234, 0.6)',
            borderColor: 'rgba(102, 126, 234, 1)'
        }]
    };
}
