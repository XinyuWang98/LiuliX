/**
 * workerCleanTypecast Prompt - Language Router
 */

import { getCurrentLanguage } from '@/contexts/I18nContext';
import type { UserPrompt } from '@/types/prompt';
import * as promptEn from './worker_clean_typecast.en';
import * as promptZh from './worker_clean_typecast.zh';

const promptModules = {
    'en-US': promptEn,
    'zh-CN': promptZh
} as const;

function getworkerCleanTypecastPrompt(): UserPrompt {
    const lang = getCurrentLanguage();
    return promptModules[lang].workerCleanTypecastPrompt;
}

export const workerCleanTypecastPrompt: UserPrompt = new Proxy({} as UserPrompt, {
    get(_, prop) {
        const prompt = getworkerCleanTypecastPrompt();
        return prompt[prop as keyof UserPrompt];
    }
});
