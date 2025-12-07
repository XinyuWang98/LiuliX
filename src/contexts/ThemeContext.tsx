import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeSchema } from '@/types/theme';

// 导入主题配置
import appleDarkTheme from '@themes/apple-dark.json';
import appleLightTheme from '@themes/apple-light.json';

// 主题上下文类型
interface ThemeContextType {
    currentTheme: ThemeSchema;
    availableThemes: ThemeSchema[];
    setTheme: (themeId: string) => void;
}

// 创建上下文
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 可用主题列表
const AVAILABLE_THEMES: ThemeSchema[] = [
    appleDarkTheme as ThemeSchema,
    appleLightTheme as ThemeSchema,
];

// 默认主题 ID
const DEFAULT_THEME_ID = 'apple-dark';

// localStorage 键名
const THEME_STORAGE_KEY = 'dataprism_theme_id';

/**
 * 应用 CSS 变量到根元素
 */
function applyCSSVariables(theme: ThemeSchema) {
    const root = document.documentElement;

    // 遍历主题的 colors 对象,将每个变量应用到 :root
    Object.entries(theme.colors).forEach(([key, value]) => {
        root.style.setProperty(key, value);
    });
}

/**
 * 主题提供者组件
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
    // 从 localStorage 读取保存的主题 ID,如果没有则使用默认主题
    const [currentThemeId, setCurrentThemeId] = useState<string>(() => {
        const savedThemeId = localStorage.getItem(THEME_STORAGE_KEY);
        return savedThemeId || DEFAULT_THEME_ID;
    });

    // 根据 ID 查找当前主题对象
    const currentTheme = AVAILABLE_THEMES.find(t => t.id === currentThemeId) || AVAILABLE_THEMES[0];

    // 切换主题函数
    const setTheme = (themeId: string) => {
        const theme = AVAILABLE_THEMES.find(t => t.id === themeId);
        if (theme) {
            setCurrentThemeId(themeId);
            // 持久化到 localStorage
            localStorage.setItem(THEME_STORAGE_KEY, themeId);
        }
    };

    // 当主题变化时,应用 CSS 变量
    useEffect(() => {
        applyCSSVariables(currentTheme);
    }, [currentTheme]);

    const value: ThemeContextType = {
        currentTheme,
        availableThemes: AVAILABLE_THEMES,
        setTheme,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

/**
 * 使用主题的 Hook
 */
export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
