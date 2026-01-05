/**
 * Worker Correlation Prompt - 语言路由加载器
 */

import { getCurrentLanguage } from '@/contexts/I18nContext';
import type { UserPrompt } from '@/types/prompt';
import * as promptEn from './worker_correlation.en';
import * as promptZh from './worker_correlation.zh';

const promptModules = {
    'en-US': promptEn,
    'zh-CN': promptZh
} as const;

function getWorkerCorrelationPrompt(): UserPrompt {
    const lang = getCurrentLanguage();
    return promptModules[lang].workerCorrelationPrompt;
}

export const workerCorrelationPrompt: UserPrompt = new Proxy({} as UserPrompt, {
    get(_, prop) {
        const prompt = getWorkerCorrelationPrompt();
        return prompt[prop as keyof UserPrompt];
    }
});
