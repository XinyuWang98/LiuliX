/**
 * 变量解析工具
 * 用于从 Prompt 模板中提取 {{variable}} 形式的变量
 */

/**
 * 从模板字符串中提取所有变量
 * @param template 模板字符串 (e.g. "Analyze {{column}} using {{method}}")
 * @returns 变量名数组 (去重)
 */
export function extractVariables(template: string): string[] {
    if (!template) return [];

    // 匹配 {{variable}} 模式，允许变量名包含字母、数字、下划线
    // 忽略花括号内的空白字符
    const regex = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;

    const variables = new Set<string>();
    let match;

    while ((match = regex.exec(template)) !== null) {
        // match[1] 是捕获组，即变量名
        variables.add(match[1]);
    }

    return Array.from(variables);
}

/**
 * 验证变量名是否合法
 * @param name 变量名
 */
export function isValidVariableName(name: string): boolean {
    return /^[a-zA-Z0-9_]+$/.test(name);
}
