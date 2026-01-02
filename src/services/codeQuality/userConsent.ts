/**
 * 用户同意管理器
 * 管理代码质量改进计划的用户参与设置
 */

import { CodeQualitySettings, ParticipationMode } from '@/types/codeQuality';
import { logger } from '@/utils/logger';

export class UserConsentManager {
    private static readonly STORAGE_KEY = 'liulix_code_quality_consent';

    /**
     * 获取当前设置
     */
    static getSettings(): CodeQualitySettings {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored) as CodeQualitySettings;
            }
        } catch (error) {
            logger.error('用户设置', '读取代码质量设置失败', error);
        }

        // 默认：本地模式 + 可显示引导
        return {
            participationMode: 'local',
            canShowOnboarding: true,
            totalContributions: 0,
        };
    }

    /**
     * 保存设置
     */
    private static saveSettings(settings: CodeQualitySettings): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
        } catch (error) {
            logger.error('用户设置', '保存代码质量设置失败', error);
        }
    }

    /**
     * 用户选择参与
     */
    static async optIn(): Promise<void> {
        const settings: CodeQualitySettings = {
            participationMode: 'collaborative',
            lastConsentTime: Date.now(),
            canShowOnboarding: false,
            totalContributions: 0,
        };

        this.saveSettings(settings);

        logger.log('用户操作', '已选择参与代码质量改进计划');

        // 立即拉取最新规则
        // TODO: 在Phase 4实现
        // await RuleSync.pullLatestRules();
    }

    /**
     * 用户选择退出
     */
    static optOut(): void {
        const currentSettings = this.getSettings();

        const settings: CodeQualitySettings = {
            participationMode: 'local',
            canShowOnboarding: false,
            totalContributions: currentSettings.totalContributions || 0,
            // 保留历史贡献统计
        };

        this.saveSettings(settings);

        // 清空已上传的案例标记
        // TODO: 在Phase 2实现
        // FailureCollector.clearUploadedFlags();

        logger.log('用户操作', '已退出代码质量改进计划');
    }

    /**
     * 是否允许上传数据
     */
    static canUpload(): boolean {
        const settings = this.getSettings();
        return settings.participationMode === 'collaborative';
    }

    /**
     * 是否应显示引导
     */
    static shouldShowOnboarding(): boolean {
        const settings = this.getSettings();
        return settings.canShowOnboarding;
    }

    /**
     * 隐藏引导（用户点击"跳过"）
     */
    static dismissOnboarding(): void {
        const settings = this.getSettings();
        settings.canShowOnboarding = false;
        this.saveSettings(settings);

        logger.log('用户操作', '已跳过代码质量改进计划引导');
    }

    /**
     * 增加贡献计数
     */
    static incrementContributions(count: number = 1): void {
        const settings = this.getSettings();
        settings.totalContributions = (settings.totalContributions || 0) + count;
        this.saveSettings(settings);
    }

    /**
     * 更新规则同步时间
     */
    static updateRulesSyncTime(version: string): void {
        const settings = this.getSettings();
        settings.lastRulesSyncTime = Date.now();
        settings.rulesVersion = version;
        this.saveSettings(settings);
    }

    /**
     * 获取参与模式（便捷方法）
     */
    static getParticipationMode(): ParticipationMode {
        return this.getSettings().participationMode;
    }

    /**
     * 获取贡献统计
     */
    static getContributionStats(): {
        totalContributions: number;
        participationDays: number;
        rulesVersion: string | undefined;
    } {
        const settings = this.getSettings();

        let participationDays = 0;
        if (settings.lastConsentTime) {
            const daysSinceConsent = Math.floor(
                (Date.now() - settings.lastConsentTime) / (1000 * 60 * 60 * 24)
            );
            participationDays = daysSinceConsent;
        }

        return {
            totalContributions: settings.totalContributions || 0,
            participationDays,
            rulesVersion: settings.rulesVersion,
        };
    }
}
