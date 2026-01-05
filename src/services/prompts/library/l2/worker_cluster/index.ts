/**
 * workerCluster Prompt - Language Router
 */

import { getCurrentLanguage } from '@/contexts/I18nContext';
import type { UserPrompt } from '@/types/prompt';
import * as promptEn from './worker_cluster.en';
import * as promptZh from './worker_cluster.zh';

const promptModules = {
    'en-US': promptEn,
    'zh-CN': promptZh
} as const;

function getworkerClusterPrompt(): UserPrompt {
    const lang = getCurrentLanguage();
    return promptModules[lang].workerClusterPrompt;
}

export const workerClusterPrompt: UserPrompt = new Proxy({} as UserPrompt, {
    get(_, prop) {
        const prompt = getworkerClusterPrompt();
        return prompt[prop as keyof UserPrompt];
    }
});
