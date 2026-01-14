
import fs from 'fs';
import path from 'path';
import { logger } from '../src/utils/logger.ts';
import { zhCN } from '../src/locales/zh-CN/index.ts';
import { enUS } from '../src/locales/en-US/index.ts';

// 递归查找 src 目录下所有的 .ts 和 .tsx 文件，排除 locales 和 types
function getAllFiles(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            // 忽略特定目录: locales, types, tests, demo, prompts(内容本身)
            // 使用 filePath 检查更安全，防止递归遗漏
            if (file === 'locales' || file === '__tests__' || file === 'types' || file === 'demo' || file === 'prompts') {
                return;
            }
            getAllFiles(filePath, fileList);
        } else {
            // 扫描 .ts, .tsx 文件，排除 .d.ts 和测试文件
            if (/\.(ts|tsx)$/.test(file) && !file.endsWith('.d.ts') && !file.includes('.test.') && !file.includes('.spec.')) {
                // 豁免特定文件
                if (file === 'LiuliShowcase.tsx') return;

                // 二次检查路径（防止漏网之鱼）
                if (filePath.includes('/prompts/') || filePath.includes('/demo/') || filePath.includes('locales')) {
                    return;
                }

                fileList.push(filePath);
            }
        }
    });
    return fileList;
}

// 移除代码中的注释 (简单版)
function stripComments(content: string): string {
    // 移除 /* ... */
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    // 移除 // ...
    content = content.replace(/\/\/.*$/gm, '');
    return content;
}

// 检查硬编码中文
function checkHardcodedChinese(filePath: string): { line: number, content: string }[] {
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const lines = rawContent.split('\n');
    const results: { line: number, content: string }[] = [];

    // 过滤模式
    const ignorePatterns = [
        /console\.(log|error|warn|info|debug)/,
        /logger\./,
        /throw new Error/,
        /new Error\(/,
        /toast\.error/,
        /^\s*\/\//, // 行注释
        /^\s*\*/,   // 块注释行
        /^\s*#/,    // Python风格注释
        /^import /,
        /^export /,
        /from ['"]/,
        /description:\s*['"`]/, // Tool definitions
        /reason:\s*['"`]/,      // AI Logic reasons
        /message:\s*['"`]/,     // Backend/Internal messages
        /TODO/,
        /FIXME/
    ];

    let inBlockComment = false;

    lines.forEach((line, index) => {
        let cleanLine = line;

        // 处理块注释状态
        if (inBlockComment) {
            if (cleanLine.includes('*/')) {
                cleanLine = cleanLine.substring(cleanLine.indexOf('*/') + 2);
                inBlockComment = false;
            } else {
                cleanLine = '';
            }
        }

        if (!inBlockComment) {
            if (cleanLine.includes('/*')) {
                const start = cleanLine.indexOf('/*');
                if (cleanLine.includes('*/')) {
                    const end = cleanLine.lastIndexOf('*/');
                    cleanLine = cleanLine.substring(0, start) + cleanLine.substring(end + 2);
                } else {
                    cleanLine = cleanLine.substring(0, start);
                    inBlockComment = true;
                }
            }
            const lineCommentIndex = cleanLine.indexOf('//');
            if (lineCommentIndex !== -1) {
                if (!cleanLine.includes('://')) {
                    cleanLine = cleanLine.substring(0, lineCommentIndex);
                }
            }
        }

        // 核心过滤
        if (ignorePatterns.some(p => p.test(line))) return;

        // 匹配中文
        if (/[\u4e00-\u9fa5]/.test(cleanLine)) {
            if (/'[a-z-]+':\s*['"][\u4e00-\u9fa5]+['"]/.test(cleanLine)) return;
            results.push({
                line: index + 1,
                content: line.trim()
            });
        }
    });

    return results;
}

// 检查硬编码英文 (JSX 文本和常见 UI 属性)
function checkHardcodedEnglish(filePath: string): { line: number, content: string, type: string }[] {
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const lines = rawContent.split('\n');
    const results: { line: number, content: string, type: string }[] = [];

    // 过滤模式
    const ignorePatterns = [
        /^\s*import /,
        /^\s*export /,
        /console\.(log|error|warn|info|debug)/,
        /logger\./,
        /throw new Error/,
        /new Error\(/,
        /\/\//,
        /^\s*\*/
    ];

    lines.forEach((line, index) => {
        if (ignorePatterns.some(p => p.test(line))) return;

        // 2. 检查 JSX 文本节点: >Some Text<
        const jsxTextRegex = />([^<>{}\n]+)</g;
        let match;
        jsxTextRegex.lastIndex = 0;

        while ((match = jsxTextRegex.exec(line)) !== null) {
            const text = match[1].trim();
            // 启发式：至少包含一个字母，长度 > 2，不全是符号
            // 排除纯数字、纯符号
            if (/[a-zA-Z]/.test(text) && text.length > 2 && !/^{.+}$/.test(text)) {
                if (text === 'Promise') continue;
                results.push({
                    line: index + 1,
                    content: text,
                    type: 'JSX文本'
                });
            }
        }

        // 3. 检查 UI 属性
        const attrRegex = /\b(title|placeholder|alt|aria-label|label)=(['"])(.*?)\2/g;
        attrRegex.lastIndex = 0;

        while ((match = attrRegex.exec(line)) !== null) {
            const attrName = match[1];
            const text = match[3];

            if (/[a-zA-Z]/.test(text) && text.length > 3) {
                if (/^[a-z]+$/.test(text)) continue;
                if (!text.includes(' ') && text.includes('_')) continue;

                results.push({
                    line: index + 1,
                    content: `${attrName}="${text}"`,
                    type: 'UI属性'
                });
            }
        }
    });

    return results;
}

// 递归构建 map<Value, Key>
function getReverseLocaleMap(obj: any, prefix = ''): Map<string, string> {
    const map = new Map<string, string>();

    function traverse(current: any, p: string) {
        for (const k in current) {
            const v = current[k];
            const nextKey = p ? `${p}.${k}` : k;
            if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
                traverse(v, nextKey);
            } else {
                if (typeof v === 'string') {
                    map.set(v.trim(), nextKey);
                }
            }
        }
    }

    traverse(obj, prefix);
    return map;
}

async function main() {
    const args = process.argv.slice(2);
    const checkEnglish = args.includes('--english');
    const generateReport = true;

    logger.log('系统', `🔍 开始硬编码检测 (Strict Mode)...`);

    const zhReverseMap = getReverseLocaleMap(zhCN.translations);
    const enReverseMap = getReverseLocaleMap(enUS.translations);
    logger.log('系统', `📖 已加载语言包索引: ZH(${zhReverseMap.size}) / EN(${enReverseMap.size})`);

    const srcDir = path.resolve(process.cwd(), 'src');
    const files = getAllFiles(srcDir);

    logger.log('系统', `📂 扫描目录: ${srcDir}`);

    const allIssues: {
        file: string,
        line: number,
        content: string,
        type: string,
        suggestedKey?: string
    }[] = [];

    files.forEach(file => {
        const relativePath = path.relative(process.cwd(), file);

        // 3. AI 逻辑/基础设施文件豁免 (No-Go List)
        const excludedFiles = [
            'src/services/skills/definitions.ts',  // Tool descriptions
            'src/services/skills/registry.ts',     // Registry logic
            'src/services/GeminiService.ts',       // Prompts
            'src/utils/dataSanitizer.ts',          // Regex & Internal logic
            'src/workers/pyodide/worker.ts',       // Python worker
            'src/adapters/web/pyodideEnhancerAdapter.ts', // Adapter logic
            'src/utils/fallbackTemplates.ts',      // Python Templates
            'src/utils/pythonCodeSanitizer.ts',    // Code Fix logic
            'src/utils/pythonCodeValidator.ts',     // Validator messages
            'src/utils/insightGenerator.ts',        // Prompt templates
            'src/utils/logCapture.ts'               // Log export format
        ];

        if (excludedFiles.some(f => relativePath.endsWith(f) || relativePath.includes(f))) {
            return;
        }

        // 中文检测
        const zhIssues = checkHardcodedChinese(file);
        zhIssues.forEach(issue => {
            const matchKey = zhReverseMap.get(issue.content.replace(/['"]/g, '').trim());
            allIssues.push({
                file: relativePath,
                line: issue.line,
                content: issue.content,
                type: '中文',
                suggestedKey: matchKey
            });
        });

        // 英文检测
        if (checkEnglish) {
            const enIssues = checkHardcodedEnglish(file);
            enIssues.forEach(issue => {
                let cleanContent = issue.content;
                if (issue.content.includes('=')) {
                    cleanContent = issue.content.split('=')[1].replace(/['"]/g, '');
                }
                cleanContent = cleanContent.trim();

                const matchKey = enReverseMap.get(cleanContent);

                allIssues.push({
                    file: relativePath,
                    line: issue.line,
                    content: issue.content,
                    type: `英文 (${issue.type})`,
                    suggestedKey: matchKey
                });
            });
        }
    });

    // 控制台输出概要
    console.log('\n--- 📊 检测概要 ---');
    const filesCount = new Set(allIssues.map(i => i.file)).size;
    const matchedCount = allIssues.filter(i => i.suggestedKey).length;

    logger.warn('系统', `共发现 ${allIssues.length} 处潜在硬编码 (Strict过滤)。`);
    if (matchedCount > 0) {
        logger.log('系统', `其中 ${matchedCount} 处已存在对应翻译 Key。`);
    }

    if (generateReport && allIssues.length > 0) {
        const reportPath = path.resolve(process.cwd(), 'docs/04-技术专题/172-专题-硬编码文本检测报告.md');
        const timestamp = new Date().toLocaleString('zh-CN');

        let mdContent = `# 硬编码文本检测报告 (Strict)\n\n`;
        mdContent += `> 生成时间: ${timestamp}\n`;
        mdContent += `> 检测范围: src (Strictly excluded: demo, prompts, locales, tests, LiuliShowcase)\n`;
        mdContent += `> 过滤规则: console.*, Error, import/export, 纯逻辑 Prompt\n\n`;
        mdContent += `## 📊 概览\n\n`;
        mdContent += `- **总计发现**: ${allIssues.length} 处\n`;
        mdContent += `- **可直接替换**: ${matchedCount} 处 (已存在 Key)\n`;
        mdContent += `- **涉及文件**: ${filesCount} 个\n\n`;

        mdContent += `## 📝 详细清单\n\n`;
        mdContent += `| 文件 | 行号 | 类型 | 内容 | ✅ 建议替换 Key |\n`;
        mdContent += `|---|---|---|---|---|\n`;

        let currentFile = '';
        allIssues.forEach(issue => {
            const fileName = issue.file === currentFile ? '"' : `**${issue.file}**`;
            currentFile = issue.file;
            const keyDisplay = issue.suggestedKey ? `\`${issue.suggestedKey}\`` : '-';
            const safeContent = issue.content.replace(/\|/g, '\\|').replace(/</g, '&lt;').replace(/>/g, '&gt;');

            mdContent += `| ${fileName} | ${issue.line} | ${issue.type} | ${safeContent} | ${keyDisplay} |\n`;
        });

        const docDir = path.dirname(reportPath);
        if (!fs.existsSync(docDir)) {
            fs.mkdirSync(docDir, { recursive: true });
        }

        fs.writeFileSync(reportPath, mdContent);
        logger.log('系统', `📄 报告已生成: ${reportPath}`);
    } else {
        logger.log('系统', '✅ 未发现问题或无需生成报告。');
    }
}

main().catch(console.error);
