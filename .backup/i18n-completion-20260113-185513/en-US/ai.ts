// AI-related translations (Cost, Retry, Cache, Local Model, Config)
// TODO: Extract full content from index.ts

export const aiCost = {
    title: 'AI Cost Estimation',
    fileCount: 'Uploading {count} files',
    estimatedCalls: 'Estimated {calls} AI calls',
    quotaInsufficient: 'Insufficient quota',
    quotaRemaining: 'Remaining quota: {count}',
    configureAPI: 'Configure API Key',
    confirmProceed: 'Confirm',
    costSavingTip: 'Configure your own API key to save cost',
};

export const aiRetry = {
    title: 'AI Processing Failed',
    retryButton: 'Retry',
    retrying: 'Retrying...',
    failed: 'AI failed, click to retry',
    staleHint: 'Data cleaned, re-analyzing...',
    noSuggestionsHint: 'No suggestions available',
};

export const cache = {
    basedOnSample: {
        hint: 'Based on sampled data',
        sampleSize: 'Sample size: {size}',
        totalSize: 'Total size: {total}',
        note: 'Using first {size} rows for speed',
    },
};

export const localModel = {
    init: 'Initializing local model...',
    downloadHint: '⏳ First time: downloading 4.3GB model',
    status: {
        loading: 'Loading model...',
        fetching: 'Fetching model ({progress})',
        processing: 'Processing weights...',
        ready: 'Model ready',
        unknown: 'Processing...',
        loadingFromCache: 'Loading from cache...',
        downloading: 'Downloading...',
        finish: 'Complete',
    },
};

export const config = {
    performanceQuality: 'Performance & Quality',
    maxColumns: 'Max Columns',
    maxColumnsDesc: 'More columns = comprehensive but slower',
    timeout: 'Analysis Timeout',
    timeoutDesc: 'Max wait time (seconds)',
    samplingRows: 'Sampling Rows',
    samplingRowsDesc: 'Max rows for AI analysis',
};
