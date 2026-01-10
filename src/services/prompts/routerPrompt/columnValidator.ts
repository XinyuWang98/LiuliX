/**
 * 验证params中的列名是否都在availableColumns中
 * 
 * @param params 参数对象
 * @param availableColumns 可用列名列表
 * @returns 非法列名数组
 */
function validateColumnNames(
    params: Record<string, unknown>,
    availableColumns: string[]
): string[] {
    const invalidColumns: string[] = [];
    const columnSet = new Set(availableColumns);

    // 检查所有参数值
    for (const [key, value] of Object.entries(params)) {
        // 只检查看起来是列名的字段（常见字段名）
        const isColumnField = /column|col|field|x|y|name/i.test(key);

        if (isColumnField && typeof value === 'string') {
            // 检查是否在可用列名中
            if (!columnSet.has(value)) {
                invalidColumns.push(value);
            }
        }
    }

    return invalidColumns;
}

export { validateColumnNames };
