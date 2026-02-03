/**
 * Prompt 库模块类型定义
 * 包含: prompt (library, sidebar, detail, category, action, examples, builder)
 */

export interface PromptTranslations {
    // Prompt 库
    prompt: {
        library: {
            title: string;
            description: string;
            noPromptsFound: string;
            card: {
                usageTooltip: string;
                official: string;
            };
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
            info: string;
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
        // Prompt Builder (新增)
        builder: {
            title: string;
            header: {
                saveTemplate: string;
                exportJson: string;
                help: string;
            };
            codeEditor: {
                autoDetected: string;
                smartParameterize: string;
                pasteExample: string;
                clear: string;
                importFile: string;
            };
            emptyState: {
                title: string;
                description: string;
                step1: string;
                step2: string;
                step3: string;
            };
            recognition: {
                success: string;
                language: string;
                confidence: string;
                collapse: string;
                confirmParameterize: string;
                previewTemplate: string;
                manualAdjust: string;
            };
            imports: {
                title: string;
                selectPackage: string;
                addButton: string;
                autoDetected: string;
                manualAdded: string;
                removeTooltip: string;
                emptyHint: string;
            };
            params: {
                inputTitle: string;
                outputTitle: string;
                validated: string;
                statsValue: string;
            };
            alerts: {
                noLanguage: string;
                duplicateImport: string;
            };
            pyodideWarning: {
                title: string;
                incompatiblePackages: string;
                viewDetails: string;
                reason: string;
                alternative: string;
                incompatibleTag: string;
            };
            sqlWarning: {
                title: string;
                dangerousOperations: string;
                severity: {
                    high: string;
                    medium: string;
                    low: string;
                };
                viewDetails: string;
            };
        };
    };

    // Python 包描述
    packages: {
        pandas: string;
        numpy: string;
        matplotlib: string;
        seaborn: string;
        plotly: string;
        scipy: string;
        sklearn: string;
        datetime: string;
        json: string;
        base64: string;
        io: string;
    };
}
