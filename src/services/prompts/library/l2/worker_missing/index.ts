/**
 * workerMissing Prompt - Language Router
 */

import { getCurrentLanguage } from '@/contexts/I18nContext';
import type { UserPrompt } from '@/types/prompt';
import * as promptEn from './worker_missing.en';
import * as promptZh from './worker_missing.zh';

const promptModules = {
    'en-US': promptEn,
    'zh-CN': promptZh
} as const;

function getworkerMissingPrompt(): UserPrompt {
    const lang = getCurrentLanguage();
    return promptModules[lang].workerMissingPrompt;
}

export const workerMissingPrompt: UserPrompt = new Proxy({} as UserPrompt, {
    get(_, prop) {
        const prompt = getworkerMissingPrompt();
        return prompt[prop as keyof UserPrompt];
    }
});
