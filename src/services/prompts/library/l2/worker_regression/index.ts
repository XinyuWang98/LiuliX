/**
 * workerRegression Prompt - Language Router
 */

import { getCurrentLanguage } from '@/contexts/I18nContext';
import type { UserPrompt } from '@/types/prompt';
import * as promptEn from './worker_regression.en';
import * as promptZh from './worker_regression.zh';

const promptModules = {
    'en-US': promptEn,
    'zh-CN': promptZh
} as const;

function getworkerRegressionPrompt(): UserPrompt {
    const lang = getCurrentLanguage();
    return promptModules[lang].workerRegressionPrompt;
}

export const workerRegressionPrompt: UserPrompt = new Proxy({} as UserPrompt, {
    get(_, prop) {
        const prompt = getworkerRegressionPrompt();
        return prompt[prop as keyof UserPrompt];
    }
});
