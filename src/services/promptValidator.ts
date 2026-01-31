/**
 * Prompt 模板校验服务
 * 复用 variableParser.ts 实现完整的模板质量校验
 */

import { extractVariables, isValidVariableName } from '@/utils/variableParser';

export interface ValidationIssue {
    level: 'error' | 'warning' | 'info';
    message: string;
    suggestion?: string;
}

export interface ValidationResult {
    valid: boolean;
    issues: ValidationIssue[];
    variables: string[];
    stats: {
        totalLength: number;
        variableCount: number;
    };
}

/**
 * 校验 Prompt 模板质量
 * @param template 模板字符串
 * @param availableColumns 可用的数据集列名（可选）
 */
export function validatePromptTemplate(
    template: string,
    availableColumns?: string[]
): ValidationResult {
    const issues: ValidationIssue[] = [];

    // 提取变量
    const variables = extractVariables(template);

    // 1. 检测未闭合的变量（基础语法检查）
    const openBrackets = (template.match(/{{/g) || []).length;
    const closeBrackets = (template.match(/}}/g) || []).length;

    if (openBrackets !== closeBrackets) {
        issues.push({
            level: 'error',
            message: `检测到未闭合的变量：{{ 出现 ${openBrackets} 次，}} 出现 ${closeBrackets} 次`,
            suggestion: '请检查所有变量是否正确使用 {{变量名}} 格式'
        });
    }

    // 2. 检测非法变量名
    const invalidVarPattern = /{{[^}]+}}/g;
    const allMatches = template.match(invalidVarPattern) || [];

    allMatches.forEach(match => {
        const varName = match.replace(/{{|}}/g, '').trim();
        if (varName && !isValidVariableName(varName)) {
            issues.push({
                level: 'error',
                message: `非法变量名：{{${varName}}}`,
                suggestion: '变量名只能包含字母、数字和下划线'
            });
        }
    });

    // 3. 检测变量存在性（如果提供了可用列名）
    if (availableColumns && availableColumns.length > 0) {
        variables.forEach(varName => {
            if (!availableColumns.includes(varName)) {
                issues.push({
                    level: 'warning',
                    message: `变量 {{${varName}}} 在当前数据集中未找到`,
                    suggestion: `可用列名: ${availableColumns.slice(0, 5).join(', ')}${availableColumns.length > 5 ? '...' : ''}`
                });
            }
        });
    }

    // 4. 长度警告
    if (template.length > 3000) {
        issues.push({
            level: 'warning',
            message: `模板长度 ${template.length} 字符，可能过长`,
            suggestion: '建议精简模板内容以提高可读性和性能'
        });
    }

    // 5. SQL 注入风险检测（危险关键字）
    const dangerousKeywords = ['DROP', 'DELETE', 'ALTER', 'TRUNCATE', 'EXEC', 'EXECUTE'];
    const upperTemplate = template.toUpperCase();

    dangerousKeywords.forEach(keyword => {
        if (upperTemplate.includes(keyword)) {
            issues.push({
                level: 'error',
                message: `检测到危险关键字：${keyword}`,
                suggestion: 'Prompt 模板不应包含可能导致数据损坏的 SQL 语句'
            });
        }
    });

    // 6. 空模板检测
    if (!template.trim()) {
        issues.push({
            level: 'error',
            message: '模板不能为空',
            suggestion: '请输入包含至少一个变量的 Prompt 模板'
        });
    }

    // 7. 信息级提示
    if (variables.length === 0 && template.trim()) {
        issues.push({
            level: 'info',
            message: '模板中未检测到任何变量',
            suggestion: '使用 {{变量名}} 语法插入动态内容'
        });
    }

    return {
        valid: issues.filter(i => i.level === 'error').length === 0,
        issues,
        variables,
        stats: {
            totalLength: template.length,
            variableCount: variables.length
        }
    };
}
