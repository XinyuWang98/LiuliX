#!/usr/bin/env npx ts-node
/**
 * Prompt 模板校验脚本
 * 
 * 功能：
 * 1. 校验 requiredPackages 与 codeTemplate 中实际导入的库是否一致
 * 2. 校验中英文版本的 requiredPackages 是否一致
 * 3. 校验统计值参数是否正确使用 statsInjection（禁止重复计算）
 * 4. 输出校验报告
 * 
 * 使用方式：
 * npx ts-node scripts/validate-prompts.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PROMPTS_DIR = path.join(PROJECT_ROOT, 'src', 'services', 'prompts', 'library');

// 库名映射：Python 别名 -> 包名
const ALIAS_MAPPING: Record<string, string> = {
    'plt': 'matplotlib',
    'pd': 'pandas',
    'np': 'numpy',
    'sns': 'seaborn',
    'sklearn': 'scikit-learn',
    'sm': 'statsmodels'
};

// 内置库（无需声明）
const BUILTIN_PACKAGES = new Set([
    'base64', 'io', 'json', 'datetime', 'collections',
    'math', 'os', 'sys', 're', 'typing', 'functools'
]);

interface ValidationError {
    file: string;
    type: 'missing' | 'unused' | 'i18n-mismatch' | 'stats-duplicate' | 'stats-missing-injection';
    message: string;
}

interface ValidationResult {
    errors: ValidationError[];
    warnings: ValidationError[];
    passed: number;
    failed: number;
}

/**
 * 从代码模板中提取导入的库
 */
function extractImports(code: string): Set<string> {
    const imports = new Set<string>();

    // 匹配 import xxx 和 from xxx import
    const importRegex = /^(?:import\s+(\w+)|from\s+(\w+)(?:\.\w+)*\s+import)/gm;

    let match;
    while ((match = importRegex.exec(code)) !== null) {
        const pkg = match[1] || match[2];

        // 跳过内置库
        if (BUILTIN_PACKAGES.has(pkg)) continue;

        // 映射别名到实际包名
        const mappedPkg = ALIAS_MAPPING[pkg] || pkg;
        imports.add(mappedPkg);
    }

    return imports;
}

/**
 * 检测代码中的隐式依赖 (运行时依赖)
 * 例如: df.plot(kind='density') 隐式依赖 scipy
 */
function detectImplicitDependencies(code: string): Set<string> {
    const implicit = new Set<string>();

    // Pandas 绘图的隐式依赖
    const pandasPlotPatterns = [
        { pattern: /\.plot\s*\(\s*kind\s*=\s*['"](?:density|kde)['"]/g, package: 'scipy', reason: 'pandas.plot(kind="density/kde")需要scipy.stats.gaussian_kde' },
        { pattern: /\.plot\.(?:kde|density)\s*\(/g, package: 'scipy', reason: 'pandas.plot.kde()需要scipy' }
    ];

    for (const { pattern, package: pkg, reason } of pandasPlotPatterns) {
        if (pattern.test(code)) {
            implicit.add(pkg);
            console.log(`      💡 检测到隐式依赖: ${pkg} (${reason})`);
        }
    }

    // Matplotlib seaborn样式可能需要seaborn
    if (/plt\.style\.use\s*\(\s*['"]seaborn/.test(code)) {
        implicit.add('seaborn');
        console.log(`      💡 检测到隐式依赖: seaborn (matplotlib样式)`);
    }

    return implicit;
}

// ========== 统计值参数检测（v2.3 新增）==========

/**
 * 应该通过 statsInjection 注入的统计参数列表
 * 这些值必须从 DuckDB ColumnStats 提取，禁止在代码中重复计算
 */
const STATS_PARAMETERS = [
    'median', 'mean', 'mode', 'std', 'variance',
    'q1', 'q3', 'iqr', 'min', 'max',
    'percentile', 'quantile', 'skew', 'kurtosis'
];

/**
 * 检测代码中是否重复计算统计值
 * 
 * @param code - Python 代码模板
 * @param executionMode - 执行模式（CODE_GEN/TEMPLATE_FILL）
 * @returns 检测到的重复计算统计值
 */
function detectStatsCalculation(code: string, executionMode: string | null): Set<string> {
    const calculated = new Set<string>();

    // ⚠️ 重要：只跳过已废弃的模板
    // 所有新模板（无论 SQL 还是 Python）都必须从 DuckDB 获取统计值
    // ⚠️ 完整豁免规则：排除窗口统计、分组聚合、时间重采样、累积函数

    /**
     * 构建豁免正则：排除以下场景
     * 1. 窗口函数: rolling()/expanding()/ewm()
     * 2. 分组聚合: groupby()/pivot_table()
     * 3. 时间重采样: resample()
     * 4. 累积函数: cumsum()/cumprod()/cummax()/cummin()
     * 
     * v2.3 新增检测：mean, cv, kurtosis
     */
    const buildExemptPattern = (statMethod: string) => {
        const exemptContexts = [
            'rolling\\([^)]*\\)',     // 窗口函数
            'expanding\\([^)]*\\)',   // 扩展窗口
            'ewm\\([^)]*\\)',         // 指数加权
            'groupby\\([^)]*\\)',     // 分组聚合
            'resample\\([^)]*\\)',    // 时间重采样
        ].join('|');

        // 使用负向后视断言：(?<!...) 确保前面没有这些豁免场景
        // [^)]*\\) 匹配从方法调用到右括号的部分
        return new RegExp(
            `(?<!(?:${exemptContexts})[^)]*\\))\\.${statMethod}\\s*\\(`,
            'gi'
        );
    };

    const patterns = [
        // Pandas 方法调用（豁免窗口/分组/重采样）
        { regex: buildExemptPattern('median'), type: 'pandas_method' },
        { regex: buildExemptPattern('mean'), type: 'pandas_method' },        // 🆕 v2.3
        { regex: buildExemptPattern('mode'), type: 'pandas_method' },
        { regex: buildExemptPattern('std'), type: 'pandas_method' },
        { regex: buildExemptPattern('var'), type: 'pandas_method' },
        { regex: buildExemptPattern('quantile'), type: 'pandas_method' },
        { regex: buildExemptPattern('min'), type: 'pandas_method' },
        { regex: buildExemptPattern('max'), type: 'pandas_method' },
        { regex: buildExemptPattern('skew'), type: 'pandas_method' },        // 🆕 v2.3
        { regex: buildExemptPattern('kurtosis'), type: 'pandas_method' },    // 🆕 v2.3

        // NumPy 函数调用: np.median(arr), np.mean(arr)
        { regex: /np\.(median|mean|std|var|percentile|quantile|min|max)\s*\(/gi, type: 'numpy_function' },

        // IQR 计算模式: q1 = df.quantile(0.25), iqr = q3 - q1
        { regex: /\b(q1|q3|iqr)\s*=.*quantile\s*\(/gi, type: 'iqr_calculation' },

        // Statistics 模块: statistics.median(data)
        { regex: /statistics\.(median|mean|mode|stdev|variance)\s*\(/gi, type: 'statistics_module' }
    ];

    for (const { regex, type } of patterns) {
        let match;
        while ((match = regex.exec(code)) !== null) {
            const stat = match[1]?.toLowerCase();
            if (stat && STATS_PARAMETERS.includes(stat)) {
                calculated.add(stat);
                console.log(`      ⚠️  检测到重复计算: ${stat} (${type})`);
            }
        }
    }

    return calculated;
}

/**
 * 从文件中提取 statsInjection 配置
 * 
 * @param content - 文件内容
 * @returns statsInjection 字段中配置的参数名列表
 */
function extractStatsInjectionParams(content: string): Set<string> {
    const params = new Set<string>();

    // 匹配 statsInjection: { median_value: 'median', ... }
    const injectionMatch = content.match(/statsInjection:\s*\{([^}]+)\}/s);
    if (!injectionMatch) return params;

    const block = injectionMatch[1];

    // 提取所有键值对
    const paramRegex = /(\w+):\s*(?:'(\w+)'|\(.*?\))/g;
    let match;
    while ((match = paramRegex.exec(block)) !== null) {
        params.add(match[1]); // 参数名，如 median_value
    }

    return params;
}

/**
 * 校验统计值参数是否正确使用 statsInjection
 * 
 * 核心规则（v2.3 强化）：
 * 1. 所有模板（SQL + Python）如果涉及统计值，必须从 DuckDB 获取
 * 2. 禁止在代码中重复计算统计值（应通过 statsInjection 注入或作为参数传入）
 * 3. 只豁免 deprecated 模板
 */
function validateStatsInjection(
    filePath: string,
    fileContent: string,
    executionMode: string | null,
    sqlTemplate: string | null,
    codeTemplate: string | null,
    inputVariables: string[]
): ValidationError[] {
    const errors: ValidationError[] = [];

    // 只跳过已废弃的模板
    if (fileContent.includes('deprecated: true')) {
        return errors;
    }

    // 提取 statsInjection 配置
    const injectedParams = extractStatsInjectionParams(fileContent);

    // 检查 1: SQL 模板中使用统计参数但未配置 statsInjection
    if (sqlTemplate && executionMode === 'TEMPLATE_FILL') {
        const statsParamsInSQL = inputVariables.filter(v =>
            STATS_PARAMETERS.some(stat => v.toLowerCase().includes(stat))
        );

        if (statsParamsInSQL.length > 0 && injectedParams.size === 0) {
            errors.push({
                file: filePath,
                type: 'stats-missing-injection',
                message: `SQL 模板使用统计参数 [${statsParamsInSQL.join(', ')}]，但未配置 statsInjection。统计值必须从 DuckDB 注入，不得在代码中重复计算`
            });
        }
    }

    // 检查 2: 代码模板中重复计算统计值（重要：所有模板都检查，包括 CODE_GEN）
    if (codeTemplate) {
        const calculatedStats = detectStatsCalculation(codeTemplate, executionMode);

        if (calculatedStats.size > 0) {
            const statsList = Array.from(calculatedStats).join(', ');
            errors.push({
                file: filePath,
                type: 'stats-duplicate',
                message: `代码模板中检测到重复计算统计值 [${statsList}]。所有统计值必须从 DuckDB 获取（通过 statsInjection 或 inputVariables 传入），禁止在任何代码中重复计算`
            });
        }
    }

    return errors;
}
/**
 * 从 TypeScript 文件中提取 requiredPackages、codeTemplate、sqlTemplate 等字段
 */
function parsePromptFile(filePath: string): {
    requiredPackages: string[],
    codeTemplate: string | null,
    sqlTemplate: string | null,
    executionMode: string | null,
    inputVariables: string[],
    fileContent: string
} | null {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');

        // 提取 requiredPackages
        const pkgMatch = content.match(/requiredPackages:\s*\[([^\]]*)\]/);
        const requiredPackages = pkgMatch
            ? pkgMatch[1].split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean)
            : [];

        // 提取 executionMode
        const modeMatch = content.match(/executionMode:\s*['"](CODE_GEN|TEMPLATE_FILL)['"]/);
        const executionMode = modeMatch ? modeMatch[1] : null;

        // 提取 codeTemplate
        const codeTemplateMatch = content.match(/codeTemplate:\s*`([\s\S]*?)`/);
        const codeTemplate = codeTemplateMatch ? codeTemplateMatch[1] : null;

        // 提取 sqlTemplate
        const sqlTemplateMatch = content.match(/sqlTemplate:\s*`([\s\S]*?)`/);
        const sqlTemplate = sqlTemplateMatch ? sqlTemplateMatch[1] : null;

        // 提取 inputVariables
        const inputVarsMatch = content.match(/inputVariables:\s*\[([^\]]*)\]/);
        const inputVariables = inputVarsMatch
            ? inputVarsMatch[1].split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean)
            : [];

        return {
            requiredPackages,
            codeTemplate,
            sqlTemplate,
            executionMode,
            inputVariables,
            fileContent: content
        };
    } catch (e) {
        console.error(`读取文件失败: ${filePath}`, e);
        return null;
    }
}

/**
 * 校验单个 Prompt 的包一致性
 */
function validatePackageConsistency(filePath: string, requiredPackages: string[], codeTemplate: string): ValidationError[] {
    const errors: ValidationError[] = [];

    const declared = new Set(requiredPackages);
    const imported = extractImports(codeTemplate);
    const implicit = detectImplicitDependencies(codeTemplate); // ✅ 检测隐式依赖

    // 合并显式import和隐式依赖
    const allRequired = new Set([...imported, ...implicit]);

    // 检查缺失声明（使用了但未声明）
    for (const pkg of allRequired) {
        if (!declared.has(pkg)) {
            const source = imported.has(pkg) ? '显式import' : '隐式依赖';
            errors.push({
                file: filePath,
                type: 'missing',
                message: `缺失依赖 [${source}]: ${pkg} 在代码中使用但未在 requiredPackages 声明`
            });
        }
    }

    // 检查冗余声明（声明了但未使用）
    for (const pkg of declared) {
        if (!allRequired.has(pkg)) {
            errors.push({
                file: filePath,
                type: 'unused',
                message: `冗余依赖: ${pkg} 已声明但未在代码中使用`
            });
        }
    }

    return errors;
}

/**
 * 校验中英文版本的 requiredPackages 是否一致
 */
function validateI18nConsistency(zhFile: string, enFile: string): ValidationError[] {
    const errors: ValidationError[] = [];

    const zhData = parsePromptFile(zhFile);
    const enData = parsePromptFile(enFile);

    if (!zhData || !enData) return errors;

    const zhPkgs = (zhData.requiredPackages || []).sort().join(',');
    const enPkgs = (enData.requiredPackages || []).sort().join(',');

    if (zhPkgs !== enPkgs) {
        errors.push({
            file: zhFile,
            type: 'i18n-mismatch',
            message: `中英文版本 requiredPackages 不一致: ZH=[${zhPkgs}] EN=[${enPkgs}]`
        });
    }

    return errors;
}

/**
 * 递归扫描目录，找到所有 .zh.ts 和 .en.ts 文件
 */
function findPromptFiles(dir: string): { zh: string[], en: string[] } {
    const result = { zh: [] as string[], en: [] as string[] };

    function scan(currentDir: string) {
        const items = fs.readdirSync(currentDir, { withFileTypes: true });

        for (const item of items) {
            const fullPath = path.join(currentDir, item.name);

            if (item.isDirectory()) {
                scan(fullPath);
            } else if (item.isFile()) {
                if (item.name.endsWith('.zh.ts')) {
                    result.zh.push(fullPath);
                } else if (item.name.endsWith('.en.ts')) {
                    result.en.push(fullPath);
                }
            }
        }
    }

    scan(dir);
    return result;
}

/**
 * 主校验函数
 */
function validateAllPrompts(): ValidationResult {
    const result: ValidationResult = {
        errors: [],
        warnings: [],
        passed: 0,
        failed: 0
    };

    console.log('🔍 开始扫描 Prompt 文件...\n');

    const files = findPromptFiles(PROMPTS_DIR);
    console.log(`找到 ${files.zh.length} 个中文版本, ${files.en.length} 个英文版本\n`);

    // 校验每个 Prompt 文件
    const allFiles = [...files.zh, ...files.en];

    for (const filePath of allFiles) {
        const relativePath = path.relative(PROJECT_ROOT, filePath);
        const data = parsePromptFile(filePath);

        if (!data) {
            result.errors.push({
                file: relativePath,
                type: 'missing',
                message: '无法解析文件'
            });
            result.failed++;
            continue;
        }

        // CODE_GEN 模式跳过 codeTemplate 校验
        if (data.executionMode === 'CODE_GEN' || !data.codeTemplate) {
            result.passed++;
            continue;
        }

        // 校验包一致性
        const pkgErrors = validatePackageConsistency(relativePath, data.requiredPackages, data.codeTemplate);

        if (pkgErrors.length > 0) {
            // 将 unused 类型作为警告，missing 类型作为错误
            for (const err of pkgErrors) {
                if (err.type === 'unused') {
                    result.warnings.push(err);
                } else {
                    result.errors.push(err);
                }
            }
            result.failed++;
        } else {
            result.passed++;
        }

        // ✅ v2.3 新增：校验统计值参数
        const statsErrors = validateStatsInjection(
            relativePath,
            data.fileContent,
            data.executionMode,
            data.sqlTemplate,
            data.codeTemplate,
            data.inputVariables
        );

        if (statsErrors.length > 0) {
            result.errors.push(...statsErrors);
            // 如果之前通过，现在标记为失败
            if (pkgErrors.length === 0) {
                result.passed--;
                result.failed++;
            }
        }
    }

    // 校验中英文一致性
    console.log('\n🌐 校验中英文版本一致性...\n');

    for (const zhFile of files.zh) {
        const baseName = path.basename(zhFile).replace('.zh.ts', '');
        const enFile = files.en.find(f => path.basename(f).replace('.en.ts', '') === baseName);

        if (enFile) {
            const i18nErrors = validateI18nConsistency(zhFile, enFile);
            result.errors.push(...i18nErrors);
        }
    }

    return result;
}

/**
 * 格式化输出结果
 */
function printResult(result: ValidationResult) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 校验报告');
    console.log('='.repeat(60) + '\n');

    if (result.errors.length > 0) {
        console.log('❌ 错误 (' + result.errors.length + '):\n');
        for (const err of result.errors) {
            console.log(`  📁 ${err.file}`);
            console.log(`     ${err.message}\n`);
        }
    }

    if (result.warnings.length > 0) {
        console.log('⚠️ 警告 (' + result.warnings.length + '):\n');
        for (const warn of result.warnings) {
            console.log(`  📁 ${warn.file}`);
            console.log(`     ${warn.message}\n`);
        }
    }

    console.log('='.repeat(60));
    console.log(`✅ 通过: ${result.passed}`);
    console.log(`❌ 失败: ${result.failed}`);
    console.log(`⚠️ 警告: ${result.warnings.length}`);
    console.log('='.repeat(60) + '\n');

    if (result.errors.length > 0) {
        console.log('💡 提示: 请修复上述错误后重新运行校验');
        process.exit(1);
    } else {
        console.log('🎉 所有 Prompt 模板校验通过！');
        process.exit(0);
    }
}

// 主入口
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const result = validateAllPrompts();
    printResult(result);
}

export {
    validateAllPrompts,
    extractImports,
    validatePackageConsistency,
    validateI18nConsistency,
    validateStatsInjection,
    detectStatsCalculation,
    extractStatsInjectionParams
};
