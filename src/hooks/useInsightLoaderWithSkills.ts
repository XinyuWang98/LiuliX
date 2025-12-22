/**
 * Skills版本的洞察加载Hook
 * 使用Function Calling模式替代传统JSON解析
 */

import { useState } from 'react';
import { HypothesisCard as HypothesisCardType } from '@/types/insightChain';
import { executeWithRecovery } from '@/services/skills/errorRecovery';
import { logger } from '@/utils/logger';
import { getSkillsConfig } from '@/config/skillsConfig';
import { skillsDispatcher } from '@/services/skills/dispatcher';  // 🔧 新增

export function useInsightLoaderWithSkills() {
    const [isLoading, setIsLoading] = useState(false);
    const [executionProgress, setExecutionProgress] = useState<{ current: number; total: number } | null>(null);

    /**
     * 使用Skills模式加载洞察
     * @param columns 列名列表
     * @param rowCount 行数
     * @param tableName 表名
     * @returns 洞察卡片列表
     */
    const loadInsightsWithSkills = async (
        columns: string[],
        rowCount: number,
        tableName?: string
    ): Promise<HypothesisCardType[]> => {
        setIsLoading(true);
        setExecutionProgress(null);

        try {
            const config = getSkillsConfig();

            logger.group('Skills', 'Skills模式洞察加载');
            logger.log('Skills', '配置检查', {
                data: {
                    enabled: config.GLOBAL_ENABLED,
                    module: config.MODULES.INSIGHT_CHAIN,
                    multiStep: config.ADVANCED.MULTI_STEP,
                    recovery: config.ADVANCED.ERROR_RECOVERY
                }
            });

            // 构建AI提示词
            const prompt = buildInsightPrompt(columns, rowCount, tableName);

            // 🔧 设置dispatcher当前表名（Skills执行需要）
            if (tableName) {
                skillsDispatcher.setCurrentTable(tableName);
            }

            // 使用错误修正循环执行
            const result = await executeWithRecovery(prompt, {
                modelType: 'deepseek',  // 优先使用DeepSeek（支持Native Tools）
                apiKey: localStorage.getItem('deepseek_advanced_key') || 'default',
                onProgress: (current, total) => {
                    logger.log('Skills', `执行进度: ${current}/${total}`);
                    setExecutionProgress({ current, total });
                }
            });

            logger.log('Skills', 'Skills执行成功', {
                count: result.steps,
                data: { duration: result.duration }
            });

            // 转换为洞察卡片格式
            const insights = convertToInsightCards(result);

            logger.log('Skills', '洞察卡片生成完成', { count: insights.length });
            logger.groupEnd();

            return insights;

        } catch (error: any) {
            logger.error('Skills', 'Skills模式执行失败', error);
            logger.groupEnd();

            // 降级：返回Mock数据
            logger.log('Skills', '降级到Mock模式');
            return getMockInsights();

        } finally {
            setIsLoading(false);
            setExecutionProgress(null);
        }
    };

    return {
        isLoading,
        executionProgress,
        loadInsightsWithSkills
    };
}

/**
 * 构建洞察分析Prompt
 */
function buildInsightPrompt(columns: string[], rowCount: number, tableName?: string): string {
    // 智能列过滤（解决99列问题）
    const importantColumns = filterImportantColumns(columns);
    const config = getAnalysisConfig();

    return `
作为数据分析专家，请分析以下数据集并生成2-3个关键洞察。

**数据集信息**：
- 表名：${tableName || 'data'}
- 总行数：${rowCount}
- 总列数：${columns.length}
- 分析列数：${importantColumns.length}列（用户配置：最多${config.maxColumns}列）
- 关键列：${importantColumns.join(', ')}

**要求**：
1. 分析数据特征，识别潜在问题或有价值的模式
2. 使用可用的工具（viz_create_chart、sys_run_sql等）生成可视化证据
3. 每个洞察必须基于真实数据，不要编造
4. 如需查询其他列，可通过sys_run_sql工具访问完整数据

请调用相应的工具来生成洞察分析。
`.trim();
}

import { getAnalysisConfig } from '@/config/analysisConfig';

/**
 * 智能列过滤（解决99列Prompt过大问题）
 */
function filterImportantColumns(columns: string[]): string[] {
    const config = getAnalysisConfig();
    const maxColumns = config.maxColumns;

    if (columns.length <= maxColumns) {
        return columns;
    }

    // 优先级规则
    const priorityPatterns = [
        /date|time|year|month|day/i,      // 时间列（最高优先级）
        /amount|price|sales|revenue|cost/i, // 金额列
        /count|quantity|number|num/i,     // 数量列
        /id|name|title|type|category/i    // 标识列
    ];

    const scored = columns.map(col => ({
        name: col,
        score: priorityPatterns.reduce((acc, pattern, idx) =>
            acc + (pattern.test(col) ? (4 - idx) : 0), 0)
    }));

    // 按得分排序，取Top N（N=用户配置）
    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, maxColumns)
        .map(c => c.name);
}

/**
 * 将Skills执行结果转换为洞察卡片
 */
function convertToInsightCards(result: any): HypothesisCardType[] {
    if (!result.results || result.results.length === 0) {
        return [];
    }

    return result.results.map((res: any, idx: number) => ({
        id: `insight-skills-${Date.now()}-${idx}`,
        title: res.data?.title || `洞察 ${idx + 1}`,
        description: res.data?.description || '基于数据分析生成的洞察',
        verificationMethod: '通过Skills工具调用验证',
        isExpanded: false,
        executionResult: res.data?.chart ? {
            image: res.data.chart,
            summary: res.data.summary || '',
            code: res.metadata?.sql || res.metadata?.python || ''
        } : undefined,
        executionStatus: res.success ? 'success' : 'error'
    }));
}

/**
 * Mock洞察数据（降级方案）
 */
function getMockInsights(): HypothesisCardType[] {
    return [
        {
            id: 'mock-skills-1',
            title: '数据质量检测 (Mock)',
            description: 'Skills执行失败，使用Mock数据。建议检查AI服务配置。',
            verificationMethod: '启用Skills后自动执行',
            isExpanded: false,
            executionStatus: 'error'
        }
    ];
}
