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
            verifying?: string; // 验证中...
            pageTitle: string; // 页面标题
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

        // Header (New)
        header: {
            inviteCodeTrial: string;
            freeTrial: string;
        };

        // Invite Code (New)
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

        // 分析状态 (New)
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

            // 语言名称
            langZhCN: string;
            langEnUS: string;
        };

        // Prompt 库
        prompt: {
            library: {
                title: string;
                description: string;
            };
            sidebar: {
                all: string;
                cleaning: string;
                analysis: string;
            };
            detail: {
                infoTab: string;
                codeTab: string;
                description: string;
                tags: string;
                inputVariables: string;
                author: string;
                version: string;
                updated: string;
                copyCode: string;
                tryIt: string;
                sourceJson: string;
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
            assessment: string;
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
            // ✅ 新增字段（修复英语环境显示中文问题）
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
            viewCode: string;
            copyCode: string;
            codeCopied: string;
            conclusion: string;
            analysisMethod: string;
            dataSource: string;
            selectHypothesis: string;
            or: string;
            analyzing: string;  // 正在执行洞察分析
            results: string;    // 洞察结果标题
            generatingInsight?: string; // 正在生成洞察
        };

        // 森林式下钻交互
        insight: {
            recommendedAction: string;   // AI推荐
            recommendedActions: string;  // 推荐分析
            customAnalysis: string;      // 自选分析
            selectMethod: string;        // 选择分析方法
            selectColumn: string;        // 选择列
            selectColumn2: string;       // 选择第二列
            pleaseSelect: string;        // 请选择
            execute: string;             // 执行
            analyzing: string;           // 正在分析
            viewCode: string;            // 查看代码
            drillDown: string;           // 下钻分析
            maxDepthReached: string;     // 已达到最大下钻深度
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
                downloadIpynb: string;
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
            };

            status: {
                notSignedYet: string;
                canPreviewNoExport: string;
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
            samplingRows: string;
            samplingRowsDesc: string;
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
            reasonMacPlus: string;
            reasonGood: string;
            reasonMedium: string;
            reasonLow: string;
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
    };
}
