/**
 * 清洗Router
 * 实现AI选择清洗模板 → SQL模板填充的工作流程
 */

import { promptRegistry } from '@/services/promptRegistry';
import { logger } from '@/utils/logger';
import type { CleaningSuggestion } from '@/services/aiService';
import { buildCleaningRouterPrompt } from './cleaningRouter/index';  // 🆕 导入语言路由函数

/**
 * Router响应接口
 */
interface RouterRecommendation {
    promptId: string;
    params: Record<string, unknown>;
    reason: string;
}

/**
 * 清洗Router类
 * 
 * 工作流程：
 * 1. 构建Router Prompt（附清洗模板清单）
 * 2. AI选择模板并填充参数
 * 3. SQL Inflater填充模板
 * 4. 返回CleaningSuggestion[]
 */
export class CleaningRouter {
    // 候选意图标签 (对应 Prompt ID)
    private static readonly CANDIDATE_LABELS = [
        'cleaner_delete_null_rows',
        'cleaner_fill_null_mean',
        'cleaner_fill_null_median',
        'cleaner_fill_null_mode',
        'cleaner_fill_null_unknown',
        'cleaner_remove_duplicates',
        'cleaner_standardize_date',
        'cleaner_standardize_phone',
        'cleaner_standardize_email',
        'cleaner_trim_whitespace',
        'cleaner_cast_to_numeric',
        'cleaner_filter_outliers_iqr'
    ];

    /**
     * 主入口：生成清洗建议 (支持本地/云端双模式)
     */
    async generate(
        tableName: string,
        columns: any[],
        stats: any[],
        aiService: (prompt: string) => Promise<string>
    ): Promise<CleaningSuggestion[]> {

        // 检查 Feature Flag
        const useLocalRouter = await this.checkLocalRouterEnabled();

        if (useLocalRouter) {
            return this.generateLocal(tableName, columns, stats, aiService);
        } else {
            return this.generateCloud(tableName, columns, stats, aiService);
        }
    }

    private async checkLocalRouterEnabled(): Promise<boolean> {
        // 动态导入以避免循环依赖
        const { isFeatureEnabled } = await import('@/config/featureFlags');

        // 1. 检查 Flag
        if (!isFeatureEnabled('ENABLE_LOCAL_ROUTER')) return false;

        // 2. 检查 Worker 状态 (可选，也可以让它自动加载)
        // return localRouterService.getStatus() !== 'error';
        return true;
    }

    /**
     * 本地模式生成 (Transformers.js)
     */
    private async generateLocal(
        tableName: string,
        columns: any[],
        stats: any[],
        aiService: (prompt: string) => Promise<string> // Fallback needs this
    ): Promise<CleaningSuggestion[]> {
        logger.group('AI清洗', 'Local Router 模式');
        try {
            const { localRouterService } = await import('@/services/ai/localRouter/LocalRouterService');

            // 1. 获取用户 Prompt (这里我们需要一个机制获取当前的 User Input)
            // 目前 CleaningRouter.generate 接口没有传入 userPrompt，它是根据 Columns/Stats 自动生成的？
            // ❌ 错误：CleaningRouter 目前的设计是 "自动推荐" (Auto Suggestion)，而不是 "用户对话" (Chat)。
            // 它根据 buildRouterPrompt 生成的 Prompt (包含 columns profile) 发给 LLM，让 LLM 决定清洗什么。

            // ⚠️ 关键架构差异:
            // - Cloud Router: Sends Profile -> LLM -> LLM Suggests Actions.
            // - Local Router: Profile -> ??? -> Classifier?

            // 如果没有用户输入，Local Router 无法工作 (Bart 是 NLI 模型，需要 Hypothesis)。
            // 除非我们将 Profile 作为 Premise，将 Actions 作为 Hypothesis？
            // 但这通常用于检验 "是否蕴含"。

            // 💡 修正理解: 
            // 当前的 CleaningRouter 是 "自动体检"。它不接受用户指令。
            // 只有 "Chat Mode" (AnalysisRouter) 接受用户指令。

            // ❓ 既然是 "自动体检"，Transformers.js 如何工作？
            // 方案 A: 依然需要 LLM (WebLLM) 进行推理。
            // 方案 B: 使用规则/启发式算法 + 小模型辅助 (例如检测异常列)。
            // 方案 C: 将 "Local Router" 仅用于 "用户指令响应" 场景，而非 "自动体检"。

            // 回顾 implementation_plan.md:
            // "意图识别: 从自然语言中选择正确的清洗模板"
            // 这暗示了有 "自然语言" 输入。

            // 检查调用方 `aiCleaningService.ts`:
            // `return cleaningRouter.generate(tableName, columns, stats, ...)`
            // 并没有 userPrompt。

            // 🛑 发现问题：设计的 "Local Router" (Text -> Intent) 适用于 "对话模式"，但不适用于当前的 "自动推荐模式"。
            // 当前 `CleaningRouter.generate` 是自动运行的。

            // 修正策略:
            // 1. 如果是自动推荐，必须回退到 Rule-Based 或 Cloud API，或者 WebLLM。Transformers.js (Bart) 无法凭空生成建议。
            // 2. 除非.... 我们把任务定义为 "针对每一列，询问是否存在问题"。
            //    例如：Premise="Column Age has 50% nulls", Hypothesis="This column needs filling".

            // 考虑到当前改动是针对 "Local Router Support"，且 PoC 是基于 Text Classifcation。
            // 我必须假设这里有一个误解，或者我们需要支持 "用户指令驱动的清洗"。

            // 但 `CleaningRouter` 目前只做自动推荐。
            // 在 `aiCleaningService.ts` 中，有 `generateCleaningSuggestions` (Auto)。

            // 也许用户意图是支持 "Command Bar" 或 "Chat" 中的 Router？
            // 但文档明确指了 `src/services/ai/CleaningRouter.ts`。

            // 让我们再看一眼 `CleaningRouter` 的用途。
            // 它构建一个 Prompt："这里是数据画像...请推荐清洗操作..."

            // 如果要在本地做 "自动推荐"，Bart MNLI 可以用来做 "Zero-Shot Anomaly Classification"。
            // 遍历每一列：
            //   Prompt: "Column 'Age' (Type: Integer) has 10% missing values."
            //   Candidate Labels: ["needs filling", "needs dropping", "is clean"]
            //   如果 "needs filling" > 0.8 -> 生成 `cleaner_fill_null_mean` 建议。

            // ✨ 这就是方案！利用 Zero-Shot Classifier 做基于描述的规则推理。

            // 实现逻辑：
            // 1. 遍历所有列。
            // 2. 为每列生成一段自然语言描述 (e.g. "Column Age contains 5 nulls.").
            // 3. 将描述输入 Classifier，Candidates = [PromptIDs].
            // 4. 收集高置信度的建议。

            const suggestions: RouterRecommendation[] = [];

            // 遍历列生成描述
            for (const col of columns) {
                // 简单的规则描述生成
                const colStat = stats.find(s => s.columnName === col.name);
                const description = this.generateColumnDescription(col, colStat);

                if (!description) continue;

                // 调用 Classifier
                const result = await localRouterService.classifyIntent(description, CleaningRouter.CANDIDATE_LABELS);
                const bestLabel = result.labels[0];
                const bestScore = result.scores[0];

                if (bestScore > 0.4) { // 阈值
                    suggestions.push({
                        promptId: bestLabel,
                        params: { column: col.name }, // 假设参数就是当前列
                        reason: `Local AI Detected: ${description} (Confidence: ${(bestScore * 100).toFixed(0)}%)`
                    });
                }
            }

            if (suggestions.length === 0) {
                logger.warn('AI清洗', 'Local Router 未发现建议，降级到 Cloud');
                throw new Error('No local suggestions');
            }

            const injected = await this.injectStats(suggestions, stats);
            return this.inflateSQLTemplates(injected, tableName, stats);

        } catch (error) {
            logger.warn('AI清洗', `Local Router 失败/跳过: ${error} -> 降级 Cloud`);
            return this.generateCloud(tableName, columns, stats, aiService);
        } finally {
            logger.groupEnd();
        }
    }

    private generateColumnDescription(col: any, stat: any): string | null {
        if (!stat) return null;
        const parts = [`Column '${col.name}' is of type ${col.type}.`];

        if (stat.nullCount > 0) parts.push(`It has ${stat.nullCount} missing values.`);
        if (stat.uniqueCount) parts.push(`It has ${stat.uniqueCount} unique values.`);
        // ToDo: More stats

        return parts.join(' ');
    }

    // Inject stats wrapper
    private async injectStats(recs: RouterRecommendation[], stats: any[]) {
        const { injectStatsParams } = await import('./paramInjector');
        return injectStatsParams(recs, stats);
    }

    /**
     * 云端模式生成 (原始逻辑)
     */
    private async generateCloud(
        tableName: string,
        columns: any[],
        stats: any[],
        aiService: (prompt: string) => Promise<string>
    ): Promise<CleaningSuggestion[]> {
        // ... (Original Code) ...
        logger.group('AI清洗', 'Cloud Router 模式');
        try {
            // Step 1: 构建Router Prompt
            const prompt = this.buildRouterPrompt(columns, stats);
            // ... logs ...

            // Step 2: 调用AI
            const aiResponse = await aiService(prompt);
            // ... logs ...

            // Step 3: 解析AI响应
            const recommendations = this.parseRouterResponse(aiResponse);

            // Step 3.5: 注入参数
            const { injectStatsParams } = await import('./paramInjector');
            const injectedRecommendations = injectStatsParams(recommendations, stats);

            // Step 4: SQL Inflater
            const suggestions = this.inflateSQLTemplates(
                injectedRecommendations,
                tableName,
                stats
            );

            logger.groupEnd();
            return suggestions;

        } catch (error) {
            logger.groupEnd();
            logger.error('AI清洗', `Router失败: ${error}`);
            return [];
        }
    }

    // ... (Keep existing private methods: buildRouterPrompt, parseRouterResponse, inflateSQLTemplates, inferType) ...

    /**
     * 构建Router Prompt（使用语言路由）
     */
    private buildRouterPrompt(columns: any[], stats: any[]): string {
        return buildCleaningRouterPrompt(columns, stats);
    }

    private parseRouterResponse(aiResponse: string): RouterRecommendation[] {
        // ... (Keep existing implementation) ...
        try {
            let jsonStr = aiResponse;
            const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                jsonStr = jsonMatch[1].trim();
            }

            const parsed = JSON.parse(jsonStr);
            const recommendations = parsed.recommendations || parsed;

            if (!Array.isArray(recommendations)) {
                return [];
            }

            const validRecs = recommendations.filter((rec: any) => {
                if (!rec.promptId || !rec.params) return false;
                if (!promptRegistry.hasPrompt(rec.promptId)) return false;
                return true;
            });

            return validRecs;

        } catch (error) {
            return [];
        }
    }

    private inflateSQLTemplates(
        recommendations: RouterRecommendation[],
        tableName: string,
        _stats: any[]
    ): CleaningSuggestion[] {
        // ... (Keep existing implementation) ...
        const suggestions: CleaningSuggestion[] = [];

        for (let i = 0; i < recommendations.length; i++) {
            const rec = recommendations[i];
            const template = promptRegistry.getPrompt(rec.promptId);
            if (!template || !template.sqlTemplate) continue;

            promptRegistry.recordUsage(rec.promptId);

            let sql = template.sqlTemplate;
            sql = sql.replace(/__TABLE_NAME__/g, tableName);

            for (const [key, value] of Object.entries(rec.params)) {
                const placeholder = `{${key}}`;
                sql = sql.replace(new RegExp(placeholder, 'g'), String(value));
            }

            suggestions.push({
                id: `router-${rec.promptId}-${i}`,
                type: this.inferType(rec.promptId) as any,
                label: template.title,
                reason: rec.reason,
                sql: sql,
                confidence: 0.90,
            });
        }
        return suggestions;
    }

    private inferType(promptId: string): string {
        if (promptId.includes('dedup')) return 'dedup';
        if (promptId.includes('fill')) return 'fill';
        if (promptId.includes('standardize')) return 'normalize';
        if (promptId.includes('drop')) return 'filter';
        return 'other';
    }
}
