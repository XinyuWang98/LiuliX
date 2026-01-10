/**
 * 代码清洗工具
 * MVP 规则：只提取以 "import " 或 "from " 开头的行
 * 
 * @description 用于左右分栏报告模块，将 import 语句提取到 Global Setup
 */

/**
 * 清洗结果接口
 */
export interface CleanseResult {
    /** 所有 import 语句 */
    globalSetup: string;
    /** 去除 import 后的代码 */
    presentationCode: string;
}

/**
 * 从单个代码块中提取 import 语句
 * @param rawCode 原始代码
 * @returns 清洗结果
 */
export function cleanseCode(rawCode: string): CleanseResult {
    if (!rawCode) {
        return { globalSetup: '', presentationCode: '' };
    }

    const lines = rawCode.split('\n');
    const imports: string[] = [];
    const others: string[] = [];

    for (const line of lines) {
        const trimmed = line.trim();
        // MVP 规则：只匹配以 "import " 或 "from " 开头的行
        if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
            imports.push(line);
        } else {
            others.push(line);
        }
    }

    return {
        globalSetup: imports.join('\n'),
        presentationCode: others.join('\n').trim()
    };
}

/**
 * 合并多个代码块的 import 语句（去重排序）
 * @param codes 多个代码块的数组
 * @returns 合并后的 import 语句
 */
export function mergeGlobalSetup(codes: string[]): string {
    const importSet = new Set<string>();

    for (const code of codes) {
        if (!code) continue;
        const { globalSetup } = cleanseCode(code);
        globalSetup.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed) {
                importSet.add(trimmed);
            }
        });
    }

    // 按字母排序，import 在前，from 在后
    return Array.from(importSet)
        .sort((a, b) => {
            const aIsFrom = a.startsWith('from');
            const bIsFrom = b.startsWith('from');
            if (aIsFrom !== bIsFrom) return aIsFrom ? 1 : -1;
            return a.localeCompare(b);
        })
        .join('\n');
}
