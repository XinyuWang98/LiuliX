/**
 * AI代码增强器 v2.0
 * 
 * 在AI生成的Python代码执行前自动注入防御逻辑
 * 零Token成本，确定性修复
 * 
 * @author AntiGravity
 * @date 2026-01-02
 */


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
}

export class CodeEnhancer {
    /**
     * 自动增强AI生成的代码
     * @param code AI生成的原始代码
     * @param context 上下文信息
     * @returns 增强结果
     */
    static enhance(code: string, context: EnhanceContext): EnhanceResult {
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
        // TODO: v3.0将使用AST精确识别，避免误伤.index[0]等属性访问
        // 当前正则方案会错误地将`df.index[0]`替换为`df.((index[0]...))`导致SyntaxError
        // 参考文档: docs/04-技术专题/02-Prompt库/08-专题-Prompt库AI代码质量提升方案.md §13.1
        /*
        if (this.hasArrayAccess(enhanced)) {
            enhanced = this.wrapArrayAccess(enhanced);
            rulesApplied.push('array-access-protection');
        }
        */

        // 规则4: 全局异常捕获
        enhanced = this.wrapTryCatch(enhanced);
        rulesApplied.push('try-catch-wrapper');

        // 场景化增强
        if (context.promptType?.includes('groupby')) {
            enhanced = this.enhanceGroupBy(enhanced, context);
            rulesApplied.push('groupby-enhancement');
        }

        // 日志记录（简化版，避免类型错误）
        // logger.log('AI服务', '代码增强完成');

        return {
            code: enhanced,
            rulesApplied,
            originalLength,
            enhancedLength: enhanced.length
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
     * 规则3: 包装数组访问
     * @deprecated 临时禁用，等待v3.0 AST方案移除
     */
    // @ts-expect-error - 保留以便 v3.0 参考
    private static wrapArrayAccess(code: string): string {
        // 将 arr[0] 替换为安全访问
        // 注意：只替换简单的数字索引访问，不替换切片或列访问
        return code.replace(
            /(\w+)\[(\d+)\](?!\s*=)/g,  // 匹配 arr[0] 但不匹配 arr[0] =
            '($1[$2] if len($1) > $2 else None)'
        );
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

    /**
     * 辅助：检查代码中是否有数组索引访问
     * @deprecated 临时未使用，等待v3.0 AST方案移除
     */
    // @ts-expect-error - 保留以便 v3.0 参考
    private static hasArrayAccess(code: string): boolean {
        return /\w+\[\d+\]/.test(code);
    }
}
