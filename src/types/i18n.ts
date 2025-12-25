/**
 * 语言配置类型
 */
export interface LanguageConfig {
    code: 'zh-CN' | 'en-US';
    name: string;
    translations: {
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
            collapse: string;  // 新增：收起/折叠
        };

        // 数据统计
        data: {
            unique: string;
            missing: string;
            min: string;
            max: string;
            mean: string;
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
        };

        // 侧边栏
        sidebar: {
            collapse: string;
        };

        // 聊天/交互
        chat: {
            askAIPlaceholder: string;
        };

        // 语言选择
        language: {
            title: string;
            priority: string;
        };

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
        };

        // Prompt 库
        prompt: {
            library: {
                title: string;
                description: string;
            };
            category: {
                analysis: string;
                cleaning: string;
                visualization: string;
            };
            action: {
                copy: string;
                use: string;
                copied: string;
            };
            examples: {
                dataCleaningExpert: {
                    title: string;
                    description: string;
                    content: string;
                    tags: string[];
                };
                salesTrend: {
                    title: string;
                    description: string;
                    content: string;
                    tags: string[];
                };
                userPersona: {
                    title: string;
                    description: string;
                    content: string;
                    tags: string[];
                };
                complexChart: {
                    title: string;
                    description: string;
                    content: string;
                    tags: string[];
                };
            };
        };

        // 数据源
        dataSource: {
            title: string;
            noProjects: string;
            uploadHint: string;
            uploadFile: string;
            project: {
                untitled: string;
                rename: string;
                delete: string;
                confirmDelete: string;
                filesCount: string;
                createdAt: string;
                newProject: string;
                // 项目命名主题(国际化)
                themes: {
                    game: string;
                    sales: string;
                    finance: string;
                    analytics: string;
                    user: string;
                    data: string;
                };
            };
        };

        // 文件上传
        fileUpload: {
            uploadButton: string;
            clickOrDrag: string;
            clickOrDragShort: string;
            dropHere: string;
            uploading: string;
            uploadingProgress: string;
            supportedFormats: string;
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
            title: string;
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
        };

        // AI工坊
        workshop: {
            title: string;
            cleaning: string;
            cleaningDesc: string;
            exploration: string;
            explorationDesc: string;
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
        };

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

            // DataCleaner 增强功能键
            aiSuggestions: string;
            cleaningSuggestions: string;
            collapse: string;
            expandMore: string;
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

        // 工作流
        workflow: {
            upload: string;
            cleaning: string;
            hypothesis: string;
            insights: string;
            report: string;
        };

        // 洞察链
        insightChain: {
            title: string;
            loading: string;
            loadingHypothesis: string;
            noHypotheses: string;
            noInsights: string;
            generateHypothesis: string;
            customHypothesis: string;
            customPlaceholder: string;
            submit: string;
            adopt: string;
            ignore: string;
            adopted: string;
            viewCode: string;
            copyCode: string;
            codeCopied: string;
            conclusion: string;
            analysisMethod: string;
            dataSource: string;
            selectHypothesis: string;
            or: string;
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

        // 报告生成器
        report: {
            title: string;
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

        // 缓存/采样标记
        cache: {
            basedOnSample: {
                hint: string;
                sampleSize: string;
                totalSize: string;
                note: string;
            };
        };

        // 分析配置翻译
        config: {
            performanceQuality: string;
            maxColumns: string;
            maxColumnsDesc: string;
            timeout: string;
            timeoutDesc: string;
        };

        // 错误提示文案
        errors: {
            tableNotFound: string;
            autoRecovering: string;
            loadFailed: string;
            retry: string;
            cancel: string;
            close: string;
        };

        // 硬件检测与推荐
        hardware: {
            detection: string;
            detecting: string;
            detectionFailed: string;
            platform: string;
            gpu: string;
            memory: string;
            score: string;
            recommendation: string;

            // 平台描述
            macM1Plus: string;
            macIntel: string;
            windows: string;
            linux: string;
            unknown: string;

            // GPU描述
            gpuNotDetected: string;
            gpuSoftware: string;
            gpuHigh: string;
            gpuMedium: string;
            gpuIntegrated: string;

            // 推荐模式
            recommendedMode: string;
            localMode: string;
            apiMode: string;
            confidence: string;
            confidenceHigh: string;
            confidenceMedium: string;
            confidenceLow: string;

            // 推荐理由
            reason: string;
            technicalDetails: string;
            expectedLoadTime: string;
            expectedInferenceTime: string;

            // 优缺点
            pros: string;
            cons: string;

            // 按钮
            useRecommended: string;
            keepCurrent: string;
            redetect: string;
        };
    };
}
