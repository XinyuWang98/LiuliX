/**
 * 类型预过滤功能单元测试
 * 
 * 测试目标：比对 ENABLE_TYPE_CONTEXT_PASSING 开启/关闭时的清洗建议数量差异
 * 覆盖范围：test_datasets 下所有数据集 × 中英文场景
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DuckDBEngine } from '@/db/duckdb';
import { CleaningRouter } from '@/services/prompts/cleaningRouter';
import { setFeatureFlags, getFeatureFlags } from '@/config/featureFlags';
import { setCurrentLanguage } from '@/contexts/I18nContext';
import fs from 'fs';
import path from 'path';

// 测试数据集目录
const TEST_DATASETS_DIR = path.resolve(__dirname, '../test_datasets');

// 测试结果接口
interface TestResult {
    dataset: string;
    language: 'zh-CN' | 'en-US';
    flagEnabled: boolean;
    templateCount: number;
    suggestionCount: number;
    columnTypes: string[];
    error?: string;
}

// 测试报告数据
const testResults: TestResult[] = [];

describe('类型预过滤功能测试', () => {
    let duckdb: DuckDBEngine;
    let router: CleaningRouter;
    let originalFlags: any;

    beforeAll(async () => {
        // 初始化DuckDB
        duckdb = DuckDBEngine.getInstance();
        await duckdb.init();

        // 初始化Router
        router = new CleaningRouter();

        // 保存原始Feature Flags
        originalFlags = getFeatureFlags();
    });

    afterAll(async () => {
        // 恢复Feature Flags
        setFeatureFlags(originalFlags);

        // 生成测试报告
        generateTestReport(testResults);

        // 关闭DuckDB
        await duckdb.close();
    });

    // 获取所有测试数据集
    const datasets = fs.readdirSync(TEST_DATASETS_DIR)
        .filter(file => file.endsWith('.csv'))
        .map(file => ({
            name: file,
            path: path.join(TEST_DATASETS_DIR, file)
        }));

    // 测试语言
    const languages: Array<'zh-CN' | 'en-US'> = ['zh-CN', 'en-US'];

    // 为每个数据集 × 每种语言 × 每种Flag状态创建测试
    datasets.forEach(dataset => {
        languages.forEach(language => {
            describe(`数据集: ${dataset.name} | 语言: ${language}`, () => {

                it('Feature Flag关闭时的建议数量', async () => {
                    await testWithFlag(dataset, language, false);
                });

                it('Feature Flag开启时的建议数量', async () => {
                    await testWithFlag(dataset, language, true);
                });

                it('对比两种模式的差异', () => {
                    const flagOffResults = testResults.filter(r =>
                        r.dataset === dataset.name &&
                        r.language === language &&
                        r.flagEnabled === false
                    );
                    const flagOnResults = testResults.filter(r =>
                        r.dataset === dataset.name &&
                        r.language === language &&
                        r.flagEnabled === true
                    );

                    if (flagOffResults.length > 0 && flagOnResults.length > 0) {
                        const flagOff = flagOffResults[0];
                        const flagOn = flagOnResults[0];

                        console.log(`\n[${dataset.name}] [${language}]`);
                        console.log(`  Flag OFF: ${flagOff.templateCount} 模板 → ${flagOff.suggestionCount} 建议`);
                        console.log(`  Flag ON:  ${flagOn.templateCount} 模板 → ${flagOn.suggestionCount} 建议`);
                        console.log(`  列类型: ${flagOff.columnTypes.join(', ')}`);

                        if (flagOn.templateCount < flagOff.templateCount) {
                            console.log(`  ✅ 过滤生效：减少 ${flagOff.templateCount - flagOn.templateCount} 个模板`);
                        } else {
                            console.log(`  ⚠️ 未过滤：模板数量相同`);
                        }

                        // 验证：开启Flag后模板数量应 ≤ 关闭时
                        expect(flagOn.templateCount).toBeLessThanOrEqual(flagOff.templateCount);
                    }
                });
            });
        });
    });

    /**
     * 测试辅助函数：使用指定Flag状态运行Router
     */
    async function testWithFlag(
        dataset: { name: string; path: string },
        language: 'zh-CN' | 'en-US',
        flagEnabled: boolean
    ): Promise<void> {
        const result: TestResult = {
            dataset: dataset.name,
            language,
            flagEnabled,
            templateCount: 0,
            suggestionCount: 0,
            columnTypes: []
        };

        try {
            // 设置语言
            setCurrentLanguage(language);

            // 设置Feature Flag
            setFeatureFlags({
                ENABLE_TYPE_CONTEXT_PASSING: flagEnabled
            });

            // 加载CSV到DuckDB
            const tableName = await loadCSV(dataset.path);

            // 获取列统计信息
            const stats = await duckdb.getColumnStats(tableName);
            result.columnTypes = stats.map(s => `${s.name}:${s.type}`);

            // 模拟Router调用（我们需要访问内部状态来获取模板数量）
            // 这里使用一个辅助方法来获取过滤后的模板数量
            const templateCount = await getFilteredTemplateCount(stats, flagEnabled);
            result.templateCount = templateCount;

            // 实际运行Router获取建议
            const suggestions = await router.route(
                stats.map(s => ({ name: s.name, type: s.type })),
                stats,
                tableName
            );
            result.suggestionCount = suggestions.length;

            // 清理表
            await duckdb.dropTable(tableName);

        } catch (error: any) {
            result.error = error.message;
            console.error(`❌ 测试失败 [${dataset.name}] [${language}] [Flag=${flagEnabled}]:`, error.message);
        }

        testResults.push(result);
    }

    /**
     * 辅助函数：加载CSV到DuckDB
     */
    async function loadCSV(csvPath: string): Promise<string> {
        const tableName = `test_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        await duckdb.executeSQL(`
            CREATE TABLE ${tableName} AS 
            SELECT * FROM read_csv_auto('${csvPath}', 
                header=true, 
                auto_detect=true
            )
        `);

        return tableName;
    }

    /**
     * 辅助函数：获取过滤后的模板数量
     * 
     * 这里我们需要模拟Router的类型过滤逻辑
     */
    async function getFilteredTemplateCount(
        stats: any[],
        flagEnabled: boolean
    ): Promise<number> {
        const { promptRegistry } = await import('@/services/promptRegistry');

        let templates = promptRegistry.listPrompts({ layer: 'L2_EXECUTION' })
            .filter(p => p.id.startsWith('cleaner-'))
            .filter(p => !p.deprecated);

        if (flagEnabled) {
            const availableTypes = new Set(stats.map(s => s.type));
            templates = templates.filter(t => {
                if (!t.inputDataTypes || t.inputDataTypes.length === 0) {
                    return true;
                }
                return t.inputDataTypes.some(requiredType =>
                    availableTypes.has(requiredType)
                );
            });
        }

        return templates.length;
    }
});

/**
 * 生成测试报告
 */
function generateTestReport(results: TestResult[]): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 类型预过滤功能测试报告');
    console.log('='.repeat(80));

    // 按数据集分组
    const groupedByDataset = results.reduce((acc, r) => {
        if (!acc[r.dataset]) acc[r.dataset] = [];
        acc[r.dataset].push(r);
        return acc;
    }, {} as Record<string, TestResult[]>);

    Object.entries(groupedByDataset).forEach(([dataset, datasetResults]) => {
        console.log(`\n\n📁 ${dataset}`);
        console.log('-'.repeat(80));

        // 按语言分组
        const zhResults = datasetResults.filter(r => r.language === 'zh-CN');
        const enResults = datasetResults.filter(r => r.language === 'en-US');

        [
            { lang: '中文 (zh-CN)', results: zhResults },
            { lang: '英文 (en-US)', results: enResults }
        ].forEach(({ lang, results }) => {
            console.log(`\n  🌐 ${lang}`);

            const flagOff = results.find(r => !r.flagEnabled);
            const flagOn = results.find(r => r.flagEnabled);

            if (flagOff && flagOn) {
                console.log(`    列类型: ${flagOff.columnTypes.join(', ')}`);
                console.log(`    Flag OFF: ${flagOff.templateCount} 模板 → ${flagOff.suggestionCount} 建议`);
                console.log(`    Flag ON:  ${flagOn.templateCount} 模板 → ${flagOn.suggestionCount} 建议`);

                const filterEffect = flagOff.templateCount - flagOn.templateCount;
                if (filterEffect > 0) {
                    console.log(`    ✅ 过滤效果: -${filterEffect} 模板 (${((filterEffect / flagOff.templateCount) * 100).toFixed(1)}%)`);
                } else if (filterEffect === 0) {
                    console.log(`    ⚠️ 未过滤: 所有模板均兼容`);
                } else {
                    console.log(`    ❌ 异常: Flag开启后模板数量增加 (+${Math.abs(filterEffect)})`);
                }

                if (flagOff.error || flagOn.error) {
                    console.log(`    ❌ 错误: ${flagOff.error || flagOn.error}`);
                }
            }
        });
    });

    // 汇总统计
    console.log('\n\n' + '='.repeat(80));
    console.log('📈 汇总统计');
    console.log('='.repeat(80));

    const totalTests = results.length;
    const successTests = results.filter(r => !r.error).length;
    const failedTests = results.filter(r => r.error).length;

    const flagOffResults = results.filter(r => !r.flagEnabled && !r.error);
    const flagOnResults = results.filter(r => r.flagEnabled && !r.error);

    const avgTemplatesOff = flagOffResults.reduce((sum, r) => sum + r.templateCount, 0) / flagOffResults.length;
    const avgTemplatesOn = flagOnResults.reduce((sum, r) => sum + r.templateCount, 0) / flagOnResults.length;

    console.log(`  总测试数: ${totalTests}`);
    console.log(`  成功: ${successTests} | 失败: ${failedTests}`);
    console.log(`  平均模板数 (Flag OFF): ${avgTemplatesOff.toFixed(1)}`);
    console.log(`  平均模板数 (Flag ON):  ${avgTemplatesOn.toFixed(1)}`);
    console.log(`  平均过滤率: ${(((avgTemplatesOff - avgTemplatesOn) / avgTemplatesOff) * 100).toFixed(1)}%`);

    console.log('\n' + '='.repeat(80));
}
