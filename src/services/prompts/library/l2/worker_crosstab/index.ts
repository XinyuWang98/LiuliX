/**
 * workerCrosstab Prompt - Language Router
 */

import { getCurrentLanguage } from '@/contexts/I18nContext';
import type { UserPrompt } from '@/types/prompt';
import * as promptEn from './worker_crosstab.en';
import * as promptZh from './worker_crosstab.zh';

const promptModules = {
    'en-US': promptEn,
    'zh-CN': promptZh
} as const;

function getworkerCrosstabPrompt(): UserPrompt {
    const lang = getCurrentLanguage();
    return promptModules[lang].workerCrosstabPrompt;
}

export const workerCrosstabPrompt: UserPrompt = new Proxy({} as UserPrompt, {
    get(_, prop) {
        const prompt = getworkerCrosstabPrompt();
        return prompt[prop as keyof UserPrompt];
    }
});
