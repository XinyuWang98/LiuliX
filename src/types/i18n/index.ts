/**
 * i18n 类型定义主入口
 * 重新导出所有子模块类型并组合为 LanguageConfig
 */

import { CommonTranslations } from './common';
import { SettingsTranslations } from './settings';
import { PromptTranslations } from './prompt';
import { DataSourceTranslations } from './dataSource';
import { FileUploadTranslations } from './fileUpload';
import { CleaningTranslations } from './cleaning';
import { WorkshopTranslations } from './workshop';
import { ReportTranslations } from './report';
import { WelcomeTranslations } from './welcome';
import { WhitepaperTranslations } from './whitepaper';
import { HardwareTranslations } from './hardware';

/**
 * 语言配置类型
 * 组合所有模块的翻译类型接口
 */
export interface LanguageConfig {
    code: 'zh-CN' | 'en-US';
    name: string;
    translations: CommonTranslations
    & SettingsTranslations
    & PromptTranslations
    & DataSourceTranslations
    & FileUploadTranslations
    & CleaningTranslations
    & WorkshopTranslations
    & ReportTranslations
    & WelcomeTranslations
    & WhitepaperTranslations
    & HardwareTranslations;
}

// 重新导出所有子类型
export * from './common';
export * from './settings';
export * from './prompt';
export * from './dataSource';
export * from './fileUpload';
export * from './cleaning';
export * from './workshop';
export * from './report';
export * from './welcome';
export * from './whitepaper';
export * from './hardware';
