/**
 * 统一导出所有类型定义
 */

export * from './project';
export * from './hypothesis';
export * from './theme';
export * from './data';

// 手动导出 prompt 中的类型，避免 ColumnStats 冲突
export type {
    UserPrompt,
    PromptLayer,
    DimensionKey,
    PromptTag,
    PromptFilter,
    IPromptRegistry,
    StatsInjectionConfig,
    StatsExtractor
    // ColumnStats 已从 data.ts 导出，不再从 prompt.ts 导出
} from './prompt';
