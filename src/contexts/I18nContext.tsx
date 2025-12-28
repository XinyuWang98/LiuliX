import { useState, createContext, useContext, ReactNode } from 'react';
import { LanguageConfig } from '../types/i18n';
import { zhCN } from '../locales/zh-CN';
import { enUS } from '../locales/en-US';

// 可用语言列表
const AVAILABLE_LANGUAGES: LanguageConfig[] = [zhCN, enUS];

// 默认语言
const DEFAULT_LANGUAGE = 'zh-CN';

// localStorage 键名
const LANGUAGE_STORAGE_KEY = 'dataprism_language';

// i18n 上下文类型
interface I18nContextType {
    language: LanguageConfig;
    availableLanguages: LanguageConfig[];
    setLanguage: (code: string) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
    formatDate: (date: number | string | Date) => string;
}

// 创建上下文
const I18nContext = createContext<I18nContextType | null>(null);

/**
 * 获取嵌套对象的值
 * @param obj 对象
 * @param path 路径,如 'welcome.title'
 */
function getNestedValue(obj: any, path: string): string {
    return path.split('.').reduce((current, key) => current?.[key], obj) || path;
}

/**
 * 替换字符串中的变量
 * @param str 字符串模板
 * @param params 参数对象
 */
function interpolate(str: string, params?: Record<string, string | number>): string {
    if (!params) return str;

    return Object.entries(params).reduce((result, [key, value]) => {
        return result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }, str);
}

/**
 * i18n Provider 组件
 */
export function I18nProvider({ children }: { children: ReactNode }) {
    // 从 localStorage 读取保存的语言,如果没有则使用默认语言
    const [currentLanguageCode, setCurrentLanguageCode] = useState<string>(() => {
        const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
        return savedLanguage || DEFAULT_LANGUAGE;
    });

    // 根据语言代码查找语言对象
    const currentLanguage = AVAILABLE_LANGUAGES.find(l => l.code === currentLanguageCode) || AVAILABLE_LANGUAGES[0];

    // 切换语言函数
    const setLanguage = (code: string) => {
        const language = AVAILABLE_LANGUAGES.find(l => l.code === code);
        if (language) {
            setCurrentLanguageCode(code);
            // 持久化到 localStorage
            localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
        }
    };

    // 翻译函数
    const t = (key: string, params?: Record<string, string | number>): string => {
        // First try to find the key in the current language
        const keys = key.split('.');
        let value: any = currentLanguage.translations;

        for (const k of keys) {
            value = value?.[k];
        }

        // If not found, try fallback language (zh-CN)
        if (value === undefined && currentLanguage.code !== 'zh-CN') {
            const fallbackLanguage = AVAILABLE_LANGUAGES.find(l => l.code === 'zh-CN');
            if (fallbackLanguage) {
                let fallbackValue: any = fallbackLanguage.translations;
                for (const k of keys) {
                    fallbackValue = fallbackValue?.[k];
                }
                value = fallbackValue;
            }
        }

        if (value === undefined) {
            console.warn(`Translation key not found: ${key}`);
            return key;
        }

        if (typeof value !== 'string') {
            return key;
        }

        if (params) {
            // ✅ 修复：使用单花括号 {key} 格式，与翻译文件一致
            return Object.entries(params).reduce((acc, [k, v]) => {
                return acc.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
            }, value);
        }

        return value;
    };

    const formatDate = (date: number | string | Date): string => {
        try {
            return new Date(date).toLocaleDateString(currentLanguage.code, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return String(date);
        }
    };

    // Update global T for non-react usage
    globalT = t;

    const value: I18nContextType = {
        language: currentLanguage,
        availableLanguages: AVAILABLE_LANGUAGES,
        setLanguage,
        t,
        formatDate,
    };

    return (
        <I18nContext.Provider value={value}>
            {children}
        </I18nContext.Provider>
    );
}

/**
 * Global translation helper for non-React files
 */
export let globalT: (key: string, params?: Record<string, string | number>) => string = (key) => key;

/**
 * 使用 i18n 的 Hook
 */
export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
}
