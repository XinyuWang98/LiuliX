/**
 * sys_run_sql 通用Skill（简化版本）
 * 提供接口定义，实际执行由Dispatcher路由
 */

import { SkillDefinition, SkillExecutionResult } from '../definitions';

/**
 * SQL权限级别
 */
export type SQLPermissionLevel = 'READ_ONLY' | 'CLEANING' | 'FULL';

/**
 * sys_run_sql Skill定义
 */
export const SYS_RUN_SQL_SKILL: SkillDefinition = {
    name: 'sys_run_sql',
    description: '执行DuckDB SQL查询（支持SELECT、UPDATE、CREATE等）',
    parameters: {
        sql: {
            type: 'string',
            description: 'SQL查询语句',
            required: true
        },
        permission: {
            type: 'string',
            description: '权限级别: READ_ONLY（仅SELECT） | CLEANING（数据清洗） | FULL（完全权限）',
            required: false
        },
        resultLimit: {
            type: 'number',
            description: '结果集大小限制（仅READ_ONLY），默认10000',
            required: false
        }
    }
};

/**
 * sys_run_sql Skill执行函数（简化版本）
 * 实际实现由Dispatcher统一路由
 */
export async function sysRunSQL(args: {
    sql: string;
    permission?: string;
    resultLimit?: number;
}): Promise<SkillExecutionResult> {
    // 简化实现：直接返回Mock结果
    // 实际执行逻辑在Dispatcher中通过DuckDBEngine调用
    return {
        success: false,
        error: 'sys_run_sql需要通过Dispatcher执行',
        metadata: { sql: args.sql }
    };
}
