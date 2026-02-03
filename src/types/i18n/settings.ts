/**
 * 设置模块类型定义
 * 包含: settings (完整的设置配置)
 */

export interface SettingsTranslations {
    // 设置
    settings: {
        apiConfig: string;
        aiConfig: string;
        apiProvider: string;
        modelSelection: string;
        currentModel: string;
        freeTierModel: string;
        paidModel: string;
        experimentalModel: string;
        requiresApiKey: string;
        noApiKeyRequired: string;
        rateLimit: string;
        requestsPerMinute: string;
        baseUrl: string;
        baseUrlPlaceholder: string;
        baseUrlHint: string;
        optional: string;
        searchPlaceholder: string;

        // 安全提示
        securityWarning: string;
        securityMessage: string;

        // 按钮
        testConnection: string;
        save: string;
        clear: string;
        saved: string;
        testing: string;

        // 错误消息
        errorTitle: string;
        error404: string;
        error404Solution: string;
        error429: string;
        error429Solution: string;
        errorQuota: string;
        errorQuotaSolution: string;
        errorRateLimit: string;
        errorRateLimitSolution: string;
        errorInvalidChars: string;
        errorInvalidCharsSolution: string;
        errorUnknown: string;
        errorInvalidKey: string;
        errorInvalidKeySolution: string;
        errorNetwork: string;
        errorNetworkSolution: string;

        // DuckDB Errors
        dbNotReady: string;
        opfsFailed: string;
        opfsSuccess: string;
        parseSuccess: string;

        // AI Service Specific Errors
        errorGeminiEmpty: string;
        errorClaudeEmpty: string;
        errorModelEmpty: string;
        errorAllFailed: string;

        viewDocumentation: string;

        // 成功消息
        connectionSuccess: string;
        connectionSuccessPrefix: string;
        autoUpgradeAlert: string;
        configSaved: string;

        // 首次设置
        firstTimeSetup: string;
        firstTimeMessage: string;
        configureNow: string;

        // 工作区提示
        modelConfigured: string;
        changeConfig: string;
        noModelConfigured: string;
        configureModel: string;

        // 新增配置
        priorityHint: string;
        dragToReorder: string;
        keyPlaceholder: string;
        connectionSuccessShort: string;
        settingComplete: string;

        // Skills架构配置
        skillsTitle: string;
        skillsDesc: string;
        skillsModules: string;
        skillsModuleInsightChain: string;
        skillsModuleDataCleaning: string;
        skillsModuleChatPanel: string;
        skillsModuleAutoReport: string;
        skillsAdvanced: string;
        skillsAdvancedMultiStep: string;
        skillsAdvancedErrorRecovery: string;

        // 本地模型配置
        localModelTitle: string;
        localModelDesc: string;
        localModelInfo: string;

        // Local Router Configuration
        localRouterTitle: string;
        localRouterDesc: string;
        downloadRouterModel: string;
        routerModelReady: string;
        routerModelNotReady: string;
        routerModelDownloading: string;

        // 性能配置
        performanceSlowWarning: string;
        performanceColumnsUnit: string;
        performanceTimeoutUnit: string;

        // 设置页分类
        commonlyUsed: string;
        commonlyUsedDesc: string;
        appearanceAndLanguage: string;
        interfaceLanguage: string;
        interfaceLanguageDesc: string;
        localModelEnableTitle: string;
        aiConfigDesc: string;
        hardwareEnvironment: string;
        apiPriorityAndKeys: string;
        performanceDesc: string;

        dataProcessing: string;
        advanced: string;
        advancedDesc: string;
        devMode: string;
        devModeDesc: string;

        // 分析能力包设置
        analysisPackages: string;
        analysisPackagesDesc: string;
        chartDisplayConfig: string;
        chartFonts: string;
        dataAnalysisStrategy: string;
        dataPrivacyTitle: string;
        dataPrivacyDesc: string;
        chartFontsHint: string;
        saveAndApply: string;
        restartEngineWarning: string;
        builtIn: string;

        // 通用表格
        table: {
            method: string;
            description: string;
            charts: string;
        };

        // User Roles
        userRole: string;
        userRoleDesc: string;
        roleAnalyst: string;
        roleAnalystDesc: string;
        roleAnalystFeatures: string;
        roleExpert: string;
        roleExpertDesc: string;
        roleExpertFeatures: string;
        roleSwitchHint: string;
        currentConfigDetail: string;
        cleaningEngine: string;
        cleaningRouter: string;
        cleaningAI: string;
        minSuggestions: string;
        showSQL: string;
        defaultExpanded: string;
        defaultCollapsed: string;
        reportTemplate: string;
        templateBusiness: string;
        templateTechnical: string;

        // 数据隐私选项
        dataPrivacy: {
            autoSanitize: string;
            autoSanitizeBadge: string;
            autoSanitizeDesc: string;
            sendRaw: string;
            sendRawDesc: string;
            localModelHint: string;
        };

        // 数据分析策略选项
        dataAnalysis: {
            samplingHint: string;
            fastMode: string;
            fastModeBadge: string;
            fastModeDesc: string;
            balancedMode: string;
            balancedModeBadge: string;
            balancedModeDesc: string;
            balancedModeDynamic: string;
            preciseMode: string;
            preciseModeBadge: string;
            preciseModeDesc: string;
        };

        // 加载状态
        loadingState: {
            releasing: string;
            initializing: string;
        };
        testLog: string;
        testLogDownload: string;
        testLogDownloadDesc: string;
        testLogDownloadSuccess: string;

        hardwareStrong: string;
        hardwareMedium: string;
        hardwareWeak: string;
        hardwareScore: string;
        hardwareRecLocal: string;
        hardwareRecCloud: string;
        hardwareUnknown: string;

        // MVP简易模式AI配置
        aiSettings: {
            title: string;
            simpleMode: string;
            modeSelection: string;
            localMode: string;
            localModeDesc: string;
            cloudMode: string;
            cloudModeDesc: string;
            cloudModeDescNew: string;
            cloudModeHint: string;
            unlockFirst: string;
            modeLocal: string;
            modeCloud: string;
            unlimited: string;
            quotaBased: string;
        };

        // Ollama模型配置
        ollamaChecking: string;
        ollamaNotRunning: string;
        ollamaDownload: string;
        ollamaConnected: string;
        ollamaRefresh: string;
        installedModels: string;
        recommendedModels: string;
        customModel: string;
        customModelPlaceholder: string;
        downloading: string;
        downloadSuccess: string;
        downloadFailed: string;
        selectModelTip: string;
        connectionError: string;
        qwen7bDesc: string;
        qwen14bDesc: string;
        qwen3bDesc: string;
        qwenGeneralDesc: string;

        // 模型调用逻辑说明
        modelLogicTitle: string;
        modelLogicLocal: string;
        modelLogicAPI: string;
        modelLogicFallback: string;

        // MVP阶段功能限制
        mvpNotAvailable: string;

        langZhCN: string;
        langEnUS: string;

        // 通用标签
        common: {
            default: string;
        };
    };
}
