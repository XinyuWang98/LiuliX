/**
 * InsightExtractor - 洞察结构化信息提取器
 * 
 * 职责：
 * 1. 从 InsightNode 提取结构化信息
 * 2. 识别层级 (depth)
 * 3. 关联父卡片 (parentId)
 * 4. 隐私模式检查
 */

import { AdoptedInsight } from '@/contexts/AnalysisContext';
import { logger } from '@/utils/logger';

/**
 * 通用洞察节点接口（兼容 insightTree.ts 和 insightChain.ts）
 */
interface GenericInsightNode {
    id: string;
    title?: string;                      // insightTree.ts 使用
    conclusion?: string;                 // insightChain.ts 使用
    depth?: number;
    columnsUsed?: string[];
    params?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    result?: {
        summary?: string;
        code?: string;
        image?: string;
    };
    code?: string;
}

/**
 * 提取采纳的洞察
 * P0 防护：隐私模式下不包含 values
 */
export function extractAdoptedInsight(node: GenericInsightNode): AdoptedInsight {
    const privacyMode = localStorage.getItem('privacy_mode') || 'normal';

    const insight: AdoptedInsight = {
        id: `adopted_${node.id}`,
        depth: node.depth ?? 0,
        parentId: (node.depth ?? 0) > 0 ? findParentIdFromMetadata(node) : undefined,
        type: inferInsightType(node),
        description: node.result?.summary || node.conclusion || node.title || `洞察 ${node.id}`,
        structuredData: buildStructuredData(node, privacyMode),
        timestamp: Date.now()
    };

    logger.log('数据分析', '[InsightExtractor] 提取洞察', {
        data: {
            nodeId: node.id,
            depth: insight.depth,
            type: insight.type,
            hasParent: !!insight.parentId,
            privacyMode
        }
    });

    return insight;
}

/**
 * 构建结构化数据
 * P0 防护：隐私模式下 values 置空
 */
function buildStructuredData(
    node: GenericInsightNode,
    privacyMode: string
): AdoptedInsight['structuredData'] {
    const column = extractColumn(node);

    if (privacyMode === 'sanitized') {
        // 隐私模式：仅保留列名
        return column ? { column } : undefined;
    }

    // 正常模式：包含完整信息
    return {
        column,
        issues: extractIssues(node),
        values: extractValues(node)
    };
}

/**
 * 从节点元数据中查找父卡片 ID
 * 注意：这里简化实现，实际需要从全局树结构中查找
 */
function findParentIdFromMetadata(node: GenericInsightNode): string | undefined {
    // 方案1：从 metadata 中读取（如果有存储）
    if (node.metadata?.parentNodeId) {
        return node.metadata.parentNodeId as string;
    }

    // 方案2：从 parentContext 推断（临时方案）
    // TODO: 实际实现需要遍历 insightChain.rootCards 查找
    return undefined;
}

/**
 * 推断洞察类型
 */
function inferInsightType(node: GenericInsightNode): AdoptedInsight['type'] {
    const title = (node.title || node.conclusion || '').toLowerCase();
    const summary = (node.result?.summary || '').toLowerCase();
    const combined = title + ' ' + summary;

    if (combined.includes('缺失') || combined.includes('null') || combined.includes('missing')) {
        return 'data_quality';
    }
    if (combined.includes('分布') || combined.includes('distribution') || combined.includes('histogram')) {
        return 'distribution';
    }
    if (combined.includes('相关') || combined.includes('correlation')) {
        return 'correlation';
    }
    if (combined.includes('趋势') || combined.includes('trend') || combined.includes('时间')) {
        return 'trend';
    }
    if (combined.includes('异常') || combined.includes('outlier')) {
        return 'outlier';
    }

    return 'other';
}

/**
 * 提取列名
 */
function extractColumn(node: GenericInsightNode): string | undefined {
    // 优先级1：从 columnsUsed 中取第一个
    if (node.columnsUsed && node.columnsUsed.length > 0) {
        return node.columnsUsed[0];
    }

    // 优先级2：从 params 中提取
    if (node.params) {
        const columnKeys = ['column_name', 'col_x', 'col_y', 'date_col', 'value_col'];
        for (const key of columnKeys) {
            if (node.params[key] && typeof node.params[key] === 'string') {
                return node.params[key] as string;
            }
        }
    }

    // 优先级3：从 metadata 中提取
    if (node.metadata?.columns && Array.isArray(node.metadata.columns)) {
        return node.metadata.columns[0];
    }

    return undefined;
}

/**
 * 提取问题类型
 */
function extractIssues(node: GenericInsightNode): string[] | undefined {
    const issues: string[] = [];
    const summary = (node.result?.summary || '').toLowerCase();

    if (summary.includes('缺失') || summary.includes('missing')) {
        issues.push('missing_values');
    }
    if (summary.includes('截断') || summary.includes('capped')) {
        issues.push('capped_values');
    }
    if (summary.includes('异常') || summary.includes('outlier')) {
        issues.push('outliers');
    }
    if (summary.includes('偏斜') || summary.includes('skew')) {
        issues.push('skewed_distribution');
    }

    return issues.length > 0 ? issues : undefined;
}

/**
 * 提取具体数值
 */
function extractValues(node: GenericInsightNode): Record<string, unknown> | undefined {
    const values: Record<string, unknown> = {};

    // 从 params 中提取阈值等参数
    if (node.params) {
        const valueKeys = ['threshold', 'min_value', 'max_value', 'bins'];
        for (const key of valueKeys) {
            if (node.params[key] !== undefined) {
                values[key] = node.params[key];
            }
        }
    }

    return Object.keys(values).length > 0 ? values : undefined;
}
