/**
 * Python列名提取工具
 * 
 * 从Python代码中提取DataFrame列名引用
 * 用于执行前验证列是否存在
 * 
 * @author AntiGravity
 * @date 2026-01-09
 */

/**
 * 从Python代码中提取所有引用的列名
 * 
 * 支持的模式：
 * - df['column_name']
 * - df["column_name"]
 * - df.column_name (属性访问，需排除pandas方法)
 * 
 * @param pythonCode Python代码字符串
 * @returns 去重后的列名数组
 */
export function extractColumnNames(pythonCode: string): string[] {
    const columns = new Set<string>();

    // 模式1: df['column_name'] 或 df["column_name"]
    // 正则说明: 匹配 df[ 后跟单引号或双引号包裹的内容
    const bracketPattern = /df\[['"]([^'"]+)['"]\]/g;
    let match;

    while ((match = bracketPattern.exec(pythonCode)) !== null) {
        columns.add(match[1]);
    }

    // 模式2: df.column_name (点号访问)
    // 注意：需要排除pandas内置方法和属性
    const dotPattern = /df\.(\w+)/g;
    const pandasBuiltins = new Set([
        // DataFrame属性
        'shape', 'columns', 'index', 'dtypes', 'values', 'size', 'ndim', 'empty',
        // DataFrame方法
        'head', 'tail', 'describe', 'info', 'isnull', 'isna', 'notna', 'notnull',
        'dropna', 'fillna', 'drop', 'drop_duplicates', 'reset_index', 'set_index',
        'sort_values', 'sort_index', 'groupby', 'merge', 'join', 'concat',
        'apply', 'map', 'applymap', 'transform', 'agg', 'aggregate',
        'loc', 'iloc', 'at', 'iat', 'query', 'select_dtypes',
        'copy', 'to_csv', 'to_json', 'to_dict', 'to_numpy', 'to_records',
        'plot', 'corr', 'cov', 'value_counts', 'nunique', 'unique'
    ]);

    while ((match = dotPattern.exec(pythonCode)) !== null) {
        const attr = match[1];
        // 只添加非内置的属性（很可能是列名）
        if (!pandasBuiltins.has(attr)) {
            columns.add(attr);
        }
    }

    // 模式3: df[col_var] 其中col_var是变量
    // 这种情况无法静态分析，需要运行时检查
    // 暂不处理，标记为TODO
    // TODO: 考虑AST解析来处理变量引用

    return Array.from(columns);
}

/**
 * 检测是否为占位符列名
 * 
 * 占位符特征:
 * - 包含"需要指定"等关键词
 * - 包含"列名"、"column"等元变量
 * - 包含"xxx"、"..."等占位符
 */
function isPlaceholderColumn(columnName: string): boolean {
    const placeholderPatterns = [
        /需要指定/,
        /请指定/,
        /待定/,
        /未定义/,
        /实际列名/,
        /^column(_)?name$/i,
        /^col(_)?name$/i,
        /^your(_)?column$/i,
        /^<.*>$/,  // <column_name>
        /\.\.\./,   // ...
        /^xxx$/i,
        /^TODO/i,
        /^FIXME/i,
        /^placeholder/i
    ];

    return placeholderPatterns.some(pattern => pattern.test(columnName));
}

/**
 * 验证代码中引用的列名是否都存在
 * 
 * @param pythonCode Python代码
 * @param actualColumns 实际存在的列名列表
 * @returns 验证结果
 */
export function validateColumnReferences(
    pythonCode: string,
    actualColumns: string[]
): {
    isValid: boolean;
    usedColumns: string[];
    invalidColumns: string[];
    placeholderColumns: string[];  // 🆕 占位符列名
} {
    const usedColumns = extractColumnNames(pythonCode);
    const actualSet = new Set(actualColumns);

    // 分类检测
    const placeholderColumns: string[] = [];
    const invalidColumns: string[] = [];

    for (const col of usedColumns) {
        if (isPlaceholderColumn(col)) {
            placeholderColumns.push(col);
        } else if (!actualSet.has(col)) {
            invalidColumns.push(col);
        }
    }

    return {
        isValid: placeholderColumns.length === 0 && invalidColumns.length === 0,
        usedColumns,
        invalidColumns,
        placeholderColumns
    };
}
