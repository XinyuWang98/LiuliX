/**
 * workerDbscan Prompt - Language Router
 */

import { getCurrentLanguage } from '@/contexts/I18nContext';
import type { UserPrompt } from '@/types/prompt';
import * as promptEn from './worker_dbscan.en';
import * as promptZh from './worker_dbscan.zh';

const promptModules = {
    'en-US': promptEn,
    'zh-CN': promptZh
} as const;

function getworkerDbscanPrompt(): UserPrompt {
    const lang = getCurrentLanguage();
    return promptModules[lang].workerDbscanPrompt;
}

export const workerDbscanPrompt: UserPrompt = new Proxy({} as UserPrompt, {
    get(_, prop) {
        const prompt = getworkerDbscanPrompt();
        return prompt[prop as keyof UserPrompt];
    }
});
