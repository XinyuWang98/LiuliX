/**
 * 自动生成复杂度评分脚本
 * 分析Worker Prompt文件，生成复杂度评分
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Worker复杂度评分规则
 */
const COMPLEXITY_RULES = {
    // 库依赖权重
    libraries: {
        'pandas': 10,              // 基础
        'numpy': 5,
        'matplotlib': 15,          // 可视化
        'seaborn': 15,
        'scipy': 20,               // 科学计算
        'statsmodels': 30,         // 统计模型
        'sklearn': 40,             // 机器学习
        'prophet': 50,             // 时序预测
    },

    // 关键词权重
    keywords: {
        'fit(': 20,                // 模型训练
        'transform(': 15,
        'decompose': 30,           // 时序分解
        'GridSearchCV': 40,        // 超参调优
        'cross_val': 25,           // 交叉验证
        'groupby': 15,
        'plot': 10,
    },

    // 基础分数
    baseScore: 10,
};

/**
 * 扫描Worker Prompt文件
 */
function scanWorkerPrompts() {
    const workerDir = path.join(__dirname, '../src/services/prompts/library/l2');
    const workers = {};

    if (!fs.existsSync(workerDir)) {
        console.error('❌ Worker目录不存在:', workerDir);
        return workers;
    }

    // 读取所有worker_*目录
    const dirs = fs.readdirSync(workerDir).filter(d => {
        const fullPath = path.join(workerDir, d);
        return fs.statSync(fullPath).isDirectory() && d.startsWith('worker_');
    });

    console.log(`📂 发现 ${dirs.length} 个Worker目录`);

    for (const dir of dirs) {
        const zhFile = path.join(workerDir, dir, `${dir}.zh.ts`);

        if (!fs.existsSync(zhFile)) {
            console.warn(`⚠️  未找到文件: ${zhFile}`);
            continue;
        }

        const content = fs.readFileSync(zhFile, 'utf-8');
        const score = calculateComplexity(content, dir);

        // 提取promptId（假设格式为 id: 'worker-xxx-v1'）
        const idMatch = content.match(/id:\s*['"]([^'"]+)['"]/);
        if (idMatch) {
            workers[idMatch[1]] = score;
        }
    }

    return workers;
}

/**
 * 计算复杂度评分
 */
function calculateComplexity(content, workerName) {
    let score = COMPLEXITY_RULES.baseScore;

    // 1. 检测库依赖
    for (const [lib, weight] of Object.entries(COMPLEXITY_RULES.libraries)) {
        if (content.includes(`import ${lib}`) || content.includes(`from ${lib}`)) {
            score += weight;
        }
    }

    // 2. 检测关键词
    for (const [keyword, weight] of Object.entries(COMPLEXITY_RULES.keywords)) {
        const count = (content.match(new RegExp(keyword.replace('(', '\\('), 'g')) || []).length;
        score += count * weight;
    }

    // 3. 根据Worker类型调整
    if (workerName.includes('dbscan')) score += 30;  // DBSCAN特别慢
    if (workerName.includes('cluster')) score += 20;
    if (workerName.includes('regression')) score += 25;
    if (workerName.includes('decision_tree')) score += 35;
    if (workerName.includes('time_decomposition')) score += 40;

    return Math.min(score, 100);  // 上限100
}

/**
 * 生成评分文件
 */
function generateScoreFile(workers) {
    const sortedWorkers = Object.entries(workers).sort((a, b) => a[1] - b[1]);

    let content = `/**
 * 自动生成的Worker复杂度评分
 * 生成时间: ${new Date().toISOString()}
 * 生成脚本: scripts/generate-complexity-scores.js
 * 
 * ⚠️ 注意：此文件自动生成，请勿手动编辑
 */

export const WORKER_COMPLEXITY_SCORES: Record<string, number> = {\n`;

    for (const [workerId, score] of sortedWorkers) {
        const comment = score >= 60 ? '// 🔴 重量级' : score >= 30 ? '// 🟡 中等' : '// 🟢 轻量级';
        content += `    '${workerId}': ${score},  ${comment}\n`;
    }

    content += `};\n`;

    const outputPath = path.join(__dirname, '../src/utils/insightComplexity.generated.ts');
    fs.writeFileSync(outputPath, content);

    console.log(`\n✅ 生成评分文件: ${outputPath}`);
    console.log(`📊 共 ${sortedWorkers.length} 个Worker`);
    console.log(`\n评分分布:`);
    console.log(`  🟢 轻量级 (< 30): ${sortedWorkers.filter(([_, s]) => s < 30).length}`);
    console.log(`  🟡 中等   (30-59): ${sortedWorkers.filter(([_, s]) => s >= 30 && s < 60).length}`);
    console.log(`  🔴 重量级 (≥ 60): ${sortedWorkers.filter(([_, s]) => s >= 60).length}`);
}

// 执行
console.log('🚀 开始扫描Worker Prompt...\n');
const workers = scanWorkerPrompts();
generateScoreFile(workers);
console.log('\n✨ 完成！');
