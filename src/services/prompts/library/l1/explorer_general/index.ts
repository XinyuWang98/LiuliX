import { UserPrompt } from '@/types/prompt';
import { getCurrentLanguage } from '@/contexts/I18nContext';
import { explorerGeneralPrompt as enPrompt } from './explorer_general.en';
import { explorerGeneralPrompt as zhPrompt } from './explorer_general.zh';

// 动态通过 Proxy 获取当前语言的 Prompt
export const explorerGeneralPrompt: UserPrompt = new Proxy({} as UserPrompt, {
    get(_, prop) {
        const lang = getCurrentLanguage();
        // 默认使用中文，如果是 en-US 则使用英文
        const target = lang === 'en-US' ? enPrompt : zhPrompt;
        return target[prop as keyof UserPrompt];
    }
});
