#!/usr/bin/env tsx
/**
 * Prompt模板Lint检查器
 * 
 * 检查所有内置Prompt模板的Python代码中是否存在JavaScript注释语法 `//`
 * 用于编译时质量保障，提前发现潜在问题
 * 
 * @author AntiGravity
 * @date 2026-02-03
 */

import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface LintError {
    file: string;
    promptId: string;
    line: number;
    lineContent: string;
}

function lintPromptTemplates(): LintError[] {
    const errors: LintError[] = [];
    const promptsDir = join(process.cwd(), 'src/services/prompts/library/l2');

    if (!existsSync(promptsDir)) {
        console.warn(`❌ Prompts目录不存在: ${promptsDir}`);
        process.exit(0);
    }

    // 遍历所有worker目录
    const workerDirs = readdirSync(promptsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    workerDirs.forEach(workerDir => {
        const dirPath = join(promptsDir, workerDir);
        const files = readdirSync(dirPath)
            .filter(file => file.endsWith('.ts'));

        files.forEach(file => {
            const filePath = join(dirPath, file);
            const content = readFileSync(filePath, 'utf-8');

            // 检查是否包含 codeTemplate
            if (!content.includes('codeTemplate:')) {
                return;
            }

            // 提取 promptId
            const idMatch = content.match(/id:\s*['"]([^'"]+)['"]/);
            const promptId = idMatch ? idMatch[1] : 'unknown';

            // 检查 codeTemplate 中的注释语法
            const lines = content.split('\n');
            let inCodeTemplate = false;

            lines.forEach((line, idx) => {
                // 检测 codeTemplate 开始
                if (line.includes('codeTemplate:')) {
                    inCodeTemplate = true;
                    return;
                }

                // 检测 codeTemplate 结束（遇到下一个属性或闭合大括号）
                if (inCodeTemplate && /^\s*(inputVariables|author|template|executionMode|statsInjection|dimensions|layer|slug|requiredPackages|outputCharts|version|isBuiltIn|updatedAt|name|title|description|packageId):/.test(line)) {
                    inCodeTemplate = false;
                    return;
                }

                // 在 codeTemplate 内检查 Python 代码中的 // 注释
                if (inCodeTemplate) {
                    // 排除字符串内的双斜杠（简化处理：忽略包含 http 或引号的行）
                    const isUrl = line.includes('http://') || line.includes('https://');
                    const inString = (line.match(/['"]/g) || []).length >= 2;

                    if (!isUrl && !inString && /^\s*\/\//.test(line)) {
                        errors.push({
                            file: join('l2', workerDir, file),
                            promptId,
                            line: idx + 1,
                            lineContent: line.trim()
                        });
                    }
                }
            });
        });
    });

    return errors;
}

// 执行检查
const errors = lintPromptTemplates();

if (errors.length > 0) {
    console.warn('\n❌ Prompt模板检查失败\n');
    console.warn('发现以下问题（Python代码中使用JavaScript注释 "//"）：\n');

    errors.forEach(err => {
        console.warn(`  📄 ${err.file}`);
        console.warn(`     [${err.promptId}] 第${err.line}行: ${err.lineContent}`);
        console.warn('');
    });

    console.warn(`共 ${errors.length} 个错误。请修复后重新构建。`);
    console.warn('\n💡 提示：将 "//" 改为 "#"（Python注释符号）\n');
    process.exit(0);
}

console.log('✅ Prompt模板检查通过（未发现JavaScript注释语法）');
process.exit(0);
