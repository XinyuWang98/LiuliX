// Miscellaneous translations (themes, workshop, workflow, grid, pagination)

export const themes = {
    "apple-dark": 'Apple Dark',
    "apple-light": 'Apple Light',
    neufuture: 'Neu Future',
    professional: 'Professional',
    minimal: 'Minimal',
};

export const workshop = {
    title: 'AI Workshop',
    cleaning: 'Cleaning',
    cleaningDesc: 'Smart Cleaning Suggestions',
    exploration: 'Exploration',
    explorationDesc: 'Data Exploration',
    dataExploration: 'Data Exploration',
    hypothesis: 'Hypothesis',
    hypothesisDesc: 'Generate Hypotheses',
    suggestions: 'Suggestions',
    suggestionsDesc: 'Data Quality Analysis',
    assessment: 'Data Assessment',
    tools: {
        cleaning: {
            title: 'Cleaning',
            desc: 'Smart data cleaning',
            action: 'Start Cleaning',
        },
        exploration: {
            title: 'Exploration',
            desc: 'Deep dive into patterns',
            action: 'Start Exploration',
        },
        hypothesis: {
            title: 'Hypothesis',
            desc: 'Generate hypotheses',
            action: 'Generate',
        },
        suggestions: {
            title: 'Suggestions',
            desc: 'Quality suggestions',
            action: 'View Suggestions',
        },
    },
    mindMap: 'Mind Map',
    mindMapDesc: 'Visual Analysis Tree',
    voiceReport: 'Voice Report',
    voiceReportDesc: 'Audio Podcast',
    pptReport: 'PPT Report',
    pptReportDesc: 'Generate Slides',
};

export const workflow = {
    upload: 'Upload File',
    cleaning: 'Data Cleaning',
    hypothesis: 'Hypothesis',
    insights: 'Insights',
    report: 'Report',
};

export const grid = {
    loading: 'Loading...',
    loadStatsFailed: 'Failed to load stats',
    loadDataFailed: 'Failed to load data',
    nullRate: 'Missing rate: {rate}%',
    uniqueValues: '{count} unique',
    missingPercent: '{percent}% missing',
    missingRate: 'Missing',  // 🆕 v2.3 added
    selectedColumns: 'Selected {count}/{total} columns',
    selectColumns: 'Select Columns',
    clickToExpand: 'Click to expand stats',
    clickToCollapse: 'Click to collapse',
    distribution: 'Distribution',
    value: 'Value',
    count: 'Count',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    dataType: {
        setAs: 'Convert to {type}',
        integer: 'Integer',
        double: 'Double',
        string: 'String',
        boolean: 'Boolean',
        date: 'Date',
        timestamp: 'Timestamp',
        modifying: 'Converting...',
        success: 'Converted',
        failed: 'Failed',
    },
};

export const pagination = {
    prev: 'Previous',
    next: 'Next',
    page: 'Page',
    of: 'of',
    totalPages: 'pages',
    totalRows: 'Total',
    rows: 'rows',
};
