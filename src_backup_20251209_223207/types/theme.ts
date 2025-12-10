/**
 * 配色方案结构
 * 定义一套完整的 UI 配色方案
 */
export interface ThemeSchema {
    /** 唯一标识符,如 'neufuture' */
    id: string;

    /** 配色方案的中文标题 (界面展示) */
    title: string;

    /** 是否为深色主题 */
    is_dark: boolean;

    /** CSS 变量映射 */
    colors: {
        /** 主背景色 */
        '--bg-main': string;
        /** 面板色,深蓝灰 */
        '--bg-panel': string;
        /** 高亮/按钮主色 */
        '--bg-accent': string;
        /** 主文字颜色 */
        '--text-primary': string;
        /** 副文字颜色 */
        '--text-secondary': string;
        /** 警告色 */
        '--warning': string;
        /** 悬浮背景 */
        '--hover-bg': string;
        /** 边框线 */
        '--border': string;
        /** 新拟态 - 浅阴影色 */
        '--shadow-light': string;
        /** 新拟态 - 深阴影色 */
        '--shadow-dark': string;

        // 可按需添加其他颜色变量
        [key: string]: string;
    };
}
