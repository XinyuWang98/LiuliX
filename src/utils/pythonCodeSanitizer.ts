/**
 * Python 代码自动修复工具
 * 
 * 职责：尝试自动修复常见的 Python 代码问题
 * 使用场景：
 * 1. AI 生成的代码中的转义问题
 * 2. 格式化不规范的代码
 * 3. 自动补全缺失的导入
 */

import { logger } from './logger';

export interface SanitizeResult {
    sanitized: boolean;
    code: string;
    fixes: string[];
}

/**
 * 自动修复 Python 代码中的常见问题
 */
export function sanitizePythonCode(code: string): SanitizeResult {
    const fixes: string[] = [];
    let sanitizedCode = code;

    // 修复1: 转义未转义的换行符
    const result1 = fixUnescapedNewlines(sanitizedCode);
    if (result1.fixed) {
        sanitizedCode = result1.code;
        fixes.push('修复了未转义的换行符');
    }

    // 修复2: 移除顶层 return 语句
    const result2 = removeTopLevelReturns(sanitizedCode);
    if (result2.fixed) {
        sanitizedCode = result2.code;
        fixes.push('移除了函数外的 return 语句');
    }

    // 修复3: 自动添加缺失的导入
    const result3 = addMissingImports(sanitizedCode);
    if (result3.fixed) {
        sanitizedCode = result3.code;
        fixes.push(...result3.imports);
    }

    // 修复4: 标准化引号使用
    const result4 = normalizeQuotes(sanitizedCode);
    if (result4.fixed) {
        sanitizedCode = result4.code;
        fixes.push('标准化了字符串引号');
    }

    return {
        sanitized: fixes.length > 0,
        code: sanitizedCode,
        fixes
    };
}

/**
 * 修复未转义的换行符
 * 
 * 将字符串中的物理换行符转换为 \n 转义序列
 */
function fixUnescapedNewlines(code: string): { code: string; fixed: boolean } {
    let fixed = false;
    const lines = code.split('\n');
    const result: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // 检测单引号字符串跨行
        if (/'[^']*$/.test(line) && i + 1 < lines.length) {
            // 向后查找闭合单引号
            let j = i + 1;
            while (j < lines.length && !/^[^']*'/.test(lines[j])) {
                j++;
            }

            if (j < lines.length) {
                // 合并多行字符串并转义
                const multilineContent = lines.slice(i, j + 1).join('\n');
                const escaped = multilineContent.replace(/\n/g, '\\n');
                result.push(escaped);
                i = j; // 跳过已处理的行
                fixed = true;
                continue;
            }
        }

        result.push(line);
    }

    return { code: result.join('\n'), fixed };
}

/**
 * 移除顶层 return 语句
 */
function removeTopLevelReturns(code: string): { code: string; fixed: boolean } {
    const lines = code.split('\n');
    const result: string[] = [];
    let fixed = false;
    let inFunction = false;
    let functionIndent = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        const currentIndent = line.search(/\S/);

        // 检测函数定义
        if (trimmed.startsWith('def ')) {
            inFunction = true;
            functionIndent = currentIndent;
        }

        // 检测函数结束（缩进回到函数级别或更低）
        if (inFunction && currentIndent <= functionIndent && !trimmed.startsWith('def ')) {
            inFunction = false;
        }

        // 如果是顶层 return，将其注释掉
        if (trimmed.startsWith('return ') && !inFunction) {
            result.push(`# ${line}  # [自动修复] 移除了函数外的 return 语句`);
            fixed = true;
            logger.warn('Python', '检测到函数外的 return 语句，已自动注释');
        } else {
            result.push(line);
        }
    }

    return { code: result.join('\n'), fixed };
}

/**
 * 自动添加缺失的导入
 */
function addMissingImports(code: string): { code: string; fixed: boolean; imports: string[] } {
    const imports: string[] = [];
    let fixedCode = code;
    let fixed = false;

    // 检查 pandas
    if (/\bpd\./g.test(code) && !/import\s+pandas\s+as\s+pd/g.test(code)) {
        fixedCode = `import pandas as pd\n${fixedCode}`;
        imports.push('添加了 pandas 导入');
        fixed = true;
    }

    // 检查 matplotlib
    if (/\bplt\./g.test(code) && !/import\s+matplotlib\.pyplot\s+as\s+plt/g.test(code)) {
        fixedCode = `import matplotlib.pyplot as plt\n${fixedCode}`;
        imports.push('添加了 matplotlib.pyplot 导入');
        fixed = true;
    }

    // 检查 numpy
    if (/\bnp\./g.test(code) && !/import\s+numpy\s+as\s+np/g.test(code)) {
        fixedCode = `import numpy as np\n${fixedCode}`;
        imports.push('添加了 numpy 导入');
        fixed = true;
    }

    // 检查 base64
    if (/\bbase64\./g.test(code) && !/import\s+base64/g.test(code)) {
        fixedCode = `import base64\n${fixedCode}`;
        imports.push('添加了 base64 导入');
        fixed = true;
    }

    // 检查 BytesIO
    if (/\bBytesIO\b/g.test(code) && !/from\s+io\s+import\s+BytesIO/g.test(code)) {
        fixedCode = `from io import BytesIO\n${fixedCode}`;
        imports.push('添加了 BytesIO 导入');
        fixed = true;
    }

    // 检查 json
    if (/\bjson\./g.test(code) && !/import\s+json/g.test(code)) {
        fixedCode = `import json\n${fixedCode}`;
        imports.push('添加了 json 导入');
        fixed = true;
    }

    return { code: fixedCode, fixed, imports };
}

/**
 * 标准化引号使用
 * 
 * 将所有字符串统一使用单引号（除非字符串内包含单引号）
 */
function normalizeQuotes(code: string): { code: string; fixed: boolean } {
    let fixed = false;

    // 将双引号字符串转换为单引号（如果字符串内不包含单引号）
    const normalized = code.replace(/"([^"'\\]*)"/g, (match, content) => {
        if (!content.includes("'")) {
            fixed = true;
            return `'${content}'`;
        }
        return match;
    });

    return { code: normalized, fixed };
}

/**
 * 智能修复：结合验证和自动修复
 * 
 * 先尝试自动修复，再验证修复后的代码
 */
export function smartFixPythonCode(
    code: string,
    validator?: (code: string) => { valid: boolean; errors: any[] }
): { code: string; success: boolean; message: string } {
    // 第一步：自动修复
    const sanitizeResult = sanitizePythonCode(code);

    if (sanitizeResult.sanitized) {
        logger.log('Python', `自动修复完成: ${sanitizeResult.fixes.join(', ')}`);
    }

    // 第二步：如果提供了验证器，验证修复后的代码
    if (validator) {
        const validationResult = validator(sanitizeResult.code);

        if (validationResult.valid) {
            return {
                code: sanitizeResult.code,
                success: true,
                message: `修复成功: ${sanitizeResult.fixes.join(', ')}`
            };
        } else {
            return {
                code: sanitizeResult.code,
                success: false,
                message: `自动修复后仍存在问题: ${validationResult.errors.map(e => e.message).join('; ')}`
            };
        }
    }

    // 如果没有验证器，只返回修复结果
    return {
        code: sanitizeResult.code,
        success: sanitizeResult.sanitized,
        message: sanitizeResult.sanitized
            ? `已应用修复: ${sanitizeResult.fixes.join(', ')}`
            : '无需修复'
    };
}
