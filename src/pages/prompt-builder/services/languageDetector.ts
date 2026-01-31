import { CodeLanguage } from '../types';

/**
 * 语言自动识别服务
 * 通过正则匹配识别代码语言（Python/SQL）
 */

export function detectLanguage(code: string): CodeLanguage {
    if (!code || code.trim().length === 0) {
        return CodeLanguage.UNKNOWN;
    }

    // 优先级匹配（SQL 优先，因为 Python 可能包含 SQL 字符串）
    const patterns: Array<{ lang: CodeLanguage; regex: RegExp }> = [
        // SQL 特征
        {
            lang: CodeLanguage.SQL,
            regex: /^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|WITH)\s/im
        },
        // Python 特征
        {
            lang: CodeLanguage.PYTHON,
            regex: /(import\s|def\s|class\s|df\[|\.fillna\(|\.describe\(|\.value_counts\()/i
        }
    ];

    for (const { lang, regex } of patterns) {
        if (regex.test(code)) {
            return lang;
        }
    }

    return CodeLanguage.UNKNOWN;
}
