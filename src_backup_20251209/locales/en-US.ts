import { LanguageConfig } from '@/types/i18n';

export const enUS: LanguageConfig = {
    code: 'en-US',
    name: 'English',
    translations: {
        common: {
            loading: 'Loading...',
            initializing: 'Initializing Python Kernel...',
            error: 'Error',
            success: 'Success',
            cancel: 'Cancel',
            confirm: 'Confirm',
            delete: 'Delete',
            edit: 'Edit',
            save: 'Save',
            yes: 'Yes',
            no: 'No',
            search: 'Search',
            all: 'All',
        },

        data: {
            unique: 'Unique',
            missing: 'Missing',
            min: 'Min',
            max: 'Max',
            mean: 'Mean',
        },

        nav: {
            appName: 'DataPrism',
            noProject: 'No Project Selected',
            dashboard: 'Data Explorer',
            promptLibrary: 'Prompt Library',
            settings: 'Settings',
            user: 'User',
            theme: 'Switch Theme',
        },

        settings: {
            apiConfig: 'API Configuration',
            apiProvider: 'LLM Service Provider',
            modelSelection: 'Select Model',
            currentModel: 'Current Model',
            freeTierModel: 'Free Tier',
            paidModel: 'Paid',
            experimentalModel: 'Experimental',
            requiresApiKey: 'Requires API Key',
            noApiKeyRequired: 'No API Key Required',
            rateLimit: 'Rate Limit',
            requestsPerMinute: 'requests/minute',
            baseUrl: 'API Base URL',
            baseUrlPlaceholder: 'e.g. https://my-proxy.com (Leave empty for default)',
            baseUrlHint: 'Use this if you are using an API proxy service.',
            optional: 'Optional',

            // Security warning
            securityWarning: '⚠️ Security Notice',
            securityMessage: 'Your API Key is stored locally in your browser (sessionStorage) and is never uploaded to any server. You will need to re-enter it after closing the browser.',

            // Buttons
            testConnection: 'Test Connection',
            save: 'Save',
            clear: 'Clear',
            saved: 'Saved',
            testing: 'Testing...',

            // Error messages
            errorTitle: 'Connection Failed',
            error404: 'Model Not Found',
            error404Solution: 'This model is not available in the current API version. Please try another model or check the documentation.',
            error429: 'Quota Exceeded',
            error429Solution: 'Free tier quota has been exhausted. Please wait and retry later or upgrade to a paid plan.',
            errorInvalidKey: 'Invalid API Key',
            errorInvalidKeySolution: 'Please check if your API Key format is correct (should start with AIza).',
            errorNetwork: 'Network Error',
            errorNetworkSolution: 'Please check your network connection and try again.',

            // DuckDB Errors
            dbNotReady: 'Database not initialized',
            opfsFailed: 'OPFS Mount failed, falling back to in-memory mode',
            opfsSuccess: '🦆 DuckDB Engine Initialized',
            parseSuccess: 'Parsed in {time}ms',

            errorGeminiEmpty: 'Gemini returned empty response',
            errorClaudeEmpty: 'Claude returned empty response',
            errorModelEmpty: 'No content',
            errorAllFailed: 'All AI models failed, please try again later',

            errorQuota: 'API Quota Exceeded',
            errorQuotaSolution: 'Your Google AI Studio free tier quota has been exhausted. Please wait or switch accounts.',
            errorRateLimit: 'Rate Limit Exceeded',
            errorRateLimitSolution: 'You are sending requests too fast.',
            errorInvalidChars: 'Invalid Characters in Key',
            errorInvalidCharsSolution: 'Please check for hidden spaces, newlines, or non-ASCII characters.',
            errorUnknown: 'Unknown Error',
            viewDocumentation: 'View Documentation',

            // Success messages
            connectionSuccess: 'Connection Successful',
            connectionSuccessPrefix: 'Connection Successful! Current Model: ',
            autoUpgradeAlert: 'Automatically upgraded to gemini-2.5-flash (2025 Latest)',
            configSaved: 'API Configuration Saved',

            // First time setup
            firstTimeSetup: 'Welcome to DataPrism AI Features',
            firstTimeMessage: 'Please select a model to get started. If you choose a model that requires an API Key, you will need to obtain one from Google AI Studio.',
            configureNow: 'Configure Now',

            // Workspace prompt
            modelConfigured: 'Currently Using',
            changeConfig: 'Change Configuration',
            noModelConfigured: 'No AI Model Configured',
            configureModel: 'Configure Model',
            priorityHint: 'ℹ️ Drag to reorder priority. Keys are stored in SessionStorage only.',
            dragToReorder: 'Drag to Reorder',
            keyPlaceholder: 'Enter {model} API Key',
            connectionSuccessShort: 'Connected',
            settingComplete: 'Done',
        },

        prompt: {
            library: {
                title: 'Prompt Library',
                description: 'Collection of high-quality analysis strategies and prompts',
            },
            category: {
                analysis: 'Data Analysis',
                cleaning: 'Data Cleaning',
                visualization: 'Visualization',
            },
            action: {
                copy: 'Copy Prompt',
                use: 'Use this Prompt',
                copied: 'Prompt copied to clipboard',
            },
            examples: {
                dataCleaningExpert: {
                    title: 'Data Cleaning Expert',
                    description: 'Professional CSV data cleaning assistant for handling missing values, outliers, and format conversion.',
                    content: 'You are a senior data analyst. Please help me clean this dataset, focusing on:\\n1. Check and handle missing values\\n2. Identify outliers\\n3. Standardize date format\\nPlease output the cleaned CSV data and a cleaning report.',
                    tags: ['Cleaning', 'Preprocessing', 'CSV'],
                },
                salesTrend: {
                    title: 'Sales Trend Analysis',
                    description: 'Analyze sales trends based on time series data, identify seasonality and growth points.',
                    content: 'Please analyze sales trends based on the provided data:\\n1. Calculate monthly growth rate\\n2. Identify peak and off-peak seasons\\n3. Forecast sales trend for the next 3 months\\nPlease visualize results using line charts.',
                    tags: ['Analysis', 'Trend', 'Sales'],
                },
                userPersona: {
                    title: 'User Persona Generation',
                    description: 'Generate detailed user personas and segmentation recommendations based on user behavioral data.',
                    content: 'Based on user purchase history and browsing behavior, please:\\n1. Segment users into high-value, potential, and churn-risk categories\\n2. Generate typical personas for each category\\n3. Provide marketing recommendations for different segments',
                    tags: ['Analysis', 'User', 'Clustering'],
                },
                complexChart: {
                    title: 'Complex Chart Generation',
                    description: 'Generate combination charts such as Pareto charts and dual-axis charts.',
                    content: 'Please help me create a Pareto chart using Plotly.js to show main factors affecting sales. Left axis for sales (bar chart), right axis for cumulative percentage (line chart).',
                    tags: ['Visualization', 'Chart', 'Plotly'],
                },
            },
        },

        dataSource: {
            title: 'Data Sources',
            noProjects: 'No Projects',
            uploadHint: 'Click the button above to upload data files',
            uploadFile: 'Upload File',
            project: {
                untitled: 'Untitled Project',
                rename: 'Rename',
                delete: 'Delete Project',
                confirmDelete: 'Are you sure you want to delete this project and all its files?',
                filesCount: '{count} files',
                createdAt: 'Created at {date}',
                newProject: 'New Project',
                themes: {
                    game: 'Game',
                    sales: 'Sales',
                    finance: 'Finance',
                    analytics: 'Analytics',
                    user: 'User',
                    data: 'Data',
                },
            },
        },

        fileUpload: {
            clickOrDrag: 'Click or drag files here to upload',
            uploading: 'Parsing file...',
            uploadingProgress: 'Uploading {current}/{total} files...',
            supportedFormats: 'Supports CSV, XLSX, JSON formats',
            largeFileTitle: 'Large Dataset',
            largeFileMessage: 'Your uploaded file contains {rows} rows of data, file size is {size}. Processing large files may affect performance, sampling is recommended.',
            batchLargeFiles: 'Detected {count} large files',
            batchSampleHint: 'The following files are large and sampling is recommended:',
            sampleRatio: 'Sample Ratio',
            sampleResult: 'Approximately {rows} rows after sampling',
            forceImport: 'Force Import',
            startSample: 'Start Sampling',
            applyToAll: 'Apply to All',
            processingFile: 'Processing: {filename}',
            rows: 'Rows',
            columns: 'Columns',
            sampled: 'Sampled',
            parseError: 'File parsing failed',
            filesUploaded: 'Successfully uploaded {count} files',
            maxFilesExceeded: 'Maximum 10 files allowed. Please select fewer files.',
            filesFailed: '{count} files failed to parse',
            errorUnsupportedType: 'Please use CSV, XLSX, or JSON format.',
            errorCorrupted: 'The file may be corrupted or in an incorrect format.',
            errorGeneric: 'Please check the file and try again.',
            inputPlaceholder: 'Ask anything about your data...',
        },

        themes: {
            "apple-dark": "Apple Dark",
            "apple-light": "Apple Light",
            neufuture: 'Neufuture Dark',
            professional: 'High Contrast Professional',
            minimal: 'Minimal Light',
        },

        welcome: {
            title: 'Welcome to DataPrism',
            p0Completed: 'P0 Priority Features Completed:',
            features: {
                typeSystem: 'TypeScript type system (PromptSchema, ColumnMetadata, HypothesisSchema, etc.)',
                cssVariables: 'Global CSS variable system (supports theme switching)',
                themes: 'Three preset themes (Neufuture Dark, High Contrast Professional, Minimal Light)',
                promptLibrary: 'Prompt library configuration (10 preset analysis strategies)',
                projectConfig: 'Project configuration (Vite + React + TypeScript)',
                themeSwitch: 'Theme switching - Click the palette icon in the upper right corner!',
                fileUpload: 'File upload - Click the folder icon on the left to upload data!',
            },
            functionsTitle: 'Features',
            functions: {
                supportFormats: 'Supports CSV, XLSX, JSON file upload',
                dragUpload: 'Supports drag-and-drop upload and click selection',
                largeFileDetection: 'Automatic large file detection (>50,000 rows or >50MB) with sampling prompt',
                sampleRatio: 'Adjustable sampling ratio (5%-20%)',
            },
        },

        workshop: {
            title: 'Smart Workshop',
            description: 'AI Interaction and Evidence Pool',
        },

        cleaning: {
            title: 'Data Cleaning (DuckDB Native)',
            currentTable: 'Current Table',
            dedup: 'Auto Deduplication',
            fillNull: 'Fill Missing Values',
            normalize: 'Normalize Columns',
            dropEmpty: 'Drop Empty Rows',
            sqlPlaceholder: 'Generated SQL will appear here...',
            runSQL: 'Run SQL',
            intentDedup: 'Remove duplicate rows',
            intentFillNull: 'Fill NULL values in numeric columns with 0 and text with "Unknown"',
            intentNormalize: 'Rename columns to snake_case (lowercase with underscores)',
            intentDropEmpty: 'Delete rows where all columns are NULL',
        },

        workflow: {
            upload: 'Upload File',
            cleaning: 'Data Cleaning',
            hypothesis: 'Hypothesis',
            insights: 'Insights',
            report: 'Report',
        },

        // Exploration Flow
        exploration: {
            searchPlaceholder: 'Search conversation...',
            chatPlaceholder: 'Type a message to chat with AI...',
            actions: {
                collapse: 'Collapse',
                expand: 'Expand',
                pin: 'Pin',
                unpin: 'Unpin',
                quote: 'Quote',
                addToEvidence: 'Add to Evidence',
                moveUp: 'Move Up',
                delete: 'Delete',
            },
            blocks: {
                upload: 'Data Cleaning',
                cleaning: 'Cleaning Suggestions',
                hypothesis: 'Hypothesis Generation',
                insights: 'Key Insights',
                report: 'Final Report',
                chat: 'AI Assistant',
            }
        },
    },
};
