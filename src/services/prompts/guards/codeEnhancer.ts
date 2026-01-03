/**
 * AI代码增强器 v3.0 统一接口
 * 
 * 支持AST/正则方案动态切换，跨平台适配（Web/PC）
 * 零Token成本，确定性修复
 * 
 * @author AntiGravity
 * @date 2026-01-03
 */

import { logger } from '@/utils/logger';
import { getFeatureFlags } from '@/config/featureFlags';

export interface EnhanceContext {
    columns: string[];      // 数据集列名
    dfName?: string;        // DataFrame变量名（默认'df'）
    promptType?: string;    // Prompt类型（用于场景化增强）
}

export interface EnhanceResult {
    code: string;           // 增强后的代码
    rulesApplied: string[]; // 应用的规则列表
    originalLength: number; // 原始代码长度
    enhancedLength: number; // 增强后代码长度
    success?: boolean;      // 增强是否成功（v3.0新增）
    error?: string;         // 错误信息（v3.0新增）
    stats?: Record<string, any>;  // 统计信息（v3.0新增）
}

/**
 * 动态选择平台适配器
 */
async function getAdapter() {
    if (typeof window !== 'undefined') {
        // Web端：使用Pyodide
        const { PyodideEnhancerAdapter } = await import('@/adapters/web/pyodideEnhancerAdapter');
        return PyodideEnhancerAdapter;
    } else {
        // PC端：使用Native Python（Tauri，未来实现）
        throw new Error('PC端适配器未实现');
    }
}

export class CodeEnhancer {
    /**
     * 统一增强接口（v3.0 异步版本）
     * 
     * 自动选择最佳增强方案：
     * 1. 如果启用AST增强器且可用 → 使用AST方案（v3.0）
     * 2. AST失败或未启用 → 降级到正则方案（v2.0）
     * 
     * @param code AI生成的原始代码
     * @param context 上下文信息
     * @returns 增强结果（Promise）
     */
    static async enhance(code: string, context: EnhanceContext): Promise<EnhanceResult> {
        const flags = getFeatureFlags();

        // 尝试使用AST增强器（v3.0）
        if (flags.USE_AST_CODE_ENHANCER) {
            try {
                const Adapter = await getAdapter();
                const result = await Adapter.enhance(code, context);

                // 成功使用AST方案
                if (result.success) {
                    logger.log('AI代码增强', 'AST增强成功', {
                        data: {
                            rulesApplied: result.rulesApplied?.length || 0,
                            codeLength: result.code.length
                        }
                    });
                    return result;
                }
            } catch (error: any) {
                // AST方案失败，记录日志并降级
                logger.warn('AI代码增强', 'AST增强失败，降级到正则方案', {
                    error: error.message
                });
            }
        }

        // 降级到v2.0正则方案（同步）
        return this.enhanceWithRegex(code, context);
    }

    /**
     * v2.0 正则方案（作为降级备份）
     * 
     * 保持原有逻辑不变，确保兼容性
     */
    private static enhanceWithRegex(code: string, context: EnhanceContext): EnhanceResult {
        const rulesApplied: string[] = [];
        let enhanced = code;
        const originalLength = code.length;

        // 规则1: 全局空数据检查
        enhanced = this.injectEmptyCheck(enhanced, context);
        rulesApplied.push('empty-check');

        // 规则2: 列存在性验证
        const usedColumns = this.extractUsedColumns(enhanced);
        if (usedColumns.length > 0) {
            enhanced = this.injectColumnValidation(enhanced, context, usedColumns);
            rulesApplied.push('column-validation');
        }

        // 🔴 规则3: 数组访问保护（临时禁用）
        // TODO: v3.0 AST方案已实现精确识别，正则方案永久禁用此规则
        // 参考文档: docs/04-技术专题/02-Prompt库/08-专题-Prompt库AI代码质量提升方案.md §13.1

        // 规则4: 全局异常捕获
        enhanced = this.wrapTryCatch(enhanced);
        rulesApplied.push('try-catch-wrapper');

        // 场景化增强
        if (context.promptType?.includes('groupby')) {
            enhanced = this.enhanceGroupBy(enhanced, context);
            rulesApplied.push('groupby-enhancement');
        }

        logger.log('AI代码增强', 'v2.0正则增强完成', {
            data: {
                rulesApplied: rulesApplied.length
            }
        });

        return {
            code: enhanced,
            rulesApplied,
            originalLength,
            enhancedLength: enhanced.length,
            success: true
        };
    }

    /**
     * 规则1: 注入空数据检查
     */
    private static injectEmptyCheck(code: string, ctx: EnhanceContext): string {
        const dfName = ctx.dfName || 'df';
        const check = `# === 自动注入：空数据检查 ===
if len(${dfName}) == 0:
    raise ValueError("输入数据为空，无法进行分析")

`;
        return check + code;
    }

    /**
     * 规则2: 注入列存在性验证
     */
    private static injectColumnValidation(
        code: string,
        ctx: EnhanceContext,
        usedColumns: string[]
    ): string {
        const dfName = ctx.dfName || 'df';
        const validation = `# === 自动注入：列存在性检查 ===
required_cols = ${JSON.stringify(usedColumns)}
missing = [c for c in required_cols if c not in ${dfName}.columns]
if missing:
    raise ValueError(f"缺少必需列: {missing}")

`;
        return validation + code;
    }

    /**
     * 规则4: 全局异常捕获
     */
    private static wrapTryCatch(code: string): string {
        const indented = code.split('\n')
            .map(line => '    ' + line)
            .join('\n');

        return `try:
${indented}
except IndexError as e:
    raise ValueError(f"数据索引越界（可能是过滤后结果为空）: {str(e)}")
except KeyError as e:
    raise ValueError(f"列不存在: {str(e)}")
except ZeroDivisionError:
    raise ValueError("除零错误（可能是分组后某组数据为空）")
`;
    }

    /**
     * 场景化增强：groupby类Prompt
     */
    private static enhanceGroupBy(code: string, ctx: EnhanceContext): string {
        // 尝试提取分组列
        const groupColMatch = code.match(/groupby\(['"]([^'"]+)['"]\)/);
        if (!groupColMatch) return code;

        const groupCol = groupColMatch[1];
        const dfName = ctx.dfName || 'df';

        const groupCheck = `# === Groupby专用检查 ===
if ${dfName}['${groupCol}'].nunique() < 2:
    raise ValueError(f"分组列 ${groupCol} 唯一值过少，无法分组")

`;
        return groupCheck + code;
    }

    /**
     * 辅助：从代码中提取使用的列名
     */
    private static extractUsedColumns(code: string): string[] {
        const columns = new Set<string>();

        // 匹配 df['col'] 或 df["col"]
        const regex1 = /df\[['"]([^'"]+)['"]\]/g;
        let match;
        while ((match = regex1.exec(code)) !== null) {
            columns.add(match[1]);
        }

        // 匹配 df.col（但排除方法调用如 df.groupby）
        const regex2 = /df\.([a-zA-Z_][a-zA-Z0-9_]*)\b(?!\()/g;
        while ((match = regex2.exec(code)) !== null) {
            const col = match[1];
            // 排除DataFrame的方法名
            if (!['groupby', 'agg', 'mean', 'sum', 'count', 'head', 'tail', 'describe'].includes(col)) {
                columns.add(col);
            }
        }

        return Array.from(columns);
    }
}
