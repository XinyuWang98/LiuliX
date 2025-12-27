/**
 * Jupyter Notebook (.ipynb) 格式生成工具
 */

import { ReportCell } from '@/types/report';

/**
 * 生成.ipynb格式的JSON
 */
export function generateIpynb(cells: ReportCell[], title: string) {
    return {
        cells: cells.map(cell => ({
            cell_type: 'code',
            execution_count: null,
            metadata: {
                id: cell.id,
                depth: cell.depth
            },
            source: cell.code.split('\n'),
            outputs: []
        })),
        metadata: {
            kernelspec: {
                display_name: 'Python 3',
                language: 'python',
                name: 'python3'
            },
            language_info: {
                name: 'python',
                version: '3.10.0'
            },
            colab: {
                name: title,
                provenance: []
            }
        },
        nbformat: 4,
        nbformat_minor: 0
    };
}

/**
 * 下载.ipynb文件
 */
export function downloadIpynb(content: object, filename: string) {
    const blob = new Blob([JSON.stringify(content, null, 2)], {
        type: 'application/x-ipynb+json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}
