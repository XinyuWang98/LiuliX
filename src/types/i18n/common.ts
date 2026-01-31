/**
 * 通用模块类型定义
 * 包含: common, data, nav, footer, header, inviteCode, sidebar, chat, analysis, progress, language
 */

export interface CommonTranslations {
    // 通用
    common: {
        loading: string;
        initializing: string;
        error: string;
        success: string;
        cancel: string;
        confirm: string;
        delete: string;
        edit: string;
        save: string;
        yes: string;
        no: string;
        search: string;
        all: string;
        featureInDev: string;
        collapse: string;
        verifying?: string;
        pageTitle: string;
        column: string;
        type: string;
        table: string;
        totalRows: string;
        totalColumns: string;
        none: string;
        rename: string;
        avgLength: string;
        format: string;
        range: string;
        median: string;
        sample: string;
        sensitive: string;
        high: string;
        medium: string;
        low: string;
        noData: string;
        expand: string;
    };

    // 数据统计
    data: {
        unique: string;
        missing: string;
        min: string;
        max: string;
        mean: string;
        rows: string;
        columns: string;
    };

    // 导航栏
    nav: {
        appName: string;
        noProject: string;
        dashboard: string;
        promptLibrary: string;
        settings: string;
        user: string;
        theme: string;
        whitepaper: string;
        help?: string;
        docs?: string;
    };

    footer: {
        resources: string;
        community: string;
    };

    // Header
    header: {
        inviteCodeTrial: string;
        freeTrial: string;
    };

    // Invite Code
    inviteCode: {
        title: string;
        hint: string;
        placeholder: string;
        activate: string;
        emptyError: string;
        invalidError: string;
        networkError: string;
    };

    // 侧边栏
    sidebar: {
        collapse: string;
    };

    // 聊天/交互
    chat: {
        askAIPlaceholder: string;
    };

    // 分析状态
    analysis: {
        readyHint: string;
        waitingForData: string;
        initializing: string;
    };

    progress: {
        generatingPrompt: string;
        sendingRequest: string;
        analyzingResponse: string;
        validating: string;
        generatingInsight: string;
        generatingHypothesis: string;
    };

    language: {
        title: string;
        priority: string;
        zh: string;
        en: string;
    };

    // 工作台侧边栏
    workbench: {
        projectSelection: string;
        cleaning: string;
        insights: string;
        report: string;
        promptLibrary: string;
        toggleSidebar: string;
        backToWelcome: string;
        localModel: string;
        apiModel: string;
        collapsed: {
            tooltip: string;
        };
        external: {
            hint: string;
        };
    };
}
