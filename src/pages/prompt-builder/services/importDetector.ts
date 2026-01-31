/**
 * Python 包导入识别服务
 * 复用 codeCleanser.ts 的逻辑，返回结构化的 DetectedImport[]
 */

import { cleanseCode } from '@/utils/codeCleanser';
import { DetectedImport } from '../types';

/**
 * 从 import 语句中提取模块名
 * @param statement - import 语句（如 'import pandas as pd'）
 * @returns 模块名（如 'pandas'）
 */
function extractModuleName(statement: string): string {
    const trimmed = statement.trim();

    // 匹配 "import xxx" 或 "import xxx as yyy"
    const importMatch = trimmed.match(/^import\s+(\w+)/);
    if (importMatch) {
        return importMatch[1];
    }

    // 匹配 "from xxx import ..."
    const fromMatch = trimmed.match(/^from\s+(\w+)/);
    if (fromMatch) {
        return fromMatch[1];
    }

    // 匹配 "from xxx.yyy import ..."（取第一个模块名）
    const fromDotMatch = trimmed.match(/^from\s+([\w.]+)/);
    if (fromDotMatch) {
        return fromDotMatch[1].split('.')[0];
    }

    return 'unknown';
}

/**
 * 从代码中自动识别 Python 包导入
 * @param code - Python 代码
 * @returns DetectedImport 数组
 */
export function detectImports(code: string): DetectedImport[] {
    if (!code || !code.trim()) {
        return [];
    }

    // 使用 codeCleanser 提取所有 import 语句
    const { globalSetup } = cleanseCode(code);

    if (!globalSetup) {
        return [];
    }

    // 将 import 语句转换为 DetectedImport 数组
    const imports: DetectedImport[] = [];
    const lines = globalSetup.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        imports.push({
            statement: trimmed,
            source: 'auto',
            module: extractModuleName(trimmed)
        });
    }

    return imports;
}
