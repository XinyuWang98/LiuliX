/**
 * workerCleanDropna Prompt - Language Router
 */

import { getCurrentLanguage } from '@/contexts/I18nContext';
import type { UserPrompt } from '@/types/prompt';
import * as promptEn from './worker_clean_dropna.en';
import * as promptZh from './worker_clean_dropna.zh';

const promptModules = {
    'en-US': promptEn,
    'zh-CN': promptZh
} as const;

function getworkerCleanDropnaPrompt(): UserPrompt {
    const lang = getCurrentLanguage();
    return promptModules[lang].workerCleanDropnaPrompt;
}

export const workerCleanDropnaPrompt: UserPrompt = new Proxy({} as UserPrompt, {
    get(_, prop) {
        const prompt = getworkerCleanDropnaPrompt();
        return prompt[prop as keyof UserPrompt];
    }
});
