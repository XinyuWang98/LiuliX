/**
 * Worker Group By Prompt - 语言路由加载器
 */

import { getCurrentLanguage } from '@/contexts/I18nContext';
import type { UserPrompt } from '@/types/prompt';
import * as promptEn from './worker_groupby.en';
import * as promptZh from './worker_groupby.zh';

const promptModules = {
    'en-US': promptEn,
    'zh-CN': promptZh
} as const;

function getWorkerGroupbyPrompt(): UserPrompt {
    const lang = getCurrentLanguage();
    return promptModules[lang].workerGroupbyPrompt;
}

export const workerGroupbyPrompt: UserPrompt = new Proxy({} as UserPrompt, {
    get(_, prop) {
        const prompt = getWorkerGroupbyPrompt();
        return prompt[prop as keyof UserPrompt];
    }
});
