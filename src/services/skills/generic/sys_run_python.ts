/**
 * sys_run_python 通用Skill（简化版本）
 * 提供接口定义，实际执行由Dispatcher路由
 */

import { SkillDefinition, SkillExecutionResult } from '../definitions';

/**
 * sys_run_python Skill定义
 */
export const SYS_RUN_PYTHON_SKILL: SkillDefinition = {
    name: 'sys_run_python',
    description: '执行Python代码（支持numpy、pandas、scipy等库）',
    parameters: {
        code: {
            type: 'string',
            description: 'Python代码（支持多行）',
            required: true
        },
        timeout: {
            type: 'number',
            description: '超时时间（毫秒），默认30000',
            required: false
        }
    }
};

/**
 * sys_run_python Skill执行函数（简化版本）
 * 实际实现由Dispatcher统一路由
 */
export async function sysRunPython(): Promise<SkillExecutionResult> {
    // 简化实现：直接返回Mock结果
    // 实际执行逻辑在Dispatcher中通过PyodideManager调用
    return {
        success: false,
        error: 'sys_run_python需要通过Dispatcher执行',
        metadata: { python: 'not_implemented' }
    };
}
