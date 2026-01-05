export const PYTHON_KEYWORDS = ['import', 'def', 'print', 'class', 'from'];
export const SQL_KEYWORDS = ['SELECT', 'FROM', 'WHERE', 'JOIN'];

/**
 * 检测代码语言
 * @param code - 代码字符串
 * @returns 'python' | 'sql' | 'unknown'
 */
export function detectLanguage(code: string): 'python' | 'sql' | 'unknown' {
    if (!code || code.trim().length === 0) return 'unknown';
    
    const upperCode = code.toUpperCase();
    
    // 优先检测 Python 关键词（因为 Python 代码可能包含 SQL 字符串）
    if (PYTHON_KEYWORDS.some(kw => code.includes(kw))) {
        return 'python';
    }
    
    // 检测 SQL 关键词
    if (SQL_KEYWORDS.some(kw => upperCode.includes(kw))) {
        return 'sql';
    }
    
    return 'unknown';
}
