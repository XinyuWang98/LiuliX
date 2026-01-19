/**
 * 外部链接统一配置文件
 * 
 * 用途：集中管理所有外部链接，避免硬编码分散在各个组件中
 * 维护：修改链接时只需更新此文件，自动应用到全局
 */

export const EXTERNAL_LINKS = {
    /**
     * Discord 社区链接
     * 
     * 注意：不同渠道应使用不同的追踪链接
     * 详见：docs/05-项目管理/159-管理-Discord渠道追踪记录表.md
     */
    discord: {
        /** App 内跳转专用链接（配额耗尽、日志上传等） */
        appRedirect: 'https://discord.gg/Y7NVzzCUbG',

        /** 官网 Footer/Nav 通用链接 */
        general: 'https://discord.gg/Y7NVzzCUbG',

        /** Reddit 推广专用链接 */
        reddit: 'https://discord.gg/Y7NVzzCUbG',// TODO: 生成专用链接

        /** Product Hunt 发布专用链接（待生成） */
        productHunt: 'https://discord.gg/Y7NVzzCUbG', // TODO: 生成专用链接

        /** 社交媒体（Twitter/X）专用链接（待生成） */
        social: 'https://discord.gg/Y7NVzzCUbG', // TODO: 生成专用链接

        /** GitHub README 专用链接 (Role: Code Explorer) */
        github: 'https://discord.gg/Pr5nS9K7NT',
    },

    /**
     * GitHub 仓库链接（暂时隐藏，内测阶段）
     */
    github: {
        repo: 'https://github.com/LiuliX-Dev/LiuliX',
        issues: 'https://github.com/LiuliX-Dev/LiuliX/issues',
    },

    /**
     * 社交媒体链接
     */
    social: {
        twitter: '#', // 暂未开通
        linkedin: '#', // 暂未开通
    },

    /**
     * 白皮书与文档
     */
    docs: {
        whitepaper: '/whitepaper',
        apiKeyGuide: '/whitepaper/api-key-guide',
    },
} as const;

/**
 * 类型定义（供 TypeScript 自动补全使用）
 */
export type ExternalLinks = typeof EXTERNAL_LINKS;
