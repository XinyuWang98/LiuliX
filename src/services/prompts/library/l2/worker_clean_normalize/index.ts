/**
 * workerCleanNormalize Prompt - Language Router
 */

import { getCurrentLanguage } from '@/contexts/I18nContext';
import type { UserPrompt } from '@/types/prompt';
import * as promptEn from './worker_clean_normalize.en';
import * as promptZh from './worker_clean_normalize.zh';

const promptModules = {
    'en-US': promptEn,
    'zh-CN': promptZh
} as const;

function getworkerCleanNormalizePrompt(): UserPrompt {
    const lang = getCurrentLanguage();
    return promptModules[lang].workerCleanNormalizePrompt;
}

export const workerCleanNormalizePrompt: UserPrompt = new Proxy({} as UserPrompt, {
    get(_, prop) {
        const prompt = getworkerCleanNormalizePrompt();
        return prompt[prop as keyof UserPrompt];
    }
});
