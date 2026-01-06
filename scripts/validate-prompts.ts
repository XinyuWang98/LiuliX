#!/usr/bin/env npx ts-node
/**
 * Prompt 模板校验脚本
 * 
 * 功能：
 * 1. 校验 requiredPackages 与 codeTemplate 中实际导入的库是否一致
 * 2. 校验中英文版本的 requiredPackages 是否一致
 * 3. 输出校验报告
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
    type: 'missing' | 'unused' | 'i18n-mismatch';
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
 * 从 TypeScript 文件中提取 requiredPackages 和 codeTemplate
 */
function parsePromptFile(filePath: string): { requiredPackages: string[], codeTemplate: string | null, executionMode: string | null } | null {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');

        // 提取 requiredPackages
        const pkgMatch = content.match(/requiredPackages:\s*\[([^\]]*)\]/);
        const requiredPackages = pkgMatch
            ? pkgMatch[1].split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean)
            : [];

        // 提取 executionMode
        const modeMatch = content.match(/executionMode:\s*['"](\w+)['"]/);
        const executionMode = modeMatch ? modeMatch[1] : null;

        // 提取 codeTemplate
        const templateMatch = content.match(/codeTemplate:\s*`([\s\S]*?)`/);
        const codeTemplate = templateMatch ? templateMatch[1] : null;

        return { requiredPackages, codeTemplate, executionMode };
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

    // 检查缺失声明（使用了但未声明）
    for (const pkg of imported) {
        if (!declared.has(pkg)) {
            errors.push({
                file: filePath,
                type: 'missing',
                message: `缺失依赖: ${pkg} 在代码中使用但未在 requiredPackages 声明`
            });
        }
    }

    // 检查冗余声明（声明了但未使用）
    for (const pkg of declared) {
        if (!imported.has(pkg)) {
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

export { validateAllPrompts, extractImports, validatePackageConsistency, validateI18nConsistency };
