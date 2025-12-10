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

        // 设置
        settings: {
            apiConfig: string;
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
            clickOrDrag: string;
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

        // 智能工坊
        workshop: {
            title: string;
            description: string;
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
        };

        // 工作流
        workflow: {
            upload: string;
            cleaning: string;
            hypothesis: string;
            insights: string;
            report: string;
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
            searchPlaceholder: string;
            chatPlaceholder: string;
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
    };
}
