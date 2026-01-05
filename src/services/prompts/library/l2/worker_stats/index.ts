/**
 * Worker Stats Prompt - 语言路由加载器
 */

import { getCurrentLanguage } from '@/contexts/I18nContext';
import type { UserPrompt } from '@/types/prompt';
import * as promptEn from './worker_stats.en';
import * as promptZh from './worker_stats.zh';

// 预加载所有语言版本
const promptModules = {
    'en-US': promptEn,
    'zh-CN': promptZh
} as const;

/**
 * 获取 Worker Stats Prompt
 * 自动根据当前语言选择对应版本
 */
function getWorkerStatsPrompt(): UserPrompt {
    const lang = getCurrentLanguage();
    return promptModules[lang].workerStatsPrompt;
}

// 使用 getter 确保每次访问都获取最新语言版本
export const workerStatsPrompt: UserPrompt = new Proxy({} as UserPrompt, {
    get(_, prop) {
        const prompt = getWorkerStatsPrompt();
        return prompt[prop as keyof UserPrompt];
    }
});
