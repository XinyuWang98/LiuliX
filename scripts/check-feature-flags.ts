#!/usr/bin/env npx tsx
/**
 * Feature Flags 自动检测脚本
 * 
 * 功能：
 * 1. 扫描所有Feature Flags定义
 * 2. 检测每个Flag的使用情况
 * 3. 生成清理建议报告
 * 
 * 用法：npm run check:flags
 * 
 * @author Antigravity Agent
 * @date 2026-01-08
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// ============================================
// 类型定义
// ============================================

interface FlagDefinition {
    name: string;
    value: boolean | string;
    source: 'config' | 'utils';
    filePath: string;
    lineNumber: number;
    comment?: string;
}

interface FlagUsage {
    filePath: string;
    lineNumber: number;
    lineContent: string;
}

interface FlagReport {
    flag: FlagDefinition;
    usages: FlagUsage[];
    status: 'active' | 'unused' | 'deprecated';
    recommendation: 'keep' | 'archive' | 'cleanup';
    reason?: string;
}

// ============================================
// 配置
// ============================================

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(PROJECT_ROOT, 'src');

const FLAG_SOURCES = [
    { path: 'src/config/featureFlags.ts', type: 'config' as const },
    { path: 'src/utils/featureFlags.ts', type: 'utils' as const },
];

// ============================================
// 主逻辑
// ============================================

function main() {
    console.log('\n🔍 Feature Flags 使用情况检测\n');
    console.log('='.repeat(60));

    // Step 1: 收集所有Flag定义
    const allFlags = collectFlagDefinitions();
    console.log(`\n📋 发现 ${allFlags.length} 个 Feature Flags 定义\n`);

    // Step 2: 检测每个Flag的使用情况
    const reports: FlagReport[] = [];

    for (const flag of allFlags) {
        const usages = findFlagUsages(flag.name);
        const report = generateReport(flag, usages);
        reports.push(report);
    }

    // Step 3: 输出报告
    printReport(reports);

    // Step 4: 输出清理建议
    printRecommendations(reports);

    console.log('\n' + '='.repeat(60));
    console.log('✅ 检测完成\n');
}

// ============================================
// 收集Flag定义
// ============================================

function collectFlagDefinitions(): FlagDefinition[] {
    const flags: FlagDefinition[] = [];

    for (const source of FLAG_SOURCES) {
        const fullPath = path.join(PROJECT_ROOT, source.path);

        if (!fs.existsSync(fullPath)) {
            console.warn(`⚠️ 文件不存在: ${source.path}`);
            continue;
        }

        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        // 解析Flag定义
        const flagRegex = /^\s*(\w+):\s*(true|false|import\.meta\.env\.[^,]+)/;
        let currentComment = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // 收集注释
            if (line.includes('/**') || line.includes('*')) {
                const commentMatch = line.match(/\*\s*(.+)/);
                if (commentMatch) {
                    currentComment = commentMatch[1].trim();
                }
            }

            // 匹配Flag定义
            const match = line.match(flagRegex);
            if (match) {
                const [, name, valueStr] = match;

                // 解析值
                let value: boolean | string;
                if (valueStr === 'true') value = true;
                else if (valueStr === 'false') value = false;
                else value = valueStr;

                flags.push({
                    name,
                    value,
                    source: source.type,
                    filePath: source.path,
                    lineNumber: i + 1,
                    comment: currentComment || undefined,
                });

                currentComment = '';
            }
        }
    }

    return flags;
}

// ============================================
// 查找Flag使用
// ============================================

function findFlagUsages(flagName: string): FlagUsage[] {
    const usages: FlagUsage[] = [];

    try {
        // 直接搜索Flag名称（更可靠）
        const result = execSync(
            `grep -rn "${flagName}" "${SRC_DIR}" --include="*.ts" --include="*.tsx" 2>/dev/null || true`,
            { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
        );

        for (const line of result.split('\n').filter(Boolean)) {
            const match = line.match(/^(.+):(\d+):(.+)$/);
            if (match) {
                const [, filePath, lineNum, content] = match;

                // 排除定义文件本身
                if (filePath.includes('featureFlags.ts')) continue;
                // 排除脚本本身
                if (filePath.includes('check-feature-flags')) continue;

                // 避免重复
                const exists = usages.some(u =>
                    u.filePath === filePath && u.lineNumber === parseInt(lineNum)
                );

                if (!exists) {
                    usages.push({
                        filePath: path.relative(PROJECT_ROOT, filePath),
                        lineNumber: parseInt(lineNum),
                        lineContent: content.trim(),
                    });
                }
            }
        }
    } catch (error) {
        console.error(`❌ 搜索 ${flagName} 时出错:`, error);
    }

    return usages;
}

// ============================================
// 生成报告
// ============================================

function generateReport(flag: FlagDefinition, usages: FlagUsage[]): FlagReport {
    const isUnused = usages.length === 0;
    const isDeprecated = flag.comment?.includes('@deprecated') || flag.comment?.includes('已废弃');

    let status: FlagReport['status'];
    let recommendation: FlagReport['recommendation'];
    let reason: string | undefined;

    if (isDeprecated) {
        status = 'deprecated';
        recommendation = 'cleanup';
        reason = '已标记为废弃';
    } else if (isUnused) {
        status = 'unused';
        recommendation = 'archive';
        reason = '代码中未检测到使用';
    } else {
        status = 'active';
        recommendation = 'keep';
        reason = `在 ${usages.length} 处使用中`;
    }

    return { flag, usages, status, recommendation, reason };
}

// ============================================
// 输出报告
// ============================================

function printReport(reports: FlagReport[]) {
    const active = reports.filter(r => r.status === 'active');
    const unused = reports.filter(r => r.status === 'unused');
    const deprecated = reports.filter(r => r.status === 'deprecated');

    // 使用中的Flags
    if (active.length > 0) {
        console.log(`\n✅ 使用中 (${active.length}个)`);
        console.log('-'.repeat(40));

        for (const r of active) {
            console.log(`  • ${r.flag.name}`);
            console.log(`    来源: ${r.flag.source} | 值: ${r.flag.value}`);
            console.log(`    使用: ${r.usages.length}处`);

            for (const usage of r.usages.slice(0, 3)) {
                console.log(`      - ${usage.filePath}:${usage.lineNumber}`);
            }

            if (r.usages.length > 3) {
                console.log(`      ... 还有 ${r.usages.length - 3} 处`);
            }
        }
    }

    // 未使用的Flags
    if (unused.length > 0) {
        console.log(`\n⚠️ 未使用 (${unused.length}个)`);
        console.log('-'.repeat(40));

        for (const r of unused) {
            console.log(`  • ${r.flag.name}`);
            console.log(`    来源: ${r.flag.source} | 值: ${r.flag.value}`);
            console.log(`    说明: ${r.flag.comment || '无'}`);
            console.log(`    建议: 📦 归档`);
        }
    }

    // 已废弃的Flags
    if (deprecated.length > 0) {
        console.log(`\n🗑️ 已废弃 (${deprecated.length}个)`);
        console.log('-'.repeat(40));

        for (const r of deprecated) {
            console.log(`  • ${r.flag.name}`);
            console.log(`    说明: ${r.flag.comment || '无'}`);
            console.log(`    建议: 🗑️ 立即清理`);
        }
    }
}

// ============================================
// 输出清理建议
// ============================================

function printRecommendations(reports: FlagReport[]) {
    const toCleanup = reports.filter(r => r.recommendation === 'cleanup');
    const toArchive = reports.filter(r => r.recommendation === 'archive');

    if (toCleanup.length === 0 && toArchive.length === 0) {
        console.log('\n🎉 所有 Feature Flags 状态良好！');
        return;
    }

    console.log('\n' + '='.repeat(60));
    console.log('💡 清理建议');
    console.log('='.repeat(60));

    if (toCleanup.length > 0) {
        console.log(`\n🗑️ 立即清理 (${toCleanup.length}个):`);
        for (const r of toCleanup) {
            console.log(`  • ${r.flag.name} - ${r.reason}`);
        }
        console.log('\n  命令: npm run flags:cleanup');
    }

    if (toArchive.length > 0) {
        console.log(`\n📦 建议归档 (${toArchive.length}个):`);
        for (const r of toArchive) {
            console.log(`  • ${r.flag.name} - ${r.reason}`);
        }
        console.log('\n  归档后90天未启用将自动进入清理队列');
    }

    // 统计
    console.log('\n' + '-'.repeat(40));
    console.log('📊 统计');
    console.log(`  总计: ${reports.length} 个 Feature Flags`);
    console.log(`  使用中: ${reports.filter(r => r.status === 'active').length}`);
    console.log(`  未使用: ${reports.filter(r => r.status === 'unused').length}`);
    console.log(`  已废弃: ${reports.filter(r => r.status === 'deprecated').length}`);
}

// 运行
main();
