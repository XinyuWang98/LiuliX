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

        // ✅ AST增强器是唯一方案
        if (!flags.USE_AST_CODE_ENHANCER) {
            throw new Error('AST代码增强器未启用,无法执行代码增强');
        }

        try {
            const Adapter = await getAdapter();
            const result = await Adapter.enhance(code, context);

            // AST失败时直接抛错,不降级
            if (!result.success) {
                throw new Error(`AST增强失败: ${result.error || '未知错误'}`);
            }

            logger.log('AI代码增强', 'AST增强成功', {
                data: {
                    rulesApplied: result.rulesApplied?.length || 0,
                    codeLength: result.code.length
                }
            });

            return result;

        } catch (error: any) {
            // 记录错误并直接抛出,不降级
            logger.error('AI代码增强', 'AST增强失败', {
                error: error.message
            });
            throw error;
        }
    }

}
