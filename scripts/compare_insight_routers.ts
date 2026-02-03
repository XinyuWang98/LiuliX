
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { pipeline } from '@xenova/transformers';


// Import Services (using relative paths for tsx execution)
// import { buildRouterPrompt } from '../src/services/prompts/routerPrompt/index';
// @ts-ignore
// import { setGlobalLanguageForTesting } from '../src/contexts/I18nContext';

// Local Mock for Prompt Builder to avoid heavy dependencies (DuckDB, etc.)
async function buildRouterPromptLocal(columns: string[], sampleData: any[], lang: string): Promise<string> {
    const isEn = lang === 'en-US';

    // Simulate formatting schema
    const columnInfo = columns.map(c => `- ${c} (Type: Unknown)`).join('\n');
    const samplePreview = JSON.stringify(sampleData, null, 2);

    // Prompt content mirrored from source
    if (isEn) {
        return `You are a senior data analyst. Based on the dataset characteristics, select 3-5 most valuable analysis perspectives from the [Available Analysis Templates].

## Dataset Information
### Column Information
${columnInfo}

### Sample Data
\`\`\`json
${samplePreview}
\`\`\`

## Available Analysis Templates
- 1: Distribution Analysis (Params: column_name)
- 2: Trend Analysis (Params: date_col, value_col)
- 3: Correlation Analysis (Params: col_x, col_y)
- 4: Outlier Detection (Params: column_name)

## Output Format (Strict JSON)
\`\`\`json
{
  "recommendations": [
    {
      "promptId": 1,
      "params": { "column_name": "actual_column_name" },
      "reason": "Brief reason"
    }
  ]
}
\`\`\`
`.trim();
    } else {
        return `你是一位资深数据分析专家。请根据数据集特征，从【可用分析模板】中选择 3-5 个最有价值的分析视角。

## 数据集信息
### 列信息
${columnInfo}

### 采样数据
\`\`\`json
${samplePreview}
\`\`\`

## 可用分析模板
- 1: 分布分析 (参数: column_name)
- 2: 趋势分析 (参数: date_col, value_col)
- 3: 相关性分析 (参数: col_x, col_y)
- 4: 异常检测 (参数: column_name)

## 输出格式 (严格 JSON)
\`\`\`json
{
  "recommendations": [
    {
      "promptId": 1,
      "params": { "column_name": "实际列名" },
      "reason": "推荐理由"
    }
  ]
}
\`\`\`
`.trim();
    }
}


// Mock specific environments
// @ts-ignore
global.localStorage = {
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { }
};

// Mock window for some checks if necessary
if (typeof window === 'undefined') {
    // @ts-ignore
    global.window = {};
}

/**
 * CONFIG
 */
const DATASET_DIR = path.join(process.cwd(), 'test_datasets');
const SYNTHETIC_ZH_DATASET = path.join(DATASET_DIR, 'synthetic_zh_sales.csv');
const OUTPUT_REPORT = path.join(process.cwd(), 'docs/03-测试验证/49-测试-Router对比报告.md');

// Define Local Router Labels (Mapping to prompt IDs roughly)
const ROUTER_LABELS = {
    'analyze_trend': ['trend', 'time series', 'over time', 'growth'],
    'analyze_distribution': ['distribution', 'histogram', 'spread', 'range'],
    'analyze_correlation': ['correlation', 'relationship', 'scatter', 'dependency'],
    'detect_outlier': ['outlier', 'anomaly', 'exception', 'deviation'],
    'summary_stats': ['summary', 'statistics', 'describe', 'overview']
};

const PROMPT_ID_MAP: Record<string, string> = {
    'analyze_trend': 'trend_analysis_v1',
    'analyze_distribution': 'distribution_analysis_v1',
    'analyze_correlation': 'correlation_analysis_v1',
    'detect_outlier': 'outlier_detection_v1',
    'summary_stats': 'general_summary_v1'
};

async function createSyntheticZhDataset() {
    console.log('Creating synthetic Chinese dataset...');
    const csvContent =
        `日期,销售额,产品类型,地区,客户满意度
2023-01-01,1000,电子产品,华北,5
2023-01-02,1500,家居,华南,4
2023-01-03,800,电子产品,华东,3
2023-01-04,2000,服装,华北,5
2023-01-05,1200,家居,华西,4
2023-01-06,2500,电子产品,华南,2
2023-01-07,900,服装,华东,4
2023-01-08,3000,电子产品,华北,5
`;
    fs.writeFileSync(SYNTHETIC_ZH_DATASET, csvContent);
}

// Mock Cloud AI to avoid cost (Simulate DeepSeek Response)
// In real run, we would call the API.
// Check invalid args
const USE_MOCK_CLOUD = !process.argv.includes('--api');

async function mockCloudRouter(prompt: string): Promise<any> {
    // Simulate AI behavior based on prompt content
    // This is a naive mock just for structural verification
    if (prompt.includes('日期') || prompt.includes('Date')) {
        return {
            recommendations: [
                { promptId: 'trend_analysis_v1', params: { column: 'date' }, reason: 'Time series detected' }
            ]
        };
    }
    if (prompt.includes('销售额') || prompt.includes('Sales')) {
        return {
            recommendations: [
                { promptId: 'distribution_analysis_v1', params: { column: 'sales' }, reason: 'Numeric distribution' }
            ]
        };
    }
    return { recommendations: [] };
}

// Real API Call Wrapper
async function callCloudRouter(prompt: string) {
    if (USE_MOCK_CLOUD) return mockCloudRouter(prompt);

    // TODO: Implement actual fetch to DeepSeek if --api flag is present
    // For now, fallback to mock to ensure script runs
    return mockCloudRouter(prompt);
}

async function runLocalRouter(classifier: any, column: string, sampleValues: any[]): Promise<{ label: string, score: number }> {
    // Construct Description
    const isNumeric = sampleValues.every(v => !isNaN(Number(v)));
    const description = `Column '${column}' contains ${isNumeric ? 'numeric' : 'categorical'} data. Examples: ${sampleValues.slice(0, 3).join(', ')}.`;

    const candidateLabels = Object.keys(ROUTER_LABELS);
    const output = await classifier(description, candidateLabels);

    return {
        label: output.labels[0],
        score: output.scores[0]
    };
}

async function main() {
    await createSyntheticZhDataset();

    // Load Local Model (Quantized Bart)
    console.log('Loading Local Model (Xenova/bart-large-mnli)...');
    // @ts-ignore
    const classifier = await pipeline('zero-shot-classification', 'Xenova/bart-large-mnli', { quantized: true });

    const datasets = fs.readdirSync(DATASET_DIR).filter(f => f.includes('synthetic_zh') || f.includes('medium_orders'));
    const results: any[] = [];

    for (const dataset of datasets) {
        console.log(`Processing ${dataset}...`);
        const filePath = path.join(DATASET_DIR, dataset);

        // Optimize: Read only first 4KB
        const fd = fs.openSync(filePath, 'r');
        const buffer = Buffer.alloc(4096);
        const bytesRead = fs.readSync(fd, buffer, 0, 4096, 0);
        fs.closeSync(fd);

        const content = buffer.toString('utf-8', 0, bytesRead);
        // Ensure valid CSV end or handling partial lines is tricky but for typical CSV structure, Papa can handle it or we trim last line
        const parsed = Papa.parse(content, { header: true, skipEmptyLines: true, preview: 5 }); // preview 5 ensures we don't need full file

        const columns = parsed.meta.fields || [];
        const rows = parsed.data as any[];

        // Test Both Languages
        for (const lang of ['en-US', 'zh-CN'] as const) {
            // setGlobalLanguageForTesting(lang);

            // 1. Cloud Path
            // Simplified: we construct prompt            
            const prompt = await buildRouterPromptLocal(columns, rows.slice(0, 5), lang);
            const cloudResponse = await callCloudRouter(prompt);
            const cloudRecs = cloudResponse.recommendations || [];

            // 2. Local Path
            const localRecs: any[] = [];
            for (const col of columns) {
                const samples = rows.slice(0, 5).map(r => r[col]);
                const { label, score } = await runLocalRouter(classifier, col, samples);
                if (score > 0.5) {
                    localRecs.push({ column: col, label, score });
                }
            }

            // Compare
            // We map Local Labels to Prompt IDs
            const localRecsMapped = localRecs.map(r => ({
                column: r.column,
                promptId: PROMPT_ID_MAP[r.label],
                score: r.score
            }));

            results.push({
                dataset,
                lang,
                cloudRecs,
                localRecs: localRecsMapped
            });
        }
    }

    // Generate Report
    let reportMd = '# Router Comparison Report\n\n';
    for (const res of results) {
        reportMd += `## Dataset: ${res.dataset} (${res.lang})\n\n`;
        reportMd += `| Column | Cloud Suggestion | Local Suggestion | Score | Match |\n`;
        reportMd += `| :--- | :--- | :--- | :--- | :--- |\n`;

        // Naive Alignment by Column (Cloud result might not be column-keyed directly in real response, assuming params.column)
        const allCols = new Set([
            ...res.cloudRecs.map((r: any) => r.params?.column),
            ...res.localRecs.map((r: any) => r.column)
        ]);

        for (const col of allCols) {
            if (!col) continue;
            const cloud = res.cloudRecs.find((r: any) => r.params?.column === col);
            const local = res.localRecs.find((r: any) => r.column === col);

            const cloudStr = cloud ? cloud.promptId : '-';
            const localStr = local ? `${local.promptId}` : '-';
            const match = cloudStr === localStr ? '✅' : '❌';
            const score = local ? local.score.toFixed(2) : '-';

            reportMd += `| ${col} | ${cloudStr} | ${localStr} | ${score} | ${match} |\n`;
        }
        reportMd += '\n';
    }

    console.log(reportMd);
    // Write to file? User didn't ask explicitly but good for debug.
}

main().catch(console.error);
