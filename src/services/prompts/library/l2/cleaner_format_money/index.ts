import { UserPrompt } from '@/types/prompt';
import { getCurrentLanguage } from '@/contexts/I18nContext';
import { cleanerFormatMoneyPrompt as enPrompt } from './cleaner_format_money.en';
import { cleanerFormatMoneyPrompt as zhPrompt } from './cleaner_format_money.zh';

// 动态通过 Proxy 获取当前语言的 Prompt
export const cleanerFormatMoneyPrompt: UserPrompt = new Proxy({} as UserPrompt, {
    get(_, prop) {
        const lang = getCurrentLanguage();
        // 默认使用中文，如果是 en-US 则使用英文
        // (策略可调整，这里为了兼容现有逻辑)
        const target = lang === 'en-US' ? enPrompt : zhPrompt;
        return target[prop as keyof UserPrompt];
    }
});