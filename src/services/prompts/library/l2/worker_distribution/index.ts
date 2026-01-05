/**
 * Worker Distribution Prompt - 语言路由加载器
 */

import { getCurrentLanguage } from '@/contexts/I18nContext';
import type { UserPrompt } from '@/types/prompt';
import * as promptEn from './worker_distribution.en';
import * as promptZh from './worker_distribution.zh';

const promptModules = {
    'en-US': promptEn,
    'zh-CN': promptZh
} as const;

function getWorkerDistributionPrompt(): UserPrompt {
    const lang = getCurrentLanguage();
    return promptModules[lang].workerDistributionPrompt;
}

export const workerDistributionPrompt: UserPrompt = new Proxy({} as UserPrompt, {
    get(_, prop) {
        const prompt = getWorkerDistributionPrompt();
        return prompt[prop as keyof UserPrompt];
    }
});
