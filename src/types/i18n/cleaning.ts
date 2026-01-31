/**
 * 数据清洗模块类型定义
 * 包含: cleaning, quality
 */

export interface CleaningTranslations {
    // 数据清洗
    cleaning: {
        title: string;
        currentTable: string;
        dedup: string;
        fillNull: string;
        normalize: string;
        dropEmpty: string;
        sqlPlaceholder: string;
        runSQL: string;
        intentDedup: string;
        intentFillNull: string;
        intentNormalize: string;
        intentDropEmpty: string;
        defaultReason: string;
        ignore: string;
        requirements: string;
        moreFiles: string;

        // DataCleaner 增强功能键
        aiSuggestions: string;
        cleaningSuggestions: string;
        collapse: string;
        expandMore: string;
        expandSql: string;
        collapseSql: string;
        applySelected: string;
        analyzing: string;
        noSuggestions: string;
        promptLib: string;
        recommend: string;
        promptStandardizeDate: string;
        reasonDate: string;
        removeDuplicates: string;
        history: string;
        noHistory: string;
        applied: string;
        unknownAction: string;
        unknownColumn: string;
        currentFile: string;
        switchFile: string;
        noData: string;
        rowsCount: string;
        columnFilter: string;
        statsDistribution: string;

        // 清洗操作描述文本
        actionDropColumn: string;
        actionDedup: string;
        actionFillMissing: string;

        // AI建议文本
        suggFillMissing: string;
        suggFillReason: string;
        suggDropColumn: string;
        suggDropReason: string;
        suggDedup: string;
        suggDedupReason: string;

        // 证据池标签
        tagDedup: string;
        tagFillMissing: string;
        tagDropColumn: string;
        tagPromptLib: string;
        tagRuleSuggestion: string;

        // 重新开始功能
        resetAll: string;
        resetConfirm: string;
        resetSuccess: string;
        resetting: string;
        resetConfirmTitle: string;
        resetConfirmMessage: string;
        resetConfirmOk: string;
        resetConfirmCancel: string;
        searchColumns: string;
        // 建议类型名称
        catDeduplication: string;
        catDropEmpty: string;
        catFillMissing: string;
        catTypeConversion: string;
        catNormalize: string;
        catFill: string;
        catExperimental: string;
        applySuccess: string;
        // 展开按钮
        showMore: string;
        showLess: string;
        moreCount: string;
        selectAll: string;
        deselectAll: string;

        // AI清洗建议
        aiMode: string;
        ruleMode: string;
        desensitizing: string;
        generatingSuggestions: string;
        validatingSuggestions: string;
        aiFailed: string;
        suggestionValidated: string;
        suggestionFiltered: string;
        expectedImpact: string;
        affectedRows: string;
        qualityScore: string;

        // 校验错误提示
        validationError: {
            jsonFormat: string;
            missingSuggestions: string;
            missingField: string;
            invalidType: string;
            confidenceOutOfRange: string;
            forbiddenKeyword: string;
            tableNotReferenced: string;
            invalidSqlType: string;
            syntaxError: string;
            dryRunFailed: string;
        };

        // Prompt模板
        datasetOverview: string;
        columnDetails: string;
        qualityIssues: string;
        dataIntegrity: string;
        dataConsistency: string;
        dataFormat: string;
        outputFormat: string;

        // 自动预加载相关
        checkDataQuality: string;
        largeFileHint: string;
        suggRemoveDuplicates: string;
        tagAISuggestion: string;
        recommendPercent: string;
        generateAI: string;
        refreshAI: string;
        suggDropColumnSimple: string;
        suggFillZero: string;
        suggFillUnknown: string;
        suggFillMedian: string;
        suggFillMode: string;
        tryAI: string;
        dataGood: string;
        allApplied: string;
        serviceUnavailable: string;
        aiProgressThink: string;
        aiProgressAnalyzing: string;
        aiProgressGenerating: string;
        aiProgressValidating: string;
        aiProgressFinalizing: string;
        processing: string;
        sqlWarning: string;
    };

    quality: {
        title: string;
        score: string;
        issues: string;
        noData: string;
        missingValues: string;
        duplicates: string;
        good: string;
        needsReviews: string;
        criticalIssues: string;
        clickToImprove: string;
        healthScore: string;
    };
}
