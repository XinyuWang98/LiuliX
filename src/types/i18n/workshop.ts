/**
 * AI 工坊与数据探索模块类型定义
 * 包含: workshop, workflow, insightChain, insight, grid, pagination, exploration, evidence, aiCost, aiRetry, localModel, packages, cache
 */

export interface WorkshopTranslations {
    // 工作流
    workflow: {
        upload: string;
        cleaning: string;
        hypothesis: string;
        insights: string;
        report: string;
    };

    // AI工坊
    workshop: {
        title: string;
        cleaning: string;
        cleaningDesc: string;
        exploration: string;
        explorationDesc: string;
        dataExploration: string;
        hypothesis: string;
        hypothesisDesc: string;
        suggestions: string;
        suggestionsDesc: string;
        tools: {
            cleaning: {
                title: string;
                desc: string;
                action: string;
            };
            exploration: {
                title: string;
                desc: string;
                action: string;
            };
            hypothesis: {
                title: string;
                desc: string;
                action: string;
            };
            suggestions: {
                title: string;
                desc: string;
                action: string;
            };
        };
        mindMap: string;
        mindMapDesc: string;
        voiceReport: string;
        voiceReportDesc: string;
        pptReport: string;
        pptReportDesc: string;
        assessment: string;
    };

    // 洞察链
    insightChain: {
        title: string;
        loading: string;
        loadingHypothesis: string;
        noHypotheses: string;
        noInsights: string;
        initializing: string;
        waitingForData: string;
        readyHint: string;
        generateHypothesis: string;
        customHypothesis: string;
        customPlaceholder: string;
        submit: string;
        adopt: string;
        ignore: string;
        adopted: string;
        ignored: string;
        viewCode: string;
        copyCode: string;
        codeCopied: string;
        conclusion: string;
        analysisMethod: string;
        dataSource: string;
        selectHypothesis: string;
        or: string;
        analyzing: string;
        results: string;
        generatingInsight?: string;
    };

    // 森林式下钻交互
    insight: {
        recommendedAction: string;
        recommendedActions: string;
        sampling?: {
            badge: string;
            tooltip: string;
            unknown: string;
        };
        customAnalysis: string;
        selectMethod: string;
        selectColumn: string;
        selectColumn2: string;
        pleaseSelect: string;
        execute: string;
        analyzing: string;
        viewCode: string;
        drillDown: string;
        maxDepthReached: string;
    };

    // 数据表格
    grid: {
        loading: string;
        loadStatsFailed: string;
        loadDataFailed: string;
        nullRate: string;
        uniqueValues: string;
        missingPercent: string;
        selectedColumns: string;
        selectColumns: string;
        clickToExpand: string;
        clickToCollapse: string;
        distribution: string;
        value: string;
        count: string;
        selectAll: string;
        deselectAll: string;
        dataType: {
            setAs: string;
            integer: string;
            double: string;
            string: string;
            boolean: string;
            date: string;
            timestamp: string;
            modifying: string;
            success: string;
            failed: string;
        };
    };

    // 分页器
    pagination: {
        prev: string;
        next: string;
        page: string;
        of: string;
        totalPages: string;
        totalRows: string;
        rows: string;
    };

    // 数据探索流
    exploration: {
        title: string;
        addBlock: string;
        placeholder: string;
        searchPlaceholder: string;
        chatPlaceholder: string;
        noContent: string;
        actions: {
            collapse: string;
            expand: string;
            collapseNotebook: string;
            expandNotebook: string;
            pin: string;
            unpin: string;
            quote: string;
            addToEvidence: string;
            moveUp: string;
            delete: string;
        };
        blocks: {
            upload: string;
            cleaning: string;
            hypothesis: string;
            insights: string;
            report: string;
            chat: string;
        };
        sections: {
            projects: string;
            cleaning: string;
            insights: string;
            report: string;
        };
        project: {
            grid: {
                title: string;
            };
            context: {
                rename: string;
                delete: string;
            };
            card: {
                fileCount: string;
                filesLabel: string;
                nearLimit: string;
                uploadNew: string;
            };
        };
    };

    // 证据池
    evidence: {
        title: string;
        noRecords: string;
        noRecordsHint: string;
        clearAll: string;
        pin: string;
        unpin: string;
        delete: string;
        adopt: string;
        adopted: string;
        affectedRows: string;
        rowsChanged: string;
        type: {
            cleaning: string;
            analysis: string;
            insight: string;
            visualization: string;
            insightChain: string;
        };
    };

    // AI成本提示
    aiCost: {
        title: string;
        fileCount: string;
        estimatedCalls: string;
        quotaInsufficient: string;
        quotaRemaining: string;
        configureAPI: string;
        confirmProceed: string;
        costSavingTip: string;
    };

    // AI重试
    aiRetry: {
        title: string;
        retryButton: string;
        retrying: string;
        failed: string;
        staleHint: string;
        noSuggestionsHint: string;
    };

    // 本地模型进度
    localModel: {
        init: string;
        downloadHint: string;
        status: {
            loading: string;
            fetching: string;
            processing: string;
            ready: string;
            unknown: string;
            loadingFromCache: string;
            downloading: string;
            finish: string;
        };
    };

    // 分析能力包
    packages: {
        basic: {
            name: string;
            sizeEstimate: string;
            methods: {
                distribution: { name: string; desc: string };
                correlation: { name: string; desc: string };
                trend: { name: string; desc: string };
                stats: { name: string; desc: string };
                groupby: { name: string; desc: string };
                topn: { name: string; desc: string };
                missing: { name: string; desc: string };
                outlier: { name: string; desc: string };
                crosstab: { name: string; desc: string };
            };
        };
        sklearn: {
            name: string;
            sizeEstimate: string;
            methods: {
                cluster: { name: string; desc: string };
                decisionTree: { name: string; desc: string };
            };
        };
        statsmodels: {
            name: string;
            sizeEstimate: string;
            methods: {
                regression: { name: string; desc: string };
            };
        };
        charts: {
            histogram: string;
            bar: string;
            scatter: string;
            box: string;
            heatmap: string;
            line: string;
            movingAvg: string;
            statsSummaryBar: string;
            groupedBar: string;
            rankingBar: string;
            missingMatrix: string;
            scatterAnnotated: string;
            stacked: string;
            pcaScatter: string;
            clusterDist: string;
            decisionTreeVis: string;
            coefficientPlot: string;
            wordcloud: string;
            wordFreqBar: string;
            wordFreqTable: string;
        };
        fonts: {
            simhei: string;
            msgothic: string;
            malgun: string;
        };
    };

    // 缓存/采样标记
    cache: {
        basedOnSample: {
            hint: string;
            docs: string;
        };
    };
}
