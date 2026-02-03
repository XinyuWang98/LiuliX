import { CodeLanguage, DetectedParam, DataType } from '../types';

/**
 * 参数识别服务
 * 通过正则表达式识别代码中的列名，区分输入/输出参数
 */

export function detectParameters(code: string, language: CodeLanguage): DetectedParam[] {
    if (language === CodeLanguage.PYTHON) {
        return detectPythonParameters(code);
    } else if (language === CodeLanguage.SQL) {
        return detectSQLParameters(code);
    }
    return [];
}

/**
 * 识别 Python 代码中的参数
 * 
 * 输入参数示例：df['Age'].fillna(...)
 * 输出参数示例：result = df['Age'].describe()
 */
function detectPythonParameters(code: string): DetectedParam[] {
    const params: DetectedParam[] = [];
    const seenColumns = new Set<string>();

    // 正则1：df['ColumnName'] 或 df["ColumnName"] 模式（输入参数）
    const inputRegex = /df\[['"]([^'"]+)['"]\]/g;
    const inputMatches = [...code.matchAll(inputRegex)];

    // 正则2：var = df['ColumnName'] 模式（输出参数）
    const outputRegex = /(\w+)\s*=\s*df\[['"]([^'"]+)['"]\]/g;
    const outputMatches = [...code.matchAll(outputRegex)];

    // 处理输入参数（去重）
    inputMatches.forEach(match => {
        const columnName = match[1];
        if (!seenColumns.has(columnName)) {
            seenColumns.add(columnName);

            // 检查是否同时是输出参数
            const isOutput = outputMatches.some(om => om[2] === columnName);

            if (!isOutput) {
                params.push({
                    originalName: columnName,
                    suggestedVarName: toSnakeCase(columnName),
                    type: 'input',
                    dataType: inferDataType(columnName, code),
                    occurrences: inputMatches.filter(m => m[1] === columnName).length
                });
            }
        }
    });

    // 处理输出参数
    const seenOutputVars = new Set<string>();
    outputMatches.forEach(match => {
        const varName = match[1];
        const columnName = match[2];

        if (!seenOutputVars.has(varName)) {
            seenOutputVars.add(varName);
            params.push({
                originalName: columnName,
                suggestedVarName: varName, // 输出参数保留用户定义的变量名
                type: 'output',
                dataType: inferDataType(columnName, code),
                occurrences: 1
            });
        }
    });

    return params;
}

/**
 * 识别 SQL 代码中的参数
 * 
 * 识别模式：
 * - SELECT 子句：SELECT col1, col2 FROM table
 * - WHERE 子句：WHERE col1 = 'value'
 * - 聚合函数：COUNT(col1), SUM(col2)
 */
function detectSQLParameters(code: string): DetectedParam[] {
    const params: DetectedParam[] = [];
    const seenColumns = new Set<string>();

    // 移除注释和字符串字面量（简化版）
    let cleanedCode = code.replace(/--.*$/gm, ''); // 移除单行注释
    cleanedCode = cleanedCode.replace(/'[^']*'/g, ''); // 移除字符串

    // 正则1：SELECT 子句中的列名
    // 匹配 SELECT col1, col2, col3 FROM
    const selectRegex = /SELECT\s+(?:DISTINCT\s+)?(.+?)\s+FROM/is;
    const selectMatch = cleanedCode.match(selectRegex);

    if (selectMatch) {
        const selectColumns = selectMatch[1];

        // 分割列名（逗号分隔）
        const columns = selectColumns.split(',').map(col => col.trim());

        columns.forEach(col => {
            // 跳过聚合函数和 * 通配符
            if (col === '*' || /^(COUNT|SUM|AVG|MIN|MAX|DISTINCT)\s*\(/i.test(col)) {
                // 提取聚合函数内的列名
                const aggMatch = col.match(/\(([^)]+)\)/);
                if (aggMatch && aggMatch[1] !== '*') {
                    const colName = aggMatch[1].trim();
                    if (!seenColumns.has(colName)) {
                        seenColumns.add(colName);
                        params.push({
                            originalName: colName,
                            suggestedVarName: toSnakeCase(colName),
                            type: 'output', // 聚合函数结果视为输出
                            dataType: 'numeric',
                            occurrences: 1
                        });
                    }
                }
                return;
            }

            // 处理 AS 别名：col1 AS alias
            const alias = col.match(/(.+?)\s+AS\s+/i);
            const colName = alias ? alias[1].trim() : col;

            if (!seenColumns.has(colName)) {
                seenColumns.add(colName);
                params.push({
                    originalName: colName,
                    suggestedVarName: toSnakeCase(colName),
                    type: 'input',
                    dataType: inferSQLDataType(colName),
                    occurrences: 1
                });
            }
        });
    }

    // 正则2：WHERE 子句中的列名
    // 匹配 WHERE col1 = 'value' AND col2 > 10
    const whereRegex = /WHERE\s+(.+?)(?:GROUP BY|ORDER BY|LIMIT|$)/is;
    const whereMatch = cleanedCode.match(whereRegex);

    if (whereMatch) {
        const whereClause = whereMatch[1];

        // 匹配列名（col1 = value 或 col1 > value）
        const colRegex = /(\w+)\s*[=<>!]+/g;
        const colMatches = [...whereClause.matchAll(colRegex)];

        colMatches.forEach(match => {
            const colName = match[1];

            // 跳过 SQL 关键字
            if (['AND', 'OR', 'NOT', 'IN', 'LIKE'].includes(colName.toUpperCase())) {
                return;
            }

            if (!seenColumns.has(colName)) {
                seenColumns.add(colName);
                params.push({
                    originalName: colName,
                    suggestedVarName: toSnakeCase(colName),
                    type: 'input',
                    dataType: inferSQLDataType(colName),
                    occurrences: 1
                });
            }
        });
    }

    return params;
}

/**
 * 推断 SQL 列的数据类型（基于列名）
 */
function inferSQLDataType(columnName: string): DataType {
    const lowerName = columnName.toLowerCase();

    const numericKeywords = ['id', 'age', 'price', 'count', 'amount', 'total', 'num', 'qty'];
    const categoryKeywords = ['name', 'type', 'status', 'category', 'class', 'gender', 'sex'];
    const dateKeywords = ['date', 'time', 'year', 'month', 'day', 'created', 'updated'];

    if (numericKeywords.some(k => lowerName.includes(k))) {
        return 'numeric';
    }
    if (categoryKeywords.some(k => lowerName.includes(k))) {
        return 'category';
    }
    if (dateKeywords.some(k => lowerName.includes(k))) {
        return 'date';
    }

    return 'text'; // SQL 默认为 text
}

/**
 * 将列名转换为 snake_case 变量名
 */
function toSnakeCase(str: string): string {
    return str
        .replace(/\s+/g, '_')
        .replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
        .replace(/^_/, '') // 移除开头的下划线
        .toLowerCase() + '_column';
}

/**
 * 推断数据类型（基于代码上下文）
 */
function inferDataType(columnName: string, code: string): DataType {
    // 规则1：基于操作推断
    if (code.includes(`['${columnName}'].describe()`) ||
        code.includes(`["${columnName}"].describe()`)) {
        return 'numeric';
    }

    if (code.includes(`['${columnName}'].value_counts()`) ||
        code.includes(`["${columnName}"].value_counts()`)) {
        return 'category';
    }

    if (code.includes(`['${columnName}'].fillna(`) ||
        code.includes(`["${columnName}"].fillna(`)) {
        return 'numeric'; // fillna 通常用于数值列
    }

    // 规则2：基于列名关键词
    const lowerName = columnName.toLowerCase();

    const numericKeywords = ['age', 'price', 'count', 'amount', 'total', 'fare', 'cost', 'value', 'num'];
    const categoryKeywords = ['sex', 'gender', 'class', 'type', 'status', 'category', 'group'];
    const dateKeywords = ['date', 'time', 'year', 'month', 'day', 'datetime', 'timestamp'];

    if (numericKeywords.some(k => lowerName.includes(k))) {
        return 'numeric';
    }
    if (categoryKeywords.some(k => lowerName.includes(k))) {
        return 'category';
    }
    if (dateKeywords.some(k => lowerName.includes(k))) {
        return 'date';
    }

    return 'unknown';
}
