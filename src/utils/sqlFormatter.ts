/**
 * 简单的 SQL 格式化工具
 * 用于将紧凑的单行 SQL 转换为易读的多行格式
 */
export function formatSQL(sql: string): string {
    if (!sql) return '';

    let formatted = sql
        // 1. 预处理：去除多余空格
        .replace(/\s+/g, ' ')
        .trim();

    // 2. 关键子换行规则
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
        'JOIN'
    ];

    // 3. 在关键字前插入换行符 (除了开头)
    keywords.forEach(kw => {
        const regex = new RegExp(`\\b${kw}\\b`, 'gi');
        formatted = formatted.replace(regex, (match) => `\n${match.toUpperCase()}`);
    });

    // 4. 处理 AND / OR，使其缩进
    formatted = formatted.replace(/\b(AND|OR)\b/gi, '\n  $1');

    // 5. 处理逗号，使其换行 (可选，太长时换行)
    // formatted = formatted.replace(/,/g, ',\n  '); 
    // 暂时只在 SELECT 列表中换行可能会误伤函数参数，这里只做简单处理：
    // 如果是 CREATE TABLE AS SELECT ...，尝试在 SELECT 后的字段列表换行

    // 6. 修复开头多余的换行
    return formatted.trim();
}
