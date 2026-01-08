import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROMPTS_DIR = path.resolve(__dirname, '../src/services/prompts/library/l2');

// 定义分析模块与对应方法
const ANALYSIS_MODULES = {
    'Descriptive Statistics': ['worker_stats', 'worker_distribution', 'worker_crosstab', 'worker_topn'],
    'Correlation Analysis': ['worker_correlation', 'worker_regression', 'worker_decision_tree'],
    'Time Series Analysis': ['worker_trend', 'worker_granger', 'worker_time_decomposition'],
    'Clustering & Segmentation': ['worker_cluster', 'worker_dbscan'],
    'Anomaly Detection': ['worker_outlier'],
    'Data Quality': ['worker_missing']
};

interface PromptMeta {
    name: string;
    executionMode: string;
    description: string;
}

function parsePromptFile(filePath: string): PromptMeta | null {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const nameMatch = content.match(/name:\s*'([^']+)'/);
        const modeMatch = content.match(/executionMode:\s*'([^']+)'/);
        const descMatch = content.match(/description:\s*'([^']+)'/);

        // 如果没有显式 executionMode，检查是否有 codeTemplate
        let executionMode = modeMatch ? modeMatch[1] : 'AI_GENERATED';
        if (executionMode === 'AI_GENERATED' && content.includes('codeTemplate:')) {
            executionMode = 'TEMPLATE_FILL'; // 隐式推断
        }

        if (nameMatch) {
            return {
                name: nameMatch[1],
                executionMode: executionMode,
                description: descMatch ? descMatch[1] : ''
            };
        }
    } catch (e) { }
    return null;
}

function analyzeCoverage() {
    console.log('# Prompt Template Coverage Analysis Report\n');
    console.log(`| Category | Method | Status | Description |`);
    console.log(`| :--- | :--- | :--- | :--- |`);

    const knownMethods = new Set<string>();

    for (const [moduleName, methods] of Object.entries(ANALYSIS_MODULES)) {
        for (const method of methods) {
            knownMethods.add(method);
            const promptDir = path.join(PROMPTS_DIR, method);

            // 检查目录是否存在
            if (!fs.existsSync(promptDir)) {
                console.log(`| **${moduleName}** | \`${method}\` | ❌ **Missing** | (Module not implemented) |`);
                continue;
            }

            // 读取 .zh.ts 文件
            const promptFile = path.join(promptDir, `${method}.zh.ts`);
            if (fs.existsSync(promptFile)) {
                const meta = parsePromptFile(promptFile);
                if (meta) {
                    const statusIcon = meta.executionMode === 'TEMPLATE_FILL' ? '✅' : '⚠️';
                    console.log(`| **${moduleName}** | \`${method}\` | ${statusIcon} **${meta.executionMode}** | ${meta.description} |`);
                }
            } else {
                console.log(`| **${moduleName}** | \`${method}\` | ❓ **File Missing** | |`);
            }
        }
    }

    console.log('\n## Gaps Identification\n');
    // 这里硬编码一些已知的缺失，基于脚本无法扫描到的知识
    console.log('- **Time Series**: Missing Seasonal Decomposition, ACF/PACF');
    console.log('- **Causal Analysis**: Missing DoWhy, CausalML, PSM, RDD');
    console.log('- **Clustering**: Missing DBSCAN, Hierarchical');
}

analyzeCoverage();
