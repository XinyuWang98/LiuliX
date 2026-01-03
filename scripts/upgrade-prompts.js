#!/usr/bin/env node
/**
 * Prompt 批量升级脚本
 * 
 * 功能：
 * 1. 自动分析 Prompt 的 codeTemplate，提取 Python import 语句
 * 2. 推断所需的 Python 包 (requiredPackages)
 * 3. 推断所属能力包 (packageId)
 * 4. 推断输出图表类型 (outputCharts)
 * 5. 批量更新所有 Prompt 文件
 * 
 * 用途：
 * - Phase 2: 批量升级现有 Prompt
 * - 未来: 用户自定义 Prompt 时自动识别依赖
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========== 配置 ==========

// Python 包名映射（import 语句 → PyPI 包名）
const PYTHON_PACKAGE_MAP = {
    'pandas': 'pandas',
    'numpy': 'numpy',
    'matplotlib': 'matplotlib',
    'sklearn': 'scikit-learn',
    'statsmodels': 'statsmodels',
    'scipy': 'scipy',
    'seaborn': 'seaborn',
    'jieba': 'jieba',
    'wordcloud': 'wordcloud'
};

// 包分类规则（Python 包 → 能力包 ID）
const PACKAGE_CATEGORY_MAP = {
    'scikit-learn': 'sklearn',
    'sklearn': 'sklearn',
    'statsmodels': 'statsmodels',
    'jieba': 'nlp',
    'wordcloud': 'nlp',
    'default': 'basic'  // 默认归入基础包
};

// 图表类型推断规则（关键词 → 图表类型）
const CHART_TYPE_KEYWORDS = {
    'hist': 'histogram',
    'bar': 'bar',
    'scatter': 'scatter',
    'plot': 'line',
    'box': 'box',
    'heatmap': 'heatmap',
    'pie': 'pie',
    'violin': 'violin'
};

// ========== 核心函数 ==========

/**
 * 从 Python 代码中提取 import 语句
 */
function extractImports(codeTemplate) {
    if (!codeTemplate) return [];

    const imports = new Set();
    const lines = codeTemplate.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();

        // 匹配: import xxx
        const importMatch = trimmed.match(/^import\s+(\w+)/);
        if (importMatch) {
            imports.add(importMatch[1]);
            continue;
        }

        // 匹配: from xxx import yyy
        const fromMatch = trimmed.match(/^from\s+(\w+)/);
        if (fromMatch) {
            imports.add(fromMatch[1]);
            continue;
        }

        // 匹配: from xxx.yyy import zzz (取顶级包名)
        const fromSubMatch = trimmed.match(/^from\s+(\w+)\.\w+/);
        if (fromSubMatch) {
            imports.add(fromSubMatch[1]);
        }
    }

    return Array.from(imports);
}

/**
 * 将 import 包名转换为 PyPI 包名
 */
function importsToPyPIPackages(imports) {
    const packages = new Set();

    for (const imp of imports) {
        const pypiPkg = PYTHON_PACKAGE_MAP[imp];
        if (pypiPkg) {
            packages.add(pypiPkg);
        }
    }

    return Array.from(packages).sort();
}

/**
 * 推断所属能力包 ID
 */
function inferPackageId(requiredPackages) {
    for (const pkg of requiredPackages) {
        const category = PACKAGE_CATEGORY_MAP[pkg];
        if (category && category !== 'basic') {
            return category;  // 优先返回非basic的包
        }
    }
    return 'basic';  // 默认basic
}

/**
 * 从代码中推断输出图表类型
 */
function inferOutputCharts(codeTemplate, title, description) {
    if (!codeTemplate) return ['chart'];  // 默认

    const charts = new Set();
    const text = (codeTemplate + ' ' + title + ' ' + description).toLowerCase();

    for (const [keyword, chartType] of Object.entries(CHART_TYPE_KEYWORDS)) {
        if (text.includes(keyword)) {
            charts.add(chartType);
        }
    }

    return charts.size > 0 ? Array.from(charts) : ['chart'];
}

/**
 * 分析单个 Prompt 文件
 */
function analyzePromptFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');

    // 简单正则提取（假设格式规范）
    const idMatch = content.match(/id:\s*['"]([^'"]+)['"]/);
    const titleMatch = content.match(/title:\s*['"]([^'"]+)['"]/);
    const descMatch = content.match(/description:\s*['"]([^'"]+)['"]/);
    const codeTemplateMatch = content.match(/codeTemplate:\s*`([^`]*)`/s);

    if (!idMatch) {
        console.warn(`  ⚠️  未找到 id 字段，跳过: ${path.basename(filePath)}`);
        return null;
    }

    const id = idMatch[1];
    const title = titleMatch ? titleMatch[1] : '';
    const description = descMatch ? descMatch[1] : '';
    const codeTemplate = codeTemplateMatch ? codeTemplateMatch[1] : '';

    // 提取 import 语句
    const imports = extractImports(codeTemplate);
    const requiredPackages = importsToPyPIPackages(imports);

    // 推断能力包 ID
    const packageId = inferPackageId(requiredPackages);

    // 推断图表类型
    const outputCharts = inferOutputCharts(codeTemplate, title, description);

    return {
        id,
        slug: id,  // slug 与 id 相同
        packageId,
        requiredPackages,
        outputCharts
    };
}

/**
 * 更新 Prompt 文件
 */
function updatePromptFile(filePath, metadata) {
    let content = fs.readFileSync(filePath, 'utf-8');

    // 检查是否已有配置（避免重复添加）
    if (content.includes('// 能力包配置')) {
        console.log(`  ⏭️  已存在配置，跳过: ${path.basename(filePath)}`);
        return false;
    }

    // 找到 description 字段的位置
    const descMatch = content.match(/(description:\s*['"][^'"]+['"],?\s*)/);
    if (!descMatch) {
        console.warn(`  ⚠️  未找到 description 字段，跳过: ${path.basename(filePath)}`);
        return false;
    }

    // 构建新配置块
    const configBlock = `
    // 能力包配置 (v2.1)
    slug: '${metadata.slug}',
    packageId: '${metadata.packageId}',
    requiredPackages: [${metadata.requiredPackages.map(p => `'${p}'`).join(', ')}],
    outputCharts: [${metadata.outputCharts.map(c => `'${c}'`).join(', ')}],
`;

    // 在 description 后插入配置块
    content = content.replace(
        descMatch[0],
        descMatch[0] + '\n' + configBlock
    );

    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
}

// ========== 主流程 ==========

function main() {
    console.log('🚀 Prompt 批量升级脚本启动\n');

    const promptDir = path.join(__dirname, '../src/services/prompts/library/l2');

    if (!fs.existsSync(promptDir)) {
        console.error(`❌ 目录不存在: ${promptDir}`);
        process.exit(1);
    }

    const files = fs.readdirSync(promptDir)
        .filter(f => f.endsWith('.ts') && f.startsWith('worker_'))
        .map(f => path.join(promptDir, f));

    console.log(`📂 找到 ${files.length} 个 Prompt 文件\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const file of files) {
        const filename = path.basename(file);
        console.log(`📄 处理: ${filename}`);

        try {
            const metadata = analyzePromptFile(file);

            if (!metadata) {
                skipCount++;
                continue;
            }

            console.log(`  ✅ 分析结果:`);
            console.log(`     - packageId: ${metadata.packageId}`);
            console.log(`     - requiredPackages: [${metadata.requiredPackages.join(', ')}]`);
            console.log(`     - outputCharts: [${metadata.outputCharts.join(', ')}]`);

            const updated = updatePromptFile(file, metadata);

            if (updated) {
                successCount++;
                console.log(`  💾 已更新\n`);
            } else {
                skipCount++;
                console.log();
            }

        } catch (error) {
            console.error(`  ❌ 错误: ${error.message}\n`);
            errorCount++;
        }
    }

    console.log('===============================');
    console.log(`✅ 成功: ${successCount} 个`);
    console.log(`⏭️  跳过: ${skipCount} 个`);
    console.log(`❌ 失败: ${errorCount} 个`);
    console.log('===============================\n');

    if (errorCount === 0) {
        console.log('🎉 批量升级完成！');
    } else {
        console.log('⚠️  部分文件升级失败，请检查日志');
        process.exit(1);
    }
}

// 执行
main();

// 导出函数供其他模块使用
export {
    extractImports,
    importsToPyPIPackages,
    inferPackageId,
    inferOutputCharts,
    analyzePromptFile
};
