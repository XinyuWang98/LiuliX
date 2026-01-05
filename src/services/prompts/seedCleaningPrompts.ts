/**
 * 清洗Prompt种子数据
 * 
 * [MIGRATED] 已迁移至 src/services/prompts/library/l2/cleaner_*
 * 此文件保留作为存根，防止编译错误，但不再包含实际数据。
 */
import { UserPrompt } from '@/types/prompt';

export const SEED_CLEANING_PROMPTS: UserPrompt[] = [];

/**
 * 注册清洗Prompt到全局注册表
 */
export function registerCleaningPrompts(_registry: any): void {
    // 这里的注册现已通过 src/services/prompts/index.ts 统一处理
    // registry.registerBatch(SEED_CLEANING_PROMPTS);
}
