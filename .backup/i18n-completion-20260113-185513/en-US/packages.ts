// Analysis Packages English Translations
export const packages = {
    // Basic Analysis Package
    basic: {
        name: 'Basic Analysis',
        sizeEstimate: '~8MB',
        methods: {
            distribution: { name: 'Distribution Analysis', desc: 'View the distribution of a single variable' },
            correlation: { name: 'Correlation Analysis', desc: 'Analyze relationships between two variables' },
            trend: { name: 'Trend Analysis', desc: 'Analyze how values change over time' },
            stats: { name: 'Descriptive Statistics', desc: 'Calculate mean, median, standard deviation, etc.' },
            groupby: { name: 'Group Aggregation', desc: 'Group by categorical variables and calculate aggregates' },
            topn: { name: 'Top N Ranking', desc: 'Find the top N most frequent items' },
            missing: { name: 'Missing Value Analysis', desc: 'Visualize missing value patterns' },
            outlier: { name: 'Outlier Detection', desc: 'Identify anomalous outliers in data' },
            crosstab: { name: 'Crosstab Analysis', desc: 'Analyze cross-distribution of two categorical variables' },
        }
    },

    // Machine Learning Package
    sklearn: {
        name: 'Machine Learning',
        sizeEstimate: '~12MB',
        methods: {
            cluster: { name: 'K-Means Clustering', desc: 'Discover latent groups in data' },
            decisionTree: { name: 'Decision Tree Analysis', desc: 'Find key rules affecting target variable' },
        }
    },

    // Statistical Modeling Package
    statsmodels: {
        name: 'Statistical Modeling',
        sizeEstimate: '~8MB',
        methods: {
            regression: { name: 'OLS Regression Analysis', desc: 'Quantify independent effects of factors on target' },
        }
    },

    // Chart Types
    charts: {
        histogram: 'Histogram',
        bar: 'Bar Chart',
        scatter: 'Scatter Plot',
        box: 'Box Plot',
        heatmap: 'Heatmap',
        line: 'Line Chart',
        movingAvg: 'Moving Average',
        statsSummaryBar: 'Statistical Summary Bar',
        groupedBar: 'Grouped Bar',
        rankingBar: 'Ranking Bar',
        missingMatrix: 'Missing Value Matrix',
        scatterAnnotated: 'Annotated Scatter',
        stacked: 'Stacked Bar',
        pcaScatter: 'PCA Scatter Plot',
        clusterDist: 'Cluster Distribution',
        decisionTreeVis: 'Decision Tree Visualization',
        coefficientPlot: 'Coefficient Plot',
    },

    // Fonts
    fonts: {
        simhei: 'Chinese (SimHei)',
        msgothic: 'Japanese (MS Gothic)',
        malgun: 'Korean (Malgun Gothic)',
    },

    // Python Libraries
    libraries: {
        pandas: 'Pandas Data Processing',
        numpy: 'NumPy Numerical Computing',
        matplotlib: 'Matplotlib Visualization',
        seaborn: 'Seaborn Statistical Visualization',
        scipy: 'SciPy Scientific Computing',
        'scikit-learn': 'Scikit-learn Machine Learning',
        statsmodels: 'Statsmodels Statistical Modeling',
    }
};
