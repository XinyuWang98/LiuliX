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
export function generateProjectName(
    files: ParsedFileData[],
    languageCode: 'zh-CN' | 'en-US',
    themeTranslations: Record<string, string>
): string {
    if (files.length === 0) {
        return languageCode === 'zh-CN' ? '未命名项目' : 'Untitled Project';
    }

    const fileNames = files.map(f => f.fileName);

    // 策略1: 提取共同前缀
    const commonPrefix = findCommonPrefix(fileNames);
    if (commonPrefix && commonPrefix.length > 3) {
        const cleanName = commonPrefix.replace(/[_-]/g, ' ').trim();
        const suffix = languageCode === 'zh-CN' ? '项目' : 'Project';
        return capitalize(cleanName) + ' ' + suffix;
    }

    // 策略2: 基于关键词识别主题(国际化)
    const themeKey = detectTheme(fileNames);
    if (themeKey) {
        const themeName = themeTranslations[themeKey] || (languageCode === 'zh-CN' ? '数据' : 'Data');
        const suffix = languageCode === 'zh-CN' ? '数据项目' : 'Data Project';
        return `${themeName}${suffix}`;
    }

    // 策略3: 使用时间戳
    const now = new Date();
    const dateStr = now.toLocaleDateString(languageCode, { month: '2-digit', day: '2-digit' });
    const timeStr = now.toLocaleTimeString(languageCode, { hour: '2-digit', minute: '2-digit', hour12: false });
    const prefix = languageCode === 'zh-CN' ? '项目' : 'Project';
    return `${prefix} ${dateStr} ${timeStr}`;
}

/**
 * 项目文件接口
 */
export interface ProjectFile {
    id: string;
    data: ParsedFileData;
    sampled: boolean;
    addedAt: Date;
}

/**
 * 项目接口
 */
export interface Project {
    id: string;
    name: string;
    createdAt: Date;
    files: ProjectFile[];
    isExpanded: boolean;
}

/**
 * 创建项目(国际化)
 */
export function createProject(
    files: ParsedFileData[],
    sampledFlags: boolean[],
    languageCode: 'zh-CN' | 'en-US',
    themeTranslations: Record<string, string>
): Project {
    return {
        id: generateId(),
        name: generateProjectName(files, languageCode, themeTranslations),
        createdAt: new Date(),
        isExpanded: true,  // 新创建的项目默认展开
        files: files.map((data, index) => ({
            id: generateId(),
            data,
            sampled: sampledFlags[index],
            addedAt: new Date(),
        })),
    };
}
