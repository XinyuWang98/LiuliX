import { UserPrompt } from '@/types/prompt';
import { getCurrentLanguage } from '@/contexts/I18nContext';
import { cleanerDeleteNullRowsPrompt as enPrompt } from './cleaner_delete_null_rows.en';
import { cleanerDeleteNullRowsPrompt as zhPrompt } from './cleaner_delete_null_rows.zh';

// 动态通过 Proxy 获取当前语言的 Prompt
export const cleanerDeleteNullRowsPrompt: UserPrompt = new Proxy({} as UserPrompt, {
    get(_, prop) {
        const lang = getCurrentLanguage();
        // 默认使用中文，如果是 en-US 则使用英文
        // (策略可调整，这里为了兼容现有逻辑)
        const target = lang === 'en-US' ? enPrompt : zhPrompt;
        return target[prop as keyof UserPrompt];
    }
});