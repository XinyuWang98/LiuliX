/**
 * workerGranger Prompt - Language Router
 */

import { getCurrentLanguage } from '@/contexts/I18nContext';
import type { UserPrompt } from '@/types/prompt';
import * as promptEn from './worker_granger.en';
import * as promptZh from './worker_granger.zh';

const promptModules = {
    'en-US': promptEn,
    'zh-CN': promptZh
} as const;

function getworkerGrangerPrompt(): UserPrompt {
    const lang = getCurrentLanguage();
    return promptModules[lang].workerGrangerPrompt;
}

export const workerGrangerPrompt: UserPrompt = new Proxy({} as UserPrompt, {
    get(_, prop) {
        const prompt = getworkerGrangerPrompt();
        return prompt[prop as keyof UserPrompt];
    }
});
