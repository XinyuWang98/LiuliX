/**
 * L1 推荐膨胀引擎 (Inflater)
 * 
 * 将 AI 返回的轻量 L1Recommendation 膨胀为完整的 InsightNode
 * 核心职责：
 * 1. 从 PromptRegistry 获取模板
 * 2. 用参数填充 codeTemplate
 * 3. 创建可执行的 InsightNode
 */

import { L1Recommendation, InsightNode, DrillDownAction } from '@/types/insightTree';
import { promptRegistry } from '@/services/promptRegistry';
import { logger } from '@/utils/logger';
import { CodeEnhancer } from '@/services/prompts/guards/codeEnhancer';  // v2.0: 代码增强器
import { getTableSchema } from '@/services/schemaService';  // 🆕 Task 2.3: 第三道防线（性能优化）

// 生成唯一 ID
function generateId(): string {
    return `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 渲染代码模板
 * 将 {{variable}} 占位符替换为实际值
 * 模板中占位符无引号,由此函数根据类型添加引号
 */
export function renderTemplate(template: string, params: Record<string, unknown>): string {
    let result = template;
    for (const [key, value] of Object.entries(params)) {
        const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');

        // 智能类型转换（模板中无引号,由此函数添加）
        let replacement: string;
        if (Array.isArray(value)) {
            // 数组 → Python list
            replacement = JSON.stringify(value);  // ["a", "b"] → '["a", "b"]'
        } else if (typeof value === 'number') {
            // 数字 → 直接转字符串
            replacement = String(value);
        } else if (typeof value === 'boolean') {
            // 布尔值 → Python True/False  
            replacement = value ? 'True' : 'False';
        } else if (value === null || value === undefined) {
            // 空值 → None
            replacement = 'None';
        } else {
            // 字符串 → 加引号
            replacement = `'${value}'`;
        }

        result = result.replace(placeholder, replacement);
    }
    return result;
}

/**
 * 从参数中提取使用的列名
 * 
 * 架构改进（v2.0）：
 * - 🆕 优先使用 inputVariables（配置驱动），避免硬编码
 * - 🔄 兼容旧版：如果未提供 inputVariables，降级到硬编码 columnKeys
 * 
 * @param params 参数对象
 * @param inputVariables 可选：prompt 的 inputVariables（优先使用）
 * @returns 提取的列名数组
 */
export function extractColumnsUsed(
    params: Record<string, unknown>,
    inputVariables?: string[]
): string[] {
    const columns: string[] = [];

    // 🆕 架构改进：优先使用 prompt.inputVariables（配置驱动）
    if (inputVariables && inputVariables.length > 0) {
        // 🎯 核心逻辑：从 params 中提取 inputVariables 对应的列名
        for (const key of inputVariables) {
            const value = params[key];

            if (typeof value === 'string') {
                // 单列参数
                columns.push(value);
            } else if (Array.isArray(value)) {
                // 数组类型的列名参数（如 feature_cols）
                for (const item of value) {
                    if (typeof item === 'string') {
                        columns.push(item);
                    }
                }
            }
        }

        return columns;
    }

    // 🔄 降级处理：如果未提供 inputVariables，使用硬编码 columnKeys（向后兼容）
    const columnKeys = [
        // 通用单列字段
        'column_name', 'col_x', 'col_y', 'x_column', 'y_column',  // ✅ 添加 x_column/y_column
        // 特定用途单列
        'date_col', 'value_col', 'group_col', 'category_col', 'metric_col',
        // 回归/ML相关
        'target_col', 'feature_col',
        // 聚类相关（可能是数组）
        'cluster_col'
    ];

    // 数组类型的列名字段
    const arrayColumnKeys = [
        'feature_cols', 'group_cols', 'category_cols'
    ];

    // 提取单列参数
    for (const key of columnKeys) {
        if (params[key] && typeof params[key] === 'string') {
            columns.push(params[key] as string);
        }
    }

    // 提取数组类型的列名参数
    for (const key of arrayColumnKeys) {
        if (Array.isArray(params[key])) {
            const arr = params[key] as unknown[];
            for (const item of arr) {
                if (typeof item === 'string') {
                    columns.push(item);
                }
            }
        }
    }

    return columns;
}

/**
 * 膨胀单个 L1 推荐为 InsightNode
 * 
 * @param rec L1 推荐
 * @param tableName 表名（用于列名白名单校验）
 * @param schemaCache Schema缓存（性能优化，避免重复查询）
 * @param depth 深度
 */
export async function inflateRecommendation(
    rec: L1Recommendation,
    tableName: string,
    schemaCache?: Array<{ name: string; type: string }>,  // 🆕 Schema缓存
    depth: number = 0
): Promise<InsightNode | null> {
    // 1. 获取 Prompt 模板
    const prompt = promptRegistry.getPrompt(rec.promptId);

    if (!prompt) {
        logger.warn('AI服务', `[Inflater] 未找到 Prompt: ${rec.promptId}`);
        return null;
    }

    // 2. 验证必填参数
    const missingParams = prompt.inputVariables.filter(v => !(v in rec.params));
    if (missingParams.length > 0) {
        logger.warn('AI服务', `[Inflater] 缺少参数: ${missingParams.join(', ')}`);
        return null;
    }



    // 🆕 Task 2.3: 第三道防线 - 列名白名单校验（性能优化版）
    // ✅ 架构改进：使用 prompt.inputVariables 动态提取列名
    const extractedColumns = extractColumnsUsed(rec.params, prompt.inputVariables);

    if (extractedColumns.length > 0) {
        // 有提取到列名 → 使用白名单校验
        try {
            // 使用缓存的schema，如果没有则查询
            const schema = schemaCache || await getTableSchema(tableName);
            const validColumns = new Set(schema.map(col => col.name));

            const invalidColumns = extractedColumns.filter(col => !validColumns.has(col));

            if (invalidColumns.length > 0) {
                logger.warn('AI服务', `[${rec.promptId}] 列名验证失败: 列不存在 [${invalidColumns.join(', ')}]`, {
                    data: {
                        promptId: rec.promptId,
                        ai_params: rec.params,
                        required_params: prompt.inputVariables,
                        invalidColumns
                    }
                });
                return null;
            }

            logger.log('AI服务', `[Inflater] ✅ 列名白名单校验通过`, {
                data: { promptId: rec.promptId, columns: extractedColumns }
            });
        } catch (error) {
            logger.error('AI服务', '[Inflater] Schema获取失败，跳过校验', { error });
            // fail-open: 获取Schema失败时允许通过
        }
    } else {
        // 无法提取列名 → 记录警告但允许通过
        logger.warn('AI服务', `[Inflater] ⚠️ 无法提取列名参数，跳过校验`, {
            data: {
                promptId: rec.promptId,
                params: rec.params
            }
        });
    }



    // 3. 渲染代码模板 (如果有)
    let code: string | undefined;
    let rawCode: string | undefined;
    if (prompt.executionMode === 'TEMPLATE_FILL' && prompt.codeTemplate) {
        // ✅ 直接使用代码模板渲染 (Context已在 buildRouterPrompt 中注入到 AI Prompt)
        // ❌ 不要将 Context 注入到代码模板中,否则会导致Python代码中出现markdown+emoji
        rawCode = renderTemplate(prompt.codeTemplate, rec.params);

        // ✅ v3.0: 异步自动增强代码（零Token成本）
        const enhanceResult = await CodeEnhancer.enhance(rawCode, {
            columns: extractColumnsUsed(rec.params, prompt.inputVariables),  // ✅ 使用配置驱动
            dfName: 'df',
            promptType: prompt.name
        });

        code = enhanceResult.code;

        // 🔍 调试：对比rawCode和增强后的code
        logger.log('AI服务', `[Inflater] 代码增强对比`, {
            data: {
                rawCodeLength: rawCode.length,
                enhancedCodeLength: code.length,
                lengthGain: code.length - rawCode.length,
                isSame: rawCode === code,
                rawPreview: rawCode.slice(0, 200),
                enhancedPreview: code.slice(0, 200)
            }
        });

        logger.log('AI服务', `[Inflater] 使用模板模式渲染代码 + 自动增强`, {
            data: { rulesApplied: enhanceResult.rulesApplied }
        });
    }

    // 4. 构建下钻动作列表
    // 🆕 Feature Flag控制：ENABLE_DRILL_DOWN_NODE_CACHE
    const drillDownActions: DrillDownAction[] = [];
    const { isFeatureEnabled } = await import('@/config/featureFlags');
    const drillCacheEnabled = isFeatureEnabled('ENABLE_DRILL_DOWN_NODE_CACHE');

    if (!drillCacheEnabled) {
        // Feature Flag禁用时，隐藏所有下钻卡片
        logger.log('AI服务', `[Inflater] 下钻缓存功能已禁用，跳过drillHint`, {
            data: { nodeTitle: rec.reason || prompt.title }
        });
    } else if (rec.drillHint) {
        drillDownActions.push({
            ...rec.drillHint,
            isRecommended: true
        });
        // 🔍 验证日志
        logger.log('AI服务', `[Inflater] ✅ drillHint → drillDownActions`, {
            data: {
                nodeTitle: rec.reason || prompt.title,
                drillPromptId: rec.drillHint.promptId,
                drillLabel: rec.drillHint.label
            }
        });
    } else {
        // 🔍 验证日志
        logger.log('AI服务', `[Inflater] ⚠️ 无 drillHint，drillDownActions 为空`, {
            data: { nodeTitle: rec.reason || prompt.title }
        });
    }

    // 5. 创建 InsightNode
    const node: InsightNode = {
        id: generateId(),
        depth,
        title: rec.reason || prompt.title,
        columnsUsed: extractColumnsUsed(rec.params, prompt.inputVariables),  // ✅ 使用配置驱动
        promptId: rec.promptId,
        params: rec.params,
        isLoading: false,
        drillDownActions,
        children: [],
        isExpanded: false,
        // 预填充代码（如果有模板）
        result: code ? {
            code,
            rawCode,  // ✅ 同时保存纯净代码
            summary: '',
            columnsUsed: extractColumnsUsed(rec.params, prompt.inputVariables)  // ✅ 使用配置驱动
        } : undefined
    };

    // 🔍 调试：检查 rawCode 生成情况
    if (code && !rawCode) {
        logger.warn('AI服务', `[Inflater] ⚠️ 节点有 code 但缺少 rawCode`, {
            data: {
                nodeId: node.id,
                promptId: prompt.id,
                executionMode: prompt.executionMode,
                hasCodeTemplate: !!prompt.codeTemplate
            }
        });
    }

    return node;
}

/**
 * 批量膨胀推荐（性能优化版）
 * 
 * @param recommendations L1推荐列表
 * @param tableName 表名（用于列名校验）
 */
export async function inflateRecommendations(
    recommendations: L1Recommendation[],
    tableName: string
): Promise<InsightNode[]> {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`; // 🆕 批次唯一ID
    const startTime = performance.now();  // 🔍 性能追踪
    logger.log('AI服务', `[Inflater] 🚀 开始批量膨胀`, {
        data: { batchId, count: recommendations.length, tableName }
    });

    const nodes: InsightNode[] = [];

    // 🆕 性能优化：提前查询一次schema，避免重复查询
    let schemaCache: Array<{ name: string; type: string }> | undefined;
    try {
        schemaCache = await getTableSchema(tableName);
        logger.log('AI服务', `[Inflater] Schema缓存已加载`, {
            data: { columns: schemaCache.length }
        });
    } catch (error) {
        logger.warn('AI服务', '[Inflater] Schema预加载失败，将逐个查询', { error });
    }

    // 🆕 并发优化：使用限流并发（最多2个同时执行）
    const pLimit = (await import('p-limit')).default;
    const limit = pLimit(2);  // 最多同时2个

    logger.log('AI服务', `[Inflater] 使用限流并发模式 (并发数: 2)`);

    const nodePromises = recommendations.map(rec =>
        limit(async () => {
            const node = await inflateRecommendation(rec, tableName, schemaCache, 0);
            return node;
        })
    );

    const results = await Promise.all(nodePromises);

    // 过滤掉 null 结果
    for (const node of results) {
        if (node) {
            nodes.push(node);
        }
    }

    const totalDuration = performance.now() - startTime;
    logger.log('AI服务', `[Inflater] 🏁 膨胀完成: ${nodes.length}/${recommendations.length} 个节点 (批次ID: ${batchId}, 总耗时: ${totalDuration.toFixed(1)}ms)`);
    return nodes;
}

/**
 * 获取 Prompt 的渲染后代码（同时返回纯净和增强版本）
 * 用于在 Hook 中执行
 */
export async function getRenderedCode(promptId: string, params: Record<string, unknown>): Promise<{ code: string; rawCode: string } | null> {
    const prompt = promptRegistry.getPrompt(promptId);

    if (!prompt) {
        logger.error('AI服务', `[Inflater] 未找到 Prompt: ${promptId}`);
        return null;
    }

    if (prompt.executionMode !== 'TEMPLATE_FILL' || !prompt.codeTemplate) {
        logger.warn('AI服务', `[Inflater] Prompt ${promptId} 不支持模板模式`);
        return null;
    }

    const rawCode = renderTemplate(prompt.codeTemplate, params);

    // ✅ v3.0: 异步自动增强代码
    const enhanceResult = await CodeEnhancer.enhance(rawCode, {
        columns: extractColumnsUsed(params),
        dfName: 'df',
        promptType: prompt.name
    });

    logger.log('AI服务', `[getRenderedCode] 代码增强完成`, {
        data: {
            promptId,
            rulesApplied: enhanceResult.rulesApplied
        }
    });

    return {
        code: enhanceResult.code,
        rawCode  // ✅ 同时返回纯净代码
    };
}
