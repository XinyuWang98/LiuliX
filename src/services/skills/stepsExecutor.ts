/**
 * Skills 多步执行引擎
 * 串行执行多个Tool调用，支持进度回调
 */

import { skillsDispatcher } from './dispatcher';
import { logger } from '@/utils/logger';
import { SkillExecutionResult } from './definitions';

export interface ExecutionStep {
    tool: string;                           // Skill名称
    arguments: Record<string, any>;         // 参数
}

export interface ExecutionContext {
    steps: ExecutionStep[];                 // 所有步骤
    currentIndex: number;                   // 当前执行索引
    results: SkillExecutionResult[];        // 执行结果
    errors: string[];                       // 错误记录
    startTime: number;                      // 开始时间
    endTime?: number;                       // 结束时间
}

export type ProgressCallback = (current: number, total: number) => void;

export class StepsExecutor {
    /**
     * 执行多步骤任务
     * @param steps 步骤列表
     * @param onProgress 进度回调
     * @returns 执行上下文
     */
    async executeSteps(
        steps: ExecutionStep[],
        onProgress?: ProgressCallback
    ): Promise<ExecutionContext> {
        const context: ExecutionContext = {
            steps,
            currentIndex: 0,
            results: [],
            errors: [],
            startTime: Date.now()
        };

        logger.group('Skills', `多步执行开始: ${steps.length}步`);

        for (let i = 0; i < steps.length; i++) {
            context.currentIndex = i;
            const step = steps[i];

            logger.log('Skills', `执行步骤 ${i + 1}/${steps.length}`, {
                data: { tool: step.tool, args: step.arguments }
            });

            // 触发进度回调
            onProgress?.(i + 1, steps.length);

            try {
                const result = await skillsDispatcher.execute(
                    step.tool,
                    step.arguments
                );

                context.results.push(result);

                logger.log('Skills', `步骤 ${i + 1} 完成`, {
                    data: { success: result.success, duration: result.metadata?.duration }
                });

            } catch (error: any) {
                const errorMsg = error.message || String(error);
                context.errors.push(errorMsg);

                logger.error('Skills', `步骤 ${i + 1} 失败`, error);

                // 某步失败则终止后续执行
                throw new Error(`Step ${i + 1} failed: ${errorMsg}`);
            }
        }

        context.endTime = Date.now();
        const totalDuration = context.endTime - context.startTime;

        logger.log('Skills', '多步执行完成', {
            count: totalDuration,  // 耗时毫秒数
            data: { totalSteps: steps.length, successSteps: context.results.length }
        });

        logger.groupEnd();

        return context;
    }
}

// 导出单例
export const stepsExecutor = new StepsExecutor();
