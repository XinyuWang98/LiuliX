/**
 * Worker Outlier Prompt - 语言路由加载器
 */

import { getCurrentLanguage } from '@/contexts/I18nContext';
import type { UserPrompt } from '@/types/prompt';
import * as promptEn from './worker_outlier.en';
import * as promptZh from './worker_outlier.zh';

const promptModules = {
    'en-US': promptEn,
    'zh-CN': promptZh
} as const;

function getWorkerOutlierPrompt(): UserPrompt {
    const lang = getCurrentLanguage();
    return promptModules[lang].workerOutlierPrompt;
}

export const workerOutlierPrompt: UserPrompt = new Proxy({} as UserPrompt, {
    get(_, prop) {
        const prompt = getWorkerOutlierPrompt();
        return prompt[prop as keyof UserPrompt];
    }
});
