/**
 * workerTimeDecomposition Prompt - Language Router
 */

import { getCurrentLanguage } from '@/contexts/I18nContext';
import type { UserPrompt } from '@/types/prompt';
import * as promptEn from './worker_time_decomposition.en';
import * as promptZh from './worker_time_decomposition.zh';

const promptModules = {
    'en-US': promptEn,
    'zh-CN': promptZh
} as const;

function getworkerTimeDecompositionPrompt(): UserPrompt {
    const lang = getCurrentLanguage();
    return promptModules[lang].workerTimeDecompositionPrompt;
}

export const workerTimeDecompositionPrompt: UserPrompt = new Proxy({} as UserPrompt, {
    get(_, prop) {
        const prompt = getworkerTimeDecompositionPrompt();
        return prompt[prop as keyof UserPrompt];
    }
});
