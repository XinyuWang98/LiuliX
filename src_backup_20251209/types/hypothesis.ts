/**
 * 结构化假设 Schema
 * 定义 AI 生成或用户输入的假设的结构化解析结果
 */
export interface HypothesisSchema {
    /** AI 或用户提供的中文假设描述 */
    hypothesis_text: string;

    /** 假设检验的类型(例如:均值差异检验、相关性检验) */
    test_type: string;

    /** 验证假设所需的关键字段名或字段类型 */
    required_fields: string[];

    /** 验证该假设所需的具体分析方法(如:T-Test, ANOVA, Chi-Square) */
    validation_analysis: string;

    /** 推荐用于验证该假设的 Prompt 库 ID */
    suggested_prompt_id: string;
}
