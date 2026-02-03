/**
 * 数据上下文服务接口
 * 
 * 提供访问数据（行和统计信息）的抽象层
 * 用于支持真实运行时（DuckDB）和 Mock 环境（Playground）。
 */

import { ColumnStats } from '@/types/data';

export interface IDataContextService {
    /** 
     * 获取采样数据 (用于 Context Simulator) 
     * @param limit 限制行数, 默认 10
     */
    getSampleData(limit?: number): Promise<any[]>;

    /** 
     * 获取列统计信息 (用于 Stats Injection) 
     * @param columns 指定列名列表
     */
    getColumnStats(columns: string[]): Promise<ColumnStats[]>;

    /** 
     * 预览 Prompt (编译模板) 
     * @param template 原始模板字符串
     * @param vars 变量字典
     */
    previewPrompt(template: string, vars: Record<string, any>): Promise<string>;

    /** 
     * 执行测试 (可选) 
     * @param code 生成的代码
     */
    runTest(code: string): Promise<any>;
}
