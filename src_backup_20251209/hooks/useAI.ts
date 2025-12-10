// src/hooks/useAI.ts
import { useState, useCallback } from 'react';
import { askAI } from '../services/aiService';
import { useI18n } from '../contexts/I18nContext';

export interface AIResponse {
    content: string;
    model: 'gemini' | 'grok' | 'claude' | 'deepseek';
}

export const useAI = () => {
    const { t } = useI18n();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastResponse, setLastResponse] = useState<AIResponse | null>(null);

    const ask = useCallback(async (prompt: string, modelHint?: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await askAI(prompt, {
                modelHint: modelHint as any,
                t: t
            });
            setLastResponse(res);
            setLoading(false);
            return res;
        } catch (err: any) {
            const msg = err.message || t('settings.errorAllFailed');
            setError(msg);
            setLoading(false);
            throw err;
        }
    }, [t]);

    const clear = useCallback(() => {
        setError(null);
        setLastResponse(null);
    }, []);

    return {
        ask,
        clear,
        loading,
        error,
        lastResponse
    };
};