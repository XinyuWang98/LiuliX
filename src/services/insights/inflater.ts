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
 */
function extractColumnsUsed(params: Record<string, unknown>): string[] {
    const columns: string[] = [];
    const columnKeys = ['column_name', 'col_x', 'col_y', 'date_col', 'value_col', 'group_col'];

    for (const key of columnKeys) {
        if (params[key] && typeof params[key] === 'string') {
            columns.push(params[key] as string);
        }
    }

    return columns;
}

/**
 * 膨胀单个 L1 推荐为 InsightNode
 */
export function inflateRecommendation(
    rec: L1Recommendation,
    depth: number = 0
): InsightNode | null {
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

    // 3. 渲染代码模板 (如果有)
    let code: string | undefined;
    if (prompt.executionMode === 'TEMPLATE_FILL' && prompt.codeTemplate) {
        code = renderTemplate(prompt.codeTemplate, rec.params);
        logger.log('AI服务', `[Inflater] 使用模板模式渲染代码`);
    }

    // 4. 构建下钻动作列表
    const drillDownActions: DrillDownAction[] = [];
    if (rec.drillHint) {
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
        columnsUsed: extractColumnsUsed(rec.params),
        promptId: rec.promptId,
        params: rec.params,
        isLoading: false,
        drillDownActions,
        children: [],
        isExpanded: false,
        // 预填充代码（如果有模板）
        result: code ? {
            code,
            summary: '',
            columnsUsed: extractColumnsUsed(rec.params)
        } : undefined
    };

    return node;
}

/**
 * 批量膨胀 L1 推荐列表
 */
export function inflateRecommendations(
    recommendations: L1Recommendation[]
): InsightNode[] {
    const nodes: InsightNode[] = [];

    for (const rec of recommendations) {
        const node = inflateRecommendation(rec, 0);
        if (node) {
            nodes.push(node);
        }
    }

    logger.log('AI服务', `[Inflater] 膨胀完成: ${nodes.length}/${recommendations.length} 个节点`);
    return nodes;
}

/**
 * 获取 Prompt 的渲染后代码
 * 用于在 Hook 中执行
 */
export function getRenderedCode(promptId: string, params: Record<string, unknown>): string | null {
    const prompt = promptRegistry.getPrompt(promptId);

    if (!prompt) {
        logger.error('AI服务', `[Inflater] 未找到 Prompt: ${promptId}`);
        return null;
    }

    if (prompt.executionMode !== 'TEMPLATE_FILL' || !prompt.codeTemplate) {
        logger.warn('AI服务', `[Inflater] Prompt ${promptId} 不支持模板模式`);
        return null;
    }

    return renderTemplate(prompt.codeTemplate, params);
}
