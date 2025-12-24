import { useState, useEffect, useRef } from 'react';
import { useI18n } from '../../../contexts/I18nContext';
import { SimpleSuggestion } from '../types/cleaning.types';
import { isMissing } from '../utils/dataValidator';
import { generateAICleaningSuggestions } from '../../../services/aiCleaningService';
import { DuckDBEngine } from '../../../db/duckdbEngine';
import { logger } from '../../../utils/logger';

// 常量定义：避免魔法数字
const QUERY_CHUNK_SIZE = 1000;          // DuckDB 查询分页大小
const CONFIDENCE_HIGH = 0.9;             // 高置信度阈值
const CONFIDENCE_MEDIUM = 0.8;           // 中置信度阈值
const CONFIDENCE_LOW = 0.7;              // 低置信度阈值

/**
 * 建议生成Hook
 * 职责：从数据源获取数据并生成清洗建议
 */
export function useSuggestionGeneration(
    activeFile: any,
    cleaningTrigger: number,
    aiSuggestions?: any[],
    onProjectUpdate?: (project: any) => void,
    project?: any
) {
    const { t, language } = useI18n();
    const [suggestions, setSuggestions] = useState<SimpleSuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [aiProgressMsg, setAiProgressMsg] = useState(''); // Real-time AI progress message
    const [aiGenerated, setAiGenerated] = useState(false); // 是否已生成AI建议
    const [error, setError] = useState<string | null>(null);

    // 防止Strict Mode双重调用和重复生成
    const loadedOnceRef = useRef<{ [key: string]: boolean }>({});

    // ✅ P0修复：AbortController用于取消过期的AI请求
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        const generateSuggestions = async () => {
            setLoading(true);
            setError(null);

            if (!activeFile) {
                setSuggestions([]);
                setLoading(false);
                return;
            }

            if (!activeFile.data) {
                setSuggestions([]);
                setLoading(false);
                return;
            }

            let data: any[] = [];

            // 尝试从内存获取数据
            if (activeFile.data.data && Array.isArray(activeFile.data.data) && activeFile.data.data.length > 0) {
                data = activeFile.data.data;
            }
            // 如果内存为空，尝试从DuckDB读取
            else {
                try {
                    // Removed redundant dynamic import
                    const engine = DuckDBEngine.getInstance();

                    let tableName = activeFile.data.tableName;

                    // 🟢 P1修复：先验证当前tableName是否有效
                    try {
                        await engine.queryChunk(tableName, 0, 1);
                        // tableName有效，继续使用
                        logger.log('数据清洗', 'tableName有效', { data: { tableName } });
                        const rows = await engine.queryChunk(tableName, 0, QUERY_CHUNK_SIZE);
                        data = rows;
                    } catch (tableError: any) {
                        // 🟢 表不存在，查找最新表
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
                                setLoading(false);
                                return;
                            }
                        } else {
                            throw tableError;
                        }
                    }
                } catch (err: any) {
                    if (err.message && (err.message.includes('未找到数据表') || err.message.includes('Calendar Error'))) {
                        logger.warn('数据清洗', '等待数据表就绪');
                        setLoading(false);
                        return;
                    }

                    console.error('❌ 从DuckDB读取数据失败:', err);

                    // 基于文件元数据生成简化建议
                    if (activeFile.data.columns && activeFile.data.columns.length > 0) {
                        const generated: SimpleSuggestion[] = [{
                            id: 'check_data',
                            label: t('cleaning.checkDataQuality'),
                            reason: t('cleaning.largeFileHint', { size: (activeFile.data.fileSize / 1024 / 1024).toFixed(1) }),
                            confidence: CONFIDENCE_MEDIUM,
                            action: 'dedup',
                            category: 'experimental'
                        }];

                        setSuggestions(generated);
                        setLoading(false);
                        return;
                    }

                    setSuggestions([]);
                    setLoading(false);
                    return;
                }
            }

            if (data.length === 0) {
                setSuggestions([]);
                setLoading(false);
                return;
            }

            const firstRow = data[0];
            if (!firstRow || typeof firstRow !== 'object') {
                setSuggestions([]);
                setLoading(false);
                return;
            }

            const columns = Object.keys(firstRow);
            const generated: SimpleSuggestion[] = [];

            // 阈值常量
            const NULL_THRESHOLD_LOW = 30;
            const NULL_THRESHOLD_HIGH = 50;
            const NULL_THRESHOLD_DROP = 80;
            const DUPLICATE_THRESHOLD = 10;

            // 规则1: 检测缺失值
            columns.forEach((col) => {
                const nullCount = data.filter((row: any) => isMissing(row[col])).length;
                const nullPercent = (nullCount / data.length) * 100;

                if (nullPercent >= NULL_THRESHOLD_LOW && nullPercent < NULL_THRESHOLD_HIGH) {
                    // 简单的类型推断（实际应使用 DuckDB 元数据）
                    // 假设第一行是非空的来推断类型，或默认为 Unknown
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

            // ------------------------------------------------------------
            // 🟡 AI 建议自动预加载 (Auto-Preload)
            // ------------------------------------------------------------

            // 1. 优先使用传入的 prop AI 建议 (手动触发优先)
            let aiMapped: SimpleSuggestion[] = [];
            let shouldKeepLoading = false;

            if (aiSuggestions && aiSuggestions.length > 0) {
                logger.log('数据清洗', '使用手动触发的AI建议');
                aiMapped = (aiSuggestions || []).map((s: any) => ({
                    id: `ai_${s.id || Math.random()}`,
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
            // 2. 其次尝试读取缓存 (Analysis Cache)
            else if (activeFile?.analysisCache?.cleaning?.suggestions?.length > 0 && !activeFile.analysisCache.cleaning.isStale) {
                logger.log('数据清洗', '命中AI建议缓存');
                const cachedSuggestions = activeFile.analysisCache.cleaning.suggestions;

                aiMapped = cachedSuggestions.map((s: any) => ({
                    ...s,
                    // 确保 ID 格式统一
                    id: s.id.startsWith('ai_') ? s.id : `ai_${s.id}`
                }));
            }
            // 3. 自动触发预加载 (无缓存 or 过期)
            else {

                // 检查是否已经请求过 (防止 Strict Mode 双重调用)
                const cacheKey = `${activeFile.id}_${activeFile.data.tableName}`;

                if (onProjectUpdate &&
                    project &&
                    activeFile.data.tableName &&
                    (!activeFile.analysisCache?.cleaning || activeFile.analysisCache.cleaning.isStale === true)) {

                    // 🚀 保持 Loading 状态，直到 AI 返回
                    shouldKeepLoading = true;
                    // 如果尚未加载过，才触发请求 (或依赖 AbortController 取消前一次)
                    if (!loadedOnceRef.current[cacheKey]) {
                        logger.log('数据清洗', '触发AI建议自动预加载');
                        loadedOnceRef.current[cacheKey] = true;

                        // 异步执行
                        (async () => {
                            // ✅ P0修复：创建新的AbortController
                            // 取消之前的请求 (如果有)
                            if (abortControllerRef.current) {
                                abortControllerRef.current.abort();
                            }
                            abortControllerRef.current = new AbortController();

                            try {
                                setLoading(true); // 确保 Loading UI 显示
                                setAiProgressMsg(t('cleaning.processing')); // 设置初始文案
                                // ✅ P0修复：查询列统计信息
                                const duckdb = DuckDBEngine.getInstance();
                                const stats = await duckdb.getColumnStats(activeFile.data.tableName);

                                // 🚀 修复#19：若activeFile.data.columns为空，从stats构建
                                const columns = (activeFile.data.columns && activeFile.data.columns.length > 0)
                                    ? activeFile.data.columns
                                    : stats.map(s => ({ name: s.name, type: s.type }));

                                // ✅ P0修复：data.columns已包含{name,type}，直接传递
                                const aiResults = await generateAICleaningSuggestions(
                                    activeFile.data.tableName,
                                    columns,
                                    stats, // 传递真实stats
                                    t,
                                    duckdb,
                                    (msg) => setAiProgressMsg(msg), // ✅ 实时更新进度文案
                                    undefined, // onSuggestionUpdate
                                    abortControllerRef.current.signal, // signal ✅
                                    language.name // language
                                );

                                if (aiResults && aiResults.length > 0) {
                                    logger.log('数据清洗', '自动预加载完成', { count: aiResults.length });
                                    setAiGenerated(true);

                                    // 🎯 立即更新 suggestions 状态，让用户看到
                                    const aiMappedNew: SimpleSuggestion[] = aiResults.map((s: any) => ({
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

                                    // 合并到当前建议列表（先显示 AI，后显示规则）
                                    setSuggestions(prev => {
                                        // 过滤掉已存在的 AI 建议，防止重复
                                        const rulesOnly = prev.filter(s => !s.id.startsWith('ai_'));
                                        const merged = [...aiMappedNew, ...rulesOnly];
                                        logger.log('数据清洗', '更新UI', {
                                            data: { aiCount: aiMappedNew.length, ruleCount: rulesOnly.length }
                                        });
                                        return merged;
                                    });

                                    // 同时保存到缓存
                                    const updatedFile = {
                                        ...activeFile,
                                        analysisCache: {
                                            ...activeFile.analysisCache,
                                            cleaning: {
                                                suggestions: aiResults,
                                                status: 'ready',
                                                isStale: false,
                                                generatedAt: Date.now()
                                            }
                                        }
                                    };

                                    const updatedProject = {
                                        ...project,
                                        files: project.files.map((f: any) => f.id === activeFile.id ? updatedFile : f)
                                    };

                                    onProjectUpdate(updatedProject);
                                } else {
                                    // AI 返回空建议 (数据良好) - 也需要设置状态，否则一直 Loading
                                    setAiGenerated(true);
                                }
                            } catch (err: any) {
                                if (err.name === 'AbortError') {
                                    console.log('AI Request Aborted');
                                } else {
                                    console.warn('[建议生成] ⚠️ 自动预加载失败 (静默忽略):', err);
                                }
                            } finally {
                                setLoading(false);
                                setAiProgressMsg(''); // 清除进度文案
                            }
                        })();
                    }
                }
            }

            // 合并AI建议 (Cached or Props) 和规则建议
            const allSuggestions = [...aiMapped, ...generated];

            setSuggestions(allSuggestions.sort((a, b) => {
                // AI建议优先
                if (a.id.startsWith('ai_') && !b.id.startsWith('ai_')) return -1;
                if (!a.id.startsWith('ai_') && b.id.startsWith('ai_')) return 1;
                return b.confidence - a.confidence;
            }));

            // 只有当不需要继续等待AI时，才关闭Loading
            if (!shouldKeepLoading) {
                setLoading(false);
            }
        };

        generateSuggestions();

        // ✅ P0修复：cleanup时取消未完成的AI请求
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                // 不要置空，让后续逻辑处理 AbortError
            }
        };
    }, [activeFile?.id, activeFile?.data?.tableName, cleaningTrigger, aiSuggestions, t, language.name]); // onProjectUpdate 和 project 不放入依赖，避免循环

    // 移除已应用的建议
    const removeSuggestions = (idsToRemove: string[]) => {
        setSuggestions(prev => prev.filter(s => !idsToRemove.includes(s.id)));
    };

    // 手动刷新 AI 建议
    const refreshAISuggestions = async () => {
        if (!activeFile?.data?.tableName || !onProjectUpdate || !project) return;

        setLoading(true);
        setAiProgressMsg(t('cleaning.processing'));
        setError(null);
        console.log('[建议生成] 手动刷新 AI 建议...');

        try {
            // ✅ P0修复：查询列统计信息
            const duckdb = DuckDBEngine.getInstance();
            const stats = await duckdb.getColumnStats(activeFile.data.tableName);

            // 🔍 调试日志：验证stats结果
            console.log('📊 [调试-刷新] stats查询结果:', stats);
            console.log('📊 [调试-刷新] stats长度:', stats.length);
            if (stats.length > 0) {
                console.log('📊 [调试-刷新] 第一个stat:', stats[0]);
            }

            const aiResults = await generateAICleaningSuggestions(
                activeFile.data.tableName,
                activeFile.data.columns, // ✅ 直接使用，不需要map
                stats, // ✅ 传递真实stats
                t,
                duckdb,
                (msg) => setAiProgressMsg(msg), // ✅ 实时更新进度文案
                undefined, // onSuggestionUpdate
                undefined, // signal (Manual refresh doesn't support abort yet, or add AbortController if needed but undefined fixes type error)
                language.name // 🌍 Pass current language
            );

            if (aiResults) {
                console.log('[建议生成] 刷新完成，获得', aiResults.length, '条AI建议');
                setAiGenerated(true);

                if (aiResults.length > 0) {
                    const aiMappedNew: SimpleSuggestion[] = aiResults.map((s: any) => ({
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

                    setSuggestions(prev => {
                        const rulesOnly = prev.filter(s => !s.id.startsWith('ai_'));
                        return [...aiMappedNew, ...rulesOnly];
                    });
                }
            }
        } catch (err: any) {
            console.warn('[建议生成] 刷新失败:', err);
            setError(err.message || 'AI Generation Failed');
        } finally {
            setLoading(false);
            setAiProgressMsg('');
        }
    };

    // 检查是否有 AI 建议
    const hasAISuggestions = suggestions.some(s => s.id.startsWith('ai_'));

    return { suggestions, loading, aiProgressMsg, removeSuggestions, refreshAISuggestions, hasAISuggestions, aiGenerated, error };
}
