import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import './AILoading.css';

interface AILoadingProps {
    visible: boolean;
    message?: string; // Optional real-time message from backend
}

export const AILoading: React.FC<AILoadingProps> = ({ visible, message }) => {
    const { t } = useI18n();
    const [progress, setProgress] = useState(0);
    const [localMessageKey, setLocalMessageKey] = useState('cleaning.aiProgressThink');

    useEffect(() => {
        if (!visible) {
            setProgress(0);
            return;
        }

        // 模拟进度条动画 (仅用于视觉效果，不代表真实进度)
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 95) return 95; // 保持在95%直到完成
                // 变加速逻辑：初始快，后期慢
                const increment = prev < 50 ? 5 : prev < 80 ? 2 : 0.5;
                return prev + increment;
            });
        }, 100);

        return () => clearInterval(interval);
    }, [visible]);

    // 根据模拟进度切换默认文案 (仅当没有真实消息时使用)
    useEffect(() => {
        if (message) return; // If real message exists, ignore simulation

        if (progress < 25) setLocalMessageKey('cleaning.aiProgressThink');
        else if (progress < 50) setLocalMessageKey('cleaning.aiProgressAnalyzing');
        else if (progress < 75) setLocalMessageKey('cleaning.aiProgressGenerating');
        else setLocalMessageKey('cleaning.aiProgressValidating');
    }, [progress, message]);

    if (!visible) return null;

    // Use provided message or fall back to local translated message
    const displayMessage = message || t(localMessageKey);

    return (
        <div className="ai-loading-container">
            <Sparkles className="ai-loading-icon" size={32} />
            <div className="ai-loading-text">
                {displayMessage}
            </div>
            <div className="ai-progress-track">
                <div
                    className="ai-progress-bar"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};
