import { DuckDBEngine } from '../../../db/duckdbEngine';
import { SimpleSuggestion } from '../types/cleaning.types';
import { isMissing } from '../utils/dataValidator';
import { generateCleaningSuggestionsV2, getCleaningServiceConfig } from '../../../services/cleaningSuggestionService';
import { logger } from '../../../utils/logger';

// 常量定义
const QUERY_CHUNK_SIZE = 1000;
const CONFIDENCE_HIGH = 0.9;
const CONFIDENCE_MEDIUM = 0.8;
const CONFIDENCE_LOW = 0.7;
const NULL_THRESHOLD_LOW = 30;
const NULL_THRESHOLD_HIGH = 50;
const NULL_THRESHOLD_DROP = 80;
const DUPLICATE_THRESHOLD = 10;

/**
 * 建议生成器模块
 * 职责：从数据源提取数据并生成各类清洗建议
 */

/**
 * 从DuckDB或内存中读取数据
 */
export async function fetchDataForAnalysis(
    activeFile: any,
    t: (key: string, params?: any) => string
): Promise<any[]> {
    let data: any[] = [];

    // 尝试从内存获取数据
    if (activeFile.data.data && Array.isArray(activeFile.data.data) && activeFile.data.data.length > 0) {
        data = activeFile.data.data;
        return data;
    }

    // 从DuckDB读取
    try {
        const engine = DuckDBEngine.getInstance();
        let tableName = activeFile.data.tableName;

        // 验证tableName是否有效
        try {
            await engine.queryChunk(tableName, 0, 1);
            logger.log('数据清洗', 'tableName有效', { data: { tableName } });
            const rows = await engine.queryChunk(tableName, 0, QUERY_CHUNK_SIZE);
            data = rows;
        } catch (tableError: any) {
            // 表不存在，查找最新表
            if (tableError.message?.includes('does not exist')) {
                logger.warn('数据清洗', '缓存tableName失效，查找最新表', { data: { tableName } });

                const tables = await engine.queryChunk('information_schema.tables', 0, 100);
                const latestTable = tables
                    .filter((t: any) => t.table_name && String(t.table_name).startsWith('t_'))
                    .sort((a: any, b: any) => String(b.table_name).localeCompare(String(a.table_name)))[0];

                if (latestTable) {
                    tableName = String(latestTable.table_name);
                    logger.log('数据清洗', '更新为最新表', { data: { tableName } });
                    const rows = await engine.queryChunk(tableName, 0, QUERY_CHUNK_SIZE);
                    data = rows;
                } else {
                    logger.log('数据清洗', '数据表暂未就绪，跳过建议生成');
                    return [];
                }
            } else {
                throw tableError;
            }
        }
    } catch (err: any) {
        if (err.message && (err.message.includes('未找到数据表') || err.message.includes('Calendar Error'))) {
            logger.warn('数据清洗', '等待数据表就绪');
            return [];
        }

        console.error('❌ 从DuckDB读取数据失败:', err);

        // 基于文件元数据生成简化建议
        if (activeFile.data.columns && activeFile.data.columns.length > 0) {
            // 返回空数组，但设置一个特殊标记提示调用者使用简化建议
            throw new Error('FALLBACK_TO_METADATA');
        }

        return [];
    }

    return data;
}

/**
 * 生成基于规则的清洗建议
 */
export function generateRuleBasedSuggestions(
    data: any[],
    t: (key: string, params?: any) => string
): SimpleSuggestion[] {
    if (data.length === 0) return [];

    const firstRow = data[0];
    if (!firstRow || typeof firstRow !== 'object') return [];

    const columns = Object.keys(firstRow);
    const generated: SimpleSuggestion[] = [];

    // 规则1: 检测缺失值
    columns.forEach((col) => {
        const nullCount = data.filter((row: any) => isMissing(row[col])).length;
        const nullPercent = (nullCount / data.length) * 100;

        if (nullPercent >= NULL_THRESHOLD_LOW && nullPercent < NULL_THRESHOLD_HIGH) {
            const val = firstRow[col];
            const isNumber = typeof val === 'number' && !isNaN(val);

            generated.push({
                id: `fill_${col}`,
                label: isNumber ? t('cleaning.suggFillZero', { col }) : t('cleaning.suggFillUnknown', { col }),
                reason: t('cleaning.suggFillReason', { percent: nullPercent.toFixed(1) }),
                confidence: CONFIDENCE_MEDIUM,
                column: col,
                action: 'fill',
                category: 'fill_missing'
            });
        } else if (nullPercent >= NULL_THRESHOLD_HIGH && nullPercent < NULL_THRESHOLD_DROP) {
            generated.push({
                id: `drop_${col}`,
                label: t('cleaning.suggDropColumnSimple', { col }),
                reason: t('cleaning.suggDropReason', { percent: nullPercent.toFixed(1) }),
                confidence: CONFIDENCE_LOW,
                column: col,
                action: 'drop_column',
                category: 'drop_empty_column'
            });
        }
    });

    // 规则2: 检测重复行
    const rowStrings = data.map(row => {
        const sanitized = Object.fromEntries(
            Object.entries(row).map(([k, v]) => [k, typeof v === 'bigint' ? v.toString() : v])
        );
        return JSON.stringify(sanitized);
    });
    const uniqueRows = new Set(rowStrings);
    const dupCount = rowStrings.length - uniqueRows.size;
    const dupPercent = (dupCount / rowStrings.length) * 100;

    if (dupCount > 0) {
        generated.push({
            id: 'dedup',
            label: t('cleaning.suggRemoveDuplicates'),
            reason: t('cleaning.suggDedupReason', { count: dupCount, percent: dupPercent.toFixed(1) }),
            confidence: dupPercent > DUPLICATE_THRESHOLD ? CONFIDENCE_HIGH : CONFIDENCE_LOW,
            action: 'dedup',
            category: 'deduplication'
        });
    }

    return generated;
}

/**
 * 触发AI建议生成（异步）
 */
export async function triggerAISuggestionGeneration(
    activeFile: any,
    t: (key: string, params?: any) => string,
    language: string,
    abortSignal: AbortSignal,
    setAiProgressMsg: (msg: string) => void
): Promise<SimpleSuggestion[]> {
    try {
        setAiProgressMsg(t('cleaning.processing'));

        const duckdb = DuckDBEngine.getInstance();
        const stats = await duckdb.getColumnStats(activeFile.data.tableName);

        // 若activeFile.data.columns为空，从stats构建
        const columns = (activeFile.data.columns && activeFile.data.columns.length > 0)
            ? activeFile.data.columns
            : stats.map(s => ({ name: s.name, type: s.type }));

        const aiResults = await generateCleaningSuggestionsV2(
            activeFile.data.tableName,
            columns,
            stats,
            t,
            duckdb,
            (msg) => setAiProgressMsg(msg),
            undefined,
            abortSignal,
            language,
            getCleaningServiceConfig()
        );

        if (aiResults && aiResults.length > 0) {
            logger.log('数据清洗', 'AI建议生成完成', { count: aiResults.length });

            return aiResults.map((s: any) => ({
                id: s.id.startsWith('ai_') ? s.id : `ai_${s.id}`,
                label: s.label,
                reason: s.reason,
                confidence: s.confidence || CONFIDENCE_MEDIUM,
                action: s.action || 'normalize',
                category: s.category || 'normalize',
                column: s.column,
                sql: s.sql,
                expectedImpact: s.expectedImpact,
                dryRunStatus: s.dryRunStatus
            }));
        }

        return [];
    } catch (err: any) {
        if (err.name === 'AbortError') {
            logger.log('数据清洗', 'AI请求已取消');
        } else {
            console.warn('[建议生成] AI生成失败 (静默忽略):', err);
        }
        return [];
    }
}

/**
 * 生成简化的元数据建议（数据读取失败时的降级方案）
 */
export function generateMetadataFallbackSuggestion(
    activeFile: any,
    t: (key: string, params?: any) => string
): SimpleSuggestion[] {
    return [{
        id: 'check_data',
        label: t('cleaning.checkDataQuality'),
        reason: t('cleaning.largeFileHint', { size: (activeFile.data.fileSize / 1024 / 1024).toFixed(1) }),
        confidence: CONFIDENCE_MEDIUM,
        action: 'dedup',
        category: 'experimental'
    }];
}
