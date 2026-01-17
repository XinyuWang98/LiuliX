import { useState, useEffect } from 'react';
import { logCapture } from '@/utils/logCapture';
import { logger } from '@/utils/logger';

/**
 * Developer Mode 状态管理 Hook
 * 职责：管理开发者模式开关，联动日志捕获功能
 */
export function useDeveloperMode() {
    const [isDeveloperMode, setIsDeveloperMode] = useState(() => {
        try {
            return localStorage.getItem('liulix_developer_mode') === 'true';
        } catch {
            return false;
        }
    });

    // 初始化：如果已开启，启动日志捕获
    useEffect(() => {
        if (isDeveloperMode) {
            logCapture.start();
            logger.enableCapture();
        } else {
            logCapture.stop();
            logger.disableCapture();
        }
    }, [isDeveloperMode]);

    const toggleDeveloperMode = (enabled: boolean) => {
        setIsDeveloperMode(enabled);

        // 持久化到 localStorage
        try {
            localStorage.setItem('liulix_developer_mode', String(enabled));
        } catch (e) {
            console.error('Failed to save developer mode state', e);
        }

        // 联动日志捕获
        logger.log('用户设置', 'Toggling developer mode', { data: { enabled } });
        if (enabled) {
            logCapture.start();
            logger.enableCapture();
        } else {
            logCapture.stop();
            logger.disableCapture();
        }
    };

    return {
        isDeveloperMode,
        toggleDeveloperMode
    };
}
