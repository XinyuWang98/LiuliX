/**
 * Worker Top N Prompt - 语言路由加载器
 */

import { getCurrentLanguage } from '@/contexts/I18nContext';
import type { UserPrompt } from '@/types/prompt';
import * as promptEn from './worker_topn.en';
import * as promptZh from './worker_topn.zh';

const promptModules = {
    'en-US': promptEn,
    'zh-CN': promptZh
} as const;

function getWorkerTopnPrompt(): UserPrompt {
    const lang = getCurrentLanguage();
    return promptModules[lang].workerTopnPrompt;
}

export const workerTopnPrompt: UserPrompt = new Proxy({} as UserPrompt, {
    get(_, prop) {
        const prompt = getWorkerTopnPrompt();
        return prompt[prop as keyof UserPrompt];
    }
});
