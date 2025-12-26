/**
 * Python 代码验证器
 * 
 * 职责：在执行前检查 Python 代码的常见语法错误和安全问题
 * 使用场景：
 * 1. AI 生成的代码执行前校验
 * 2. Fallback 模板代码质量检查
 * 3. 用户自定义 Python 脚本验证
 */

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

export interface ValidationError {
    code: string;
    message: string;
    line?: number;
    suggestion?: string;
}

export interface ValidationWarning {
    code: string;
    message: string;
    line?: number;
}

/**
 * 验证 Python 代码语法和安全性
 */
export function validatePythonCode(code: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 检查1: 未转义的换行符（导致 unterminated string literal）
    checkUnterminatedStrings(code, errors);

    // 检查2: return/break/continue 语句在错误位置
    checkControlFlow(code, errors);

    // 检查3: 括号/引号配对
    checkBracketBalance(code, errors);

    // 检查4: 危险函数调用（安全检查）
    checkDangerousFunctions(code, warnings);

    // 检查5: 缺少必要的导入
    checkRequiredImports(code, warnings);

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * 检查未转义的换行符
 */
function checkUnterminatedStrings(code: string, errors: ValidationError[]): void {
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // 检测单引号字符串中的物理换行（非 \n）
        // 正则：匹配单引号开始，到行尾没有闭合单引号
        const singleQuotePattern = /'[^'\\]*$/;
        if (singleQuotePattern.test(line)) {
            errors.push({
                code: 'UNTERMINATED_STRING',
                message: '检测到未闭合的字符串字面量（可能是换行符未转义）',
                line: i + 1,
                suggestion: '将字符串中的换行符改为 \\n，或使用三引号字符串 """..."""'
            });
        }

        // 检测双引号字符串中的物理换行
        const doubleQuotePattern = /"[^"\\]*$/;
        if (doubleQuotePattern.test(line)) {
            errors.push({
                code: 'UNTERMINATED_STRING',
                message: '检测到未闭合的字符串字面量（可能是换行符未转义）',
                line: i + 1,
                suggestion: '将字符串中的换行符改为 \\n，或使用三引号字符串 """..."""'
            });
        }
    }
}

/**
 * 检查控制流语句的位置
 */
function checkControlFlow(code: string, errors: ValidationError[]): void {
    const lines = code.split('\n');
    // let indentLevel = 0; // 未使用，保留供未来缩进检查
    let inFunction = false;
    let inLoop = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // 跳过注释和空行
        if (trimmed.startsWith('#') || trimmed === '') continue;

        // 检测函数定义
        if (trimmed.startsWith('def ')) {
            inFunction = true;
        }

        // 检测循环
        if (trimmed.startsWith('for ') || trimmed.startsWith('while ')) {
            inLoop = true;
        }

        // 检查 return 语句
        if (trimmed.startsWith('return ') && !inFunction) {
            errors.push({
                code: 'RETURN_OUTSIDE_FUNCTION',
                message: "'return' 语句出现在函数外部",
                line: i + 1,
                suggestion: '将 return 语句放入函数定义内，或移除该语句'
            });
        }

        // 检查 break/continue 语句
        if ((trimmed.startsWith('break') || trimmed.startsWith('continue')) && !inLoop) {
            errors.push({
                code: 'BREAK_OUTSIDE_LOOP',
                message: `'${trimmed.split(' ')[0]}' 语句出现在循环外部`,
                line: i + 1,
                suggestion: '将该语句放入 for/while 循环内，或移除该语句'
            });
        }
    }
}

/**
 * 检查括号和引号的配对
 */
function checkBracketBalance(code: string, errors: ValidationError[]): void {
    const brackets = {
        '(': 0,
        '[': 0,
        '{': 0
    };

    const closingMap: Record<string, string> = {
        ')': '(',
        ']': '[',
        '}': '{'
    };

    for (const char of code) {
        if (char in brackets) {
            brackets[char as keyof typeof brackets]++;
        } else if (char in closingMap) {
            const opening = closingMap[char];
            brackets[opening as keyof typeof brackets]--;
        }
    }

    // 检查是否有未闭合的括号
    if (brackets['('] !== 0) {
        errors.push({
            code: 'UNMATCHED_PARENTHESES',
            message: `圆括号不匹配 (${brackets['('] > 0 ? '缺少闭合' : '多余闭合'})`,
            suggestion: '检查所有函数调用和表达式的括号配对'
        });
    }

    if (brackets['['] !== 0) {
        errors.push({
            code: 'UNMATCHED_BRACKETS',
            message: `方括号不匹配 (${brackets['['] > 0 ? '缺少闭合' : '多余闭合'})`,
            suggestion: '检查所有列表和索引操作的括号配对'
        });
    }

    if (brackets['{'] !== 0) {
        errors.push({
            code: 'UNMATCHED_BRACES',
            message: `花括号不匹配 (${brackets['{'] > 0 ? '缺少闭合' : '多余闭合'})`,
            suggestion: '检查所有字典和集合定义的括号配对'
        });
    }
}

/**
 * 检查危险函数调用（安全检查）
 */
function checkDangerousFunctions(code: string, warnings: ValidationWarning[]): void {
    const dangerousPatterns = [
        { pattern: /\b(os\.|subprocess\.|sys\.)/g, name: '系统调用' },
        { pattern: /\beval\s*\(/g, name: 'eval 函数' },
        { pattern: /\bexec\s*\(/g, name: 'exec 函数' },
        { pattern: /\b__import__\s*\(/g, name: '动态导入' },
        { pattern: /\bopen\s*\(/g, name: '文件操作' }
    ];

    for (const { pattern, name } of dangerousPatterns) {
        if (pattern.test(code)) {
            warnings.push({
                code: 'DANGEROUS_FUNCTION',
                message: `检测到潜在危险操作: ${name}`,
            });
        }
    }
}

/**
 * 检查必要的导入
 */
function checkRequiredImports(code: string, warnings: ValidationWarning[]): void {
    // 检查是否使用了 pandas 但没有导入
    if (/\bpd\./g.test(code) && !/import\s+pandas\s+as\s+pd/g.test(code)) {
        warnings.push({
            code: 'MISSING_IMPORT',
            message: '代码使用了 pd 但缺少 "import pandas as pd"',
        });
    }

    // 检查是否使用了 matplotlib 但没有导入
    if (/\bplt\./g.test(code) && !/import\s+matplotlib\.pyplot\s+as\s+plt/g.test(code)) {
        warnings.push({
            code: 'MISSING_IMPORT',
            message: '代码使用了 plt 但缺少 "import matplotlib.pyplot as plt"',
        });
    }

    // 检查是否使用了 numpy 但没有导入
    if (/\bnp\./g.test(code) && !/import\s+numpy\s+as\s+np/g.test(code)) {
        warnings.push({
            code: 'MISSING_IMPORT',
            message: '代码使用了 np 但缺少 "import numpy as np"',
        });
    }
}

/**
 * 格式化验证结果为日志字符串
 */
export function formatValidationResult(result: ValidationResult): string {
    const lines: string[] = [];

    if (result.valid) {
        lines.push('✅ Python 代码验证通过');
    } else {
        lines.push('❌ Python 代码验证失败\n');

        result.errors.forEach((error, index) => {
            lines.push(`错误 ${index + 1}: [${error.code}]`);
            lines.push(`  消息: ${error.message}`);
            if (error.line) lines.push(`  行号: ${error.line}`);
            if (error.suggestion) lines.push(`  建议: ${error.suggestion}`);
            lines.push('');
        });
    }

    if (result.warnings.length > 0) {
        lines.push('\n⚠️ 警告信息:');
        result.warnings.forEach((warning, index) => {
            lines.push(`警告 ${index + 1}: [${warning.code}] ${warning.message}`);
        });
    }

    return lines.join('\n');
}
