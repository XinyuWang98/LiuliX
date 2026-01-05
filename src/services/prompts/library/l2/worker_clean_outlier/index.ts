/**
 * workerCleanOutlier Prompt - Language Router
 */

import { getCurrentLanguage } from '@/contexts/I18nContext';
import type { UserPrompt } from '@/types/prompt';
import * as promptEn from './worker_clean_outlier.en';
import * as promptZh from './worker_clean_outlier.zh';

const promptModules = {
    'en-US': promptEn,
    'zh-CN': promptZh
} as const;

function getworkerCleanOutlierPrompt(): UserPrompt {
    const lang = getCurrentLanguage();
    return promptModules[lang].workerCleanOutlierPrompt;
}

export const workerCleanOutlierPrompt: UserPrompt = new Proxy({} as UserPrompt, {
    get(_, prop) {
        const prompt = getworkerCleanOutlierPrompt();
        return prompt[prop as keyof UserPrompt];
    }
});
