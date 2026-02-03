/**
 * 分析报告模块类型定义
 * 包含: report
 */

export interface ReportTranslations {
    // 报告生成器
    report: {
        title: string;
        tabs: {
            notebook: string;
            evidence: string;
        };
        copy: string;
        copied: string;
        download: string;
        copyToClipboard: string;
        downloadMarkdown: string;
        downloadPdf: string;
        noRecords: string;
        noRecordsHint: string;
        noInsightChain: string;
        totalRecords: string;
        cleaningOps: string;
        insights: string;
        evidenceAdopted: string;
        hideNotebook: string;
        showNotebook: string;
        useNewWorkbench: string;
        previewHint: string;
        aiAssistant: string;
        evidenceCollected: string;
        hypothesis: string;
        conclusion: string;
        viewCode: string;
        overallConclusion: string;
        basedOnInsights: string;
        suggestion1: string;
        suggestion2: string;
        suggestion3: string;
        // Markdown 报告生成相关
        generatedAt: string;
        dataSource: string;
        sampleData: string;
        recordsUnit: string;
        cleaningSection: string;
        analysisSection: string;
        insightsSection: string;
        visualizationSection: string;
        timestamp: string;
        operationType: string;
        description: string;
        tags: string;
        analysisResult: string;
        analysisSql: string;
        detailInfo: string;
        nextSteps: string;
        upgradeRoadmap: string;
        roadmapHtml: string;
        roadmapCharts: string;
        roadmapThemes: string;
        roadmapExport: string;
        generatedBy: string;

        // V0 双角色报告新增
        notebook: {
            title: string;
            copyCell: string;
            copyAllToColab: string;
            runDisabled: string;
            runDisabledTip: string;
            copyCode: string;
            codeCopied: string;
            defaultTitle: string;
            defaultSigner: string;
            viewMode: {
                pure: string;
                enhanced: string;
                pureHint: string;
                enhancedHint: string;
            };
        };

        audit: {
            pending: string;
            approved: string;
            rejected: string;
            markApproved: string;
            markRejected: string;
            addNote: string;
            progress: string;
            signReport: string;
            reportSigned: string;
            signedBy: string;
            signedAt: string;
            reportLocked: string;
            unlockAndReaudit: string;
            confirmSign: string;
            signConfirmMessage: string;
            allCellsReviewed: string;
            issueType: string;
            issueSqlLogic: string;
            issueDataAnomaly: string;
            issueChartInaccurate: string;
            issueConclusion: string;
            note: string;
            submit: string;
        };

        export: {
            download: string;
            downloadIpynb: string;
            successIpynb: string;
            uploadToColab: string;
            exportDisabled: string;
            exportPDF: string;
            exportMarkdown: string;
            needSignFirst: string;
            colabInstructions: string;
            downloadHTML: string;
            successMarkdown: string;
            successHTML: string;
        };

        mode: {
            notebook: string;
            report: string;
            switchTo: string;
        },

        actions: {
            showCode: string;
            hideCode: string;
        },

        status: {
            notSignedYet: string;
            canPreviewNoExport: string;
        };
        // Phase 1: 左右分栏新增
        annotation: {
            placeholder: string;
        };
        code: {
            title: string;
            lines: string;
        };
        cell: {
            defaultTitle: string;
        };
        globalSetup: {
            title: string;
            collapsed: string;
            lines: string;
        };
    };
}
