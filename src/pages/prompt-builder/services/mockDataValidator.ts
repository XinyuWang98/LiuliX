/**
 * Mock 数据校验服务（简化版 MVP）
 * Phase 3: 暂时使用硬编码的 Mock 数据集定义
 * Phase 4: 将集成真实的 DuckDB 查询
 */

export interface ValidationResult {
    exists: boolean;      // 列是否存在
    matchedColumn?: string; // 匹配的列名（可能与原名不同）
    dataType?: string;   // 实际数据类型
}

/**
 * Mock 数据集定义（硬编码）
 * 包含常见的测试数据集：Titanic, Iris, Housing
 */
const MOCK_DATASETS: Record<string, Array<{ name: string; type: string }>> = {
    'titanic': [
        { name: 'PassengerId', type: 'INTEGER' },
        { name: 'Survived', type: 'INTEGER' },
        { name: 'Pclass', type: 'INTEGER' },
        { name: 'Name', type: 'VARCHAR' },
        { name: 'Sex', type: 'VARCHAR' },
        { name: 'Age', type: 'DOUBLE' },
        { name: 'SibSp', type: 'INTEGER' },
        { name: 'Parch', type: 'INTEGER' },
        { name: 'Ticket', type: 'VARCHAR' },
        { name: 'Fare', type: 'DOUBLE' },
        { name: 'Cabin', type: 'VARCHAR' },
        { name: 'Embarked', type: 'VARCHAR' }
    ],
    'iris': [
        { name: 'SepalLength', type: 'DOUBLE' },
        { name: 'SepalWidth', type: 'DOUBLE' },
        { name: 'PetalLength', type: 'DOUBLE' },
        { name: 'PetalWidth', type: 'DOUBLE' },
        { name: 'Species', type: 'VARCHAR' }
    ],
    'housing': [
        { name: 'Id', type: 'INTEGER' },
        { name: 'MSSubClass', type: 'INTEGER' },
        { name: 'MSZoning', type: 'VARCHAR' },
        { name: 'LotArea', type: 'INTEGER' },
        { name: 'SalePrice', type: 'INTEGER' }
    ]
};

/**
 * 校验参数列表是否存在于指定 Mock 数据表中
 * 
 * @param paramNames 参数名列表（如 ['Age', 'Fare', 'Sex']）
 * @param tableName Mock 数据表名（如 'titanic'）
 * @returns 校验结果 Map（参数名 → 校验结果）
 */
export function validateAgainstMockData(
    paramNames: string[],
    tableName: string
): Map<string, ValidationResult> {
    const validationMap = new Map<string, ValidationResult>();

    // 获取对应数据集的列定义
    const dataset = MOCK_DATASETS[tableName.toLowerCase()];

    if (!dataset) {
        // 表不存在时，所有参数标记为不存在
        paramNames.forEach(param => {
            validationMap.set(param, { exists: false });
        });
        return validationMap;
    }

    // 构建列名映射（支持大小写不敏感）
    const columnMap = new Map<string, { name: string; type: string }>();
    dataset.forEach(col => {
        columnMap.set(col.name.toLowerCase(), col);
    });

    // 校验每个参数
    paramNames.forEach(param => {
        const lowerParam = param.toLowerCase();

        if (columnMap.has(lowerParam)) {
            const match = columnMap.get(lowerParam)!;
            validationMap.set(param, {
                exists: true,
                matchedColumn: match.name,
                dataType: match.type
            });
        } else {
            validationMap.set(param, { exists: false });
        }
    });

    return validationMap;
}

/**
 * 获取当前可用的 Mock 数据表列表
 * 
 * @returns 表名列表（如 ['titanic', 'iris', 'housing']）
 */
export function getAvailableMockTables(): string[] {
    return Object.keys(MOCK_DATASETS);
}
