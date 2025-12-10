/**
 * Prompt 库结构
 * 定义 AI 分析提示词的配置格式
 */
export interface PromptSchema {
    /** 唯一标识符,如 'cleaning_iqr' */
    id: string;

    /** 提示词的中文标题 */
    title: string;

    /** 分类 */
    category: '清洗' | '分析' | '报告' | '特征工程';

    /** 上下文依赖条件 (如 {has_date_type: true}) */
    prerequisite: Record<string, any>;

    /** AI 最终执行的指令文本模板 (包含变量占位符) */
    full_prompt: string;

    /** 需要用户选择或程序注入的变量列表 (如 ['{target_column}', '{project.alpha_value}']) */
    input_vars: string[];

    /** 期望 AI 输出的格式 */
    output_format: 'Python Code + Chart' | 'Python Code' | 'Summary' | 'Model Report';
}
