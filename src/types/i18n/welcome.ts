/**
 * 欢迎页与主题模块类型定义
 * 包含: welcome, hero, themes
 */

export interface WelcomeTranslations {
    // Hero Section (Legacy but partly used)
    hero: {
        title: string;
        subtitle: string;
        uploadButton: string;
        uploadingProgress: string;
        supportedFormats: string;
        supportedFormatsWithLimit: string;
        deviceAdaptive: string;
        largeFileTitle: string;
        largeFileMessage: string;
        batchLargeFiles: string;
        batchSampleHint: string;
        sampleRatio: string;
        sampleResult: string;
        forceImport: string;
        startSample: string;
        applyToAll: string;
        processingFile: string;
        rows: string;
        columns: string;
        sampled: string;
        parseError: string;
        filesUploaded: string;
        maxFilesExceeded: string;
        filesFailed: string;
        errorUnsupportedType: string;
        errorCorrupted: string;
        errorGeneric: string;
        inputPlaceholder: string;

        // 设备策略展示
        deviceStrategy: {
            title: string;
            memoryTier: string;
            fileLimit: string;
            maxRows: string;
            concurrency: string;
            tierLow: string;
            tierStandard: string;
            tierMainstream: string;
            tierHighPerf: string;
            tierFlagship: string;
            tierUltimate: string;
            maxRowsValue: string;
            concurrencyValue: string;
            inferenceTime: string;
            estimatedTime: string;
            // 修复中文键名问题，保留英文键名
            // 原文件有 "推理时间": string; 建议统一使用 inferenceTime
        };
    };

    // 主题
    themes: {
        "apple-dark": string;
        "apple-light": string;
        neufuture: string;
        professional: string;
        minimal: string;
    };

    // 欢迎页面
    welcome: {
        // Hero Section
        hero: {
            title: string;
            subtitle: string;
            uploadButton: string;
            trustBadges: {
                local: string;
                offline: string;
                desktop: string;
            };
        };
        // Trust & Safety Cards
        valueProps: {
            privacy: { title: string; desc: string };
            safety: { title: string; desc: string };
            control: { title: string; desc: string };
        };
        // Feature Highlights
        featureHighlights: {
            sectionTitle: string;
            zeroSetup: { title: string; desc: string; label: string };
            audit: { title: string; desc: string; label: string };
            report: { title: string; desc: string; label: string };
        };
        // Roadmap
        roadmap: {
            sectionTitle: string;
            sectionDescription: string;
            v1: {
                version: string;
                label: string;
                subtitle: string;
                feature1: string;
                feature2: string;
                feature3: string;
            };
            v15: {
                version: string;
                label: string;
                subtitle: string;
                feature1: string;
                feature2: string;
                feature3: string;
            };
            v2: {
                version: string;
                label: string;
                subtitle: string;
                feature1: string;
                feature2: string;
                feature3: string;
            };
        };

        // Community - 社区互动区域
        community: {
            title: string;
            subtitle: string;
            discordTitle: string;
            discordDesc: string;
            joinDiscord: string;
            githubTitle: string;
            githubDesc: string;
            starGithub: string;
        };

        // Legacy fields
        heroTitle?: string;
        heroSubtitle?: string;
        title: string;
        prefix?: string;
        subtitle?: string;
        p0Completed: string;
        features: {
            typeSystem: string;
            cssVariables: string;
            themes: string;
            promptLibrary: string;
            projectConfig: string;
            themeSwitch: string;
            fileUpload: string;
        };
        functionsTitle: string;
        functions: {
            supportFormats: string;
            dragUpload: string;
            largeFileDetection: string;
            sampleRatio: string;
        };
        uploadButton?: string;
        feature1?: string;
        feature2?: string;
        feature3?: string;
    };
}
