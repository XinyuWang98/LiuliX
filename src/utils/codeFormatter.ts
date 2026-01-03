/**
 * 代码格式化工具
 * 统一 SQL 和 Python 代码格式化逻辑
 */

/**
 * 格式化 SQL 代码
 * 将紧凑的单行 SQL 转换为易读的多行格式
 */
export function formatSQL(sql: string): string {
    if (!sql) return '';

    let formatted = sql
        // 1. 预处理：去除多余空格
        .replace(/\s+/g, ' ')
        .trim();

    // 2. 关键字换行规则
    const keywords = [
        'CREATE OR REPLACE TABLE',
        'CREATE TABLE',
        'SELECT',
        'FROM',
        'WHERE',
        'GROUP BY',
        'ORDER BY',
        'HAVING',
        'LIMIT',
        'UNION',
        'LEFT JOIN',
        'RIGHT JOIN',
        'INNER JOIN',
        'OUTER JOIN',
        'JOIN',
        'INSERT INTO',
        'UPDATE',
        'DELETE FROM',
        'SET',
        'VALUES'
    ];

    // 3. 在关键字前插入换行符（除了开头）
    keywords.forEach(kw => {
        const regex = new RegExp(`\\b${kw}\\b`, 'gi');
        formatted = formatted.replace(regex, (match) => `\n${match.toUpperCase()}`);
    });

    // 4. 处理 AND / OR，使其缩进
    formatted = formatted.replace(/\b(AND|OR)\b/gi, '\n  $1');

    // 5. 修复开头多余的换行
    return formatted.trim();
}

/**
 * 格式化 Python 代码
 * 规范化缩进并改善可读性
 */
export function formatPython(code: string): string {
    if (!code) return '';

    const lines = code.split('\n');
    let indentLevel = 0;
    const indentSize = 4; // 标准 Python 缩进为 4 空格
    const formatted: string[] = [];

    for (let line of lines) {
        // 移除行首尾空格
        const trimmed = line.trim();
        if (!trimmed) {
            formatted.push('');
            continue;
        }

        // 检测缩进减少（如 else, elif, except, finally, return 等）
        if (/^(else|elif|except|finally|return|break|continue|pass)(\s|:)/i.test(trimmed)) {
            indentLevel = Math.max(0, indentLevel - 1);
        }

        // 应用缩进
        const indent = ' '.repeat(indentLevel * indentSize);
        formatted.push(indent + trimmed);

        // 检测缩进增加（如以 : 结尾的行）
        if (trimmed.endsWith(':')) {
            indentLevel++;
        }
        // 检测缩进减少（如 return, break, continue, pass 等独立语句）
        else if (/^(return|break|continue|pass)(\s|$)/i.test(trimmed)) {
            indentLevel = Math.max(0, indentLevel - 1);
        }
    }

    return formatted.join('\n');
}

/**
 * 通用代码格式化函数
 * @param code 原始代码
 * @param language 语言类型
 * @returns 格式化后的代码
 */
export function formatCode(code: string, language: 'sql' | 'python' | 'json'): string {
    if (!code) return '';

    switch (language) {
        case 'sql':
            return formatSQL(code);
        case 'python':
            return formatPython(code);
        case 'json':
            try {
                return JSON.stringify(JSON.parse(code), null, 2);
            } catch {
                return code; // 无效 JSON，返回原始代码
            }
        default:
            return code;
    }
}
