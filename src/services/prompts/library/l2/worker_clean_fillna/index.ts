/**
 * workerCleanFillna Prompt - Language Router
 */

import { getCurrentLanguage } from '@/contexts/I18nContext';
import type { UserPrompt } from '@/types/prompt';
import * as promptEn from './worker_clean_fillna.en';
import * as promptZh from './worker_clean_fillna.zh';

const promptModules = {
    'en-US': promptEn,
    'zh-CN': promptZh
} as const;

function getworkerCleanFillnaPrompt(): UserPrompt {
    const lang = getCurrentLanguage();
    return promptModules[lang].workerCleanFillnaPrompt;
}

export const workerCleanFillnaPrompt: UserPrompt = new Proxy({} as UserPrompt, {
    get(_, prop) {
        const prompt = getworkerCleanFillnaPrompt();
        return prompt[prop as keyof UserPrompt];
    }
});
