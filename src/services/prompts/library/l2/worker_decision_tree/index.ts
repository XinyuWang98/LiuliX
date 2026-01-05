/**
 * workerDecisionTree Prompt - Language Router
 */

import { getCurrentLanguage } from '@/contexts/I18nContext';
import type { UserPrompt } from '@/types/prompt';
import * as promptEn from './worker_decision_tree.en';
import * as promptZh from './worker_decision_tree.zh';

const promptModules = {
    'en-US': promptEn,
    'zh-CN': promptZh
} as const;

function getworkerDecisionTreePrompt(): UserPrompt {
    const lang = getCurrentLanguage();
    return promptModules[lang].workerDecisionTreePrompt;
}

export const workerDecisionTreePrompt: UserPrompt = new Proxy({} as UserPrompt, {
    get(_, prop) {
        const prompt = getworkerDecisionTreePrompt();
        return prompt[prop as keyof UserPrompt];
    }
});
