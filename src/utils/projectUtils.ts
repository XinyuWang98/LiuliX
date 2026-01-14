import { ParsedFileData } from './fileParser';

/**
 * 生成唯一 ID
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 查找字符串数组的共同前缀
 */
export function findCommonPrefix(strings: string[]): string {
    if (strings.length === 0) return '';
    if (strings.length === 1) return strings[0].split('.')[0];

    let prefix = strings[0].split('.')[0];
    for (let i = 1; i < strings.length; i++) {
        const current = strings[i].split('.')[0];
        while (prefix && !current.startsWith(prefix)) {
            prefix = prefix.slice(0, -1);
        }
    }

    // 移除尾部的数字和特殊字符
    return prefix.replace(/[_-]\d+$/, '').replace(/[_-]$/, '');
}

/**
 * 检测文件主题
 */
export function detectTheme(fileNames: string[]): string | null {
    const keywords: Record<string, string[]> = {
        game: ['player', 'result', 'pick', 'match', 'score', 'team', 'game'],
        sales: ['sale', 'order', 'customer', 'product', 'revenue', 'invoice'],
        finance: ['transaction', 'account', 'balance', 'payment', 'expense'],
        analytics: ['metric', 'stat', 'analysis', 'report', 'dashboard'],
        user: ['user', 'profile', 'account', 'member', 'subscriber'],
    };

    for (const [theme, words] of Object.entries(keywords)) {
        const matchCount = fileNames.filter(name =>
            words.some(word => name.toLowerCase().includes(word))
        ).length;

        // 如果超过一半的文件匹配主题,则使用该主题
        if (matchCount >= Math.ceil(fileNames.length / 2)) {
            return theme;
        }
    }

    return null;
}

/**
 * 首字母大写
 */
function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * 生成项目名称(国际化)
 */
export interface ProjectTranslations {
    suffix: string;
    dataProject: string;
    untitled: string;
    defaultData: string;
    themes: Record<string, string>;
}

/**
 * 生成项目名称(国际化)
 */
export function generateProjectName(
    files: ParsedFileData[],
    translations: ProjectTranslations
): string {
    if (files.length === 0) {
        return translations.untitled;
    }

    const fileNames = files.map(f => f.fileName);

    // 策略1: 提取共同前缀
    const commonPrefix = findCommonPrefix(fileNames);
    if (commonPrefix && commonPrefix.length > 3) {
        const cleanName = commonPrefix.replace(/[_-]/g, ' ').trim();
        return capitalize(cleanName) + ' ' + translations.suffix;
    }

    // 策略2: 基于关键词识别主题(国际化)
    const themeKey = detectTheme(fileNames);
    if (themeKey) {
        const themeName = translations.themes[themeKey] || translations.defaultData;
        return `${themeName} ${translations.dataProject}`;
    }

    // 策略3: 使用时间戳
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();
    return `${translations.suffix} ${dateStr} ${timeStr}`;
}

/**
 * 项目文件接口
 */
export interface ProjectFile {
    id: string;
    name: string;
    data: ParsedFileData;
    sampled: boolean;
    addedAt: Date;

    // 添加为ContentPanel提供快捷属性
    columns?: Array<{ name: string; type?: string }>;
    rowCount?: number;
    tableName?: string;
    originalName?: string;

    /** 预处理分析缓存 */
    analysisCache?: {
        /** 数据质量评分 */
        quality?: {
            score: number;
            issues: Array<{
                type: string;
                severity: 'low' | 'medium' | 'high';
                message: string;
                affectedColumns?: string[];
            }>;
            lastUpdated: number;
        };
        /** 清洗建议（增强版） */
        cleaning?: {
            suggestions: import('../components/cleaning/types/cleaning.types').SimpleSuggestion[];
            status: 'pending' | 'ready' | 'failed';
            /** 是否已过期（需重新生成） */
            isStale?: boolean;
            /** 后台生成的时间戳 */
            generatedAt?: number;
            /** 🆕 缓存生成时间戳（队列优化） */
            timestamp?: number;
            /** 采样元数据 */
            basedOnSample?: {
                isSampled: boolean;
                sampleSize: number;
                totalSize: number;
            };
        };
        /** 洞察假设 */
        insight?: {
            hypotheses: Array<any>;
            status: 'pending' | 'ready' | 'failed';
            isStale?: boolean;
            /** 🆕 缓存生成时间戳（队列优化） */
            timestamp?: number;

            // 🆕 新增字段
            prefetchedSuggestions?: Array<{
                title: string;
                description: string;
                code: string;
                result?: any
            }>;
            generatedAt?: number;

            basedOnSample?: {
                isSampled: boolean;
                sampleSize: number;
                totalSize: number;
            };
        };
        /** 🆕 Prompt预处理缓存（队列优化） */
        promptCache?: {
            /** 洞察Prompt缓存 */
            insight?: string;
            /** 洞察Prompt缓存时间戳 */
            insightTimestamp?: number;
            /** 清洗Prompt缓存 */
            cleaning?: string;
            /** 清洗Prompt缓存时间戳 */
            cleaningTimestamp?: number;
        };
    };
}

/**
 * 项目接口
 */
export interface Project {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt?: Date;  // 最后更新时间（可选，默认使用 createdAt）
    files: ProjectFile[];
    isExpanded: boolean;
}

/**
 * 创建项目(国际化)
 */
export function createProject(
    files: ParsedFileData[],
    sampledFlags: boolean[],
    translations: ProjectTranslations
): Project {
    return {
        id: generateId(),
        name: generateProjectName(files, translations),
        createdAt: new Date(),
        isExpanded: true,  // 新创建的项目默认展开
        files: files.map((data, index) => ({
            id: generateId(),
            name: data.fileName, // 从 ParsedFileData 获取文件名
            data,
            sampled: sampledFlags[index],
            addedAt: new Date(),
        })),
    };
}
