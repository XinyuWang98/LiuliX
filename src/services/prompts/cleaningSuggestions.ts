/**
 * AI清洗建议Prompt构建
 * 使用i18n构建AI Prompt模板
 */

import type { DesensitizedColumnInfo, DataQualityIssue } from '@/utils/dataSanitizer';

// ==================== Prompt构建 ====================

/**
 * 构建AI清洗建议Prompt
 * 所有文案使用i18n
 */
export function buildCleaningPrompt(
    tableName: string,
    desensitizedData: DesensitizedColumnInfo[],
    qualityIssues: DataQualityIssue[],
    t: (key: string, params?: Record<string, any>) => string,
    language: string = 'Chinese (Simplified)' // Default language fallback
): string {
    // 计算数据质量得分
    const qualityScore = calculateQualityScore(desensitizedData, qualityIssues);

    // 构建列详情
    const columnDetails = desensitizedData.map(col => {
        const details = [
            `${t('common.column')}: ${col.name}`,
            `${t('common.type')}: ${col.type}`,
            `${t('cleaning.nullRate', { rate: col.stats.nullRate.toFixed(1) })}`,
            `${t('cleaning.uniqueValues', { count: col.stats.uniqueCount })}`
        ];

        // 数值列统计
        if (col.stats.min !== undefined && col.stats.max !== undefined) {
            details.push(`  - ${t('common.range')}: [${col.stats.min}, ${col.stats.max}]`);
            if (col.stats.median) {
                details.push(`  - ${t('common.median')}: ${col.stats.median}`);
            }
        }

        // 文本列模式
        if (col.stats.avgLength) {
            details.push(`  - ${t('common.avgLength')}: ${col.stats.avgLength}`);
        }
        if (col.stats.patternExample) {
            details.push(`  - ${t('common.format')}: ${col.stats.patternExample}`);
        }

        // 样本值
        if (col.sampleValues && col.sampleValues.length > 0) {
            details.push(`  - ${t('common.sample')}: ${col.sampleValues.join(', ')}`);
        }

        // 敏感标记
        if (col.isSensitive) {
            details.push(`  - ⚠️ ${t('common.sensitive')}`);
        }

        return details.join('\\n');
    }).join('\\n\\n');

    // 构建质量问题列表
    const issuesList = qualityIssues.map(issue => {
        const severityMap = {
            high: t('common.high'),
            medium: t('common.medium'),
            low: t('common.low')
        };
        return `- [${severityMap[issue.severity]}] ${issue.description}`;
    }).join('\\n');

    // 构建完整Prompt
    return `
你是一个专业的数据清洗专家，请基于以下数据质量报告提供清洗建议。

【${t('cleaning.datasetOverview')}】
- ${t('common.table')}: ${tableName}
- ${t('common.totalRows')}: ${desensitizedData[0]?.stats.totalRows || 0}
- ${t('common.totalColumns')}: ${desensitizedData.length}
- ${t('cleaning.qualityScore')}: ${qualityScore}/100

【${t('cleaning.columnDetails')}】
${columnDetails}

【${t('cleaning.qualityIssues')}】
${issuesList || t('common.none')}

【${t('cleaning.requirements')}】
请返回JSON格式的清洗建议，格式如下：
{
  "suggestions": [
    {
      "id": "唯一标识（如：dedup-001）",
      "type": "dedup|fill|filter|normalize",
      "column": "列名（如果针对特定列）",
      "label": "建议标题（简短描述）",
      "reason": "详细原因（为什么需要这个清洗步骤）",
      "confidence": 0.0-1.0（建议可信度）,
      "sql": "DuckDB SQL语句",
      "expectedImpact": "预期影响（如：减少X行，提升Y%质量）"
    }
  ]
}

【SQL${t('cleaning.requirements')}】
1. **必须使用 DuckDB SQL 方言** - DuckDB 不支持所有 PostgreSQL/MySQL 语法
2. **可用表名**：
   - "${tableName}" (当前工作表)
   - 禁止使用：${tableName}_backup, ${tableName}_temp 等不存在的表
3. **禁止的操作**：
   - DROP TABLE, TRUNCATE TABLE（数据安全）
   - BACKUP TABLE, RESTORE TABLE（DuckDB 不支持）
   - ALTER TABLE ADD/DROP COLUMN（结构变更）
4. **禁止的语法**：
   - VALUES (NULL AS placeholder)（DuckDB 不支持此语法）
   - 任何包含 AS 关键字在 VALUES 子句中的语句
5. **推荐的安全模式**：
   - 使用 CREATE OR REPLACE TABLE ${tableName} AS SELECT ... FROM ${tableName} WHERE ...
   - 对于 UPDATE 语句，必须有明确的 WHERE 条件
   - 去重：SELECT DISTINCT * FROM ${tableName}
   - 删除空值：SELECT * FROM ${tableName} WHERE "列名" IS NOT NULL
6. **优先级**: ${t('cleaning.dataIntegrity')} > ${t('cleaning.dataConsistency')} > ${t('cleaning.dataFormat')}

【${t('cleaning.outputFormat')}】
- 只返回JSON，不要包含任何markdown标记（如\`\`\`json）
- suggestions数组应包含2-5个建议
- confidence应基于数据质量问题的严重程度
- 敏感列已脱敏，不会影响数据分析

IMPORTANT: All text in the JSON analysis (especially label, reason, and expectedImpact fields) MUST be in ${language} language.
`.trim();
}

// ==================== 数据质量得分计算 ====================

/**
 * 计算数据质量得分（0-100）
 */
function calculateQualityScore(
    desensitizedData: DesensitizedColumnInfo[],
    qualityIssues: DataQualityIssue[]
): number {
    let score = 100;

    // 根据问题严重程度扣分
    for (const issue of qualityIssues) {
        if (issue.severity === 'high') {
            score -= 15;
        } else if (issue.severity === 'medium') {
            score -= 8;
        } else {
            score -= 3;
        }
    }

    // 根据平均缺失率扣分
    const avgNullRate = desensitizedData.reduce((sum, col) => sum + col.stats.nullRate, 0) / desensitizedData.length;
    score -= Math.floor(avgNullRate / 5); // 每5%缺失率扣1分

    // 确保分数在0-100范围内
    return Math.max(0, Math.min(100, score));
}

// ==================== i18n翻译键补充 ====================

/**
 * 添加需要的i18n翻译键（文档用途）
 * 
 * common:
 * - column: 列
 * - type: 类型
 * - range: 范围
 * - median: 中位数
 * - avgLength: 平均长度
 * - format: 格式
 * - sample: 样本
 * - sensitive: 敏感信息已脱敏
 * - table: 表名
 * - totalRows: 总行数
 * - totalColumns: 总列数
 * - high: 高
 * - medium: 中
 * - low: 低
 * - none: 无
 * 
 * cleaning:
 * - datasetOverview: 数据集概览
 * - columnDetails: 列详情
 * - qualityIssues: 数据质量问题
 * - requirements: 要求
 * - dataIntegrity: 数据完整性
 * - dataConsistency: 数据一致性
 * - dataFormat: 数据格式
 * - outputFormat: 输出格式
 */
