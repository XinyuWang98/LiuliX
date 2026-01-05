/**
 * Worker Trend Prompt - 语言路由加载器
 */

import { getCurrentLanguage } from '@/contexts/I18nContext';
import type { UserPrompt } from '@/types/prompt';
import * as promptEn from './worker_trend.en';
import * as promptZh from './worker_trend.zh';

const promptModules = {
    'en-US': promptEn,
    'zh-CN': promptZh
} as const;

function getWorkerTrendPrompt(): UserPrompt {
    const lang = getCurrentLanguage();
    return promptModules[lang].workerTrendPrompt;
}

export const workerTrendPrompt: UserPrompt = new Proxy({} as UserPrompt, {
    get(_, prop) {
        const prompt = getWorkerTrendPrompt();
        return prompt[prop as keyof UserPrompt];
    }
});
