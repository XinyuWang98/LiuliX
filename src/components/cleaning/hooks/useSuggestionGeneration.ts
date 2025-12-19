import { useState, useEffect } from 'react';
import { useI18n } from '../../../contexts/I18nContext';
import { SimpleSuggestion } from '../types/cleaning.types';
import { isMissing } from '../utils/dataValidator';

/**
 * 建议生成Hook
 * 职责：从数据源获取数据并生成清洗建议
 */
export function useSuggestionGeneration(
    activeFile: any,
    cleaningTrigger: number,
    aiSuggestions?: any[]
) {
    const { t } = useI18n();
    const [suggestions, setSuggestions] = useState<SimpleSuggestion[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const generateSuggestions = async () => {
            setLoading(true);

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
                    const { DuckDBEngine } = await import('../../../db/duckdbEngine');
                    const engine = DuckDBEngine.getInstance();

                    let tableName = activeFile.data.tableName;

                    // 🟢 P1修复：先验证当前tableName是否有效
                    try {
                        await engine.queryChunk(tableName, 0, 1);
                        // tableName有效，继续使用
                        console.log('[建议生成] ✅ tableName有效:', tableName);
                        const rows = await engine.queryChunk(tableName, 0, 1000);
                        data = rows;
                    } catch (tableError: any) {
                        // 🟢 表不存在，查找最新表
                        if (tableError.message?.includes('does not exist')) {
                            console.log('[建议生成] ⚠️ 缓存tableName失效，查找最新表:', tableName);

                            const tables = await engine.queryChunk('information_schema.tables', 0, 100);
                            const latestTable = tables
                                .filter((t: any) => t.table_name && String(t.table_name).startsWith('t_'))
                                .sort((a: any, b: any) => String(b.table_name).localeCompare(String(a.table_name)))[0];

                            if (latestTable) {
                                tableName = String(latestTable.table_name);
                                console.log('[建议生成] 🔄 更新为最新表:', tableName);
                                const rows = await engine.queryChunk(tableName, 0, 1000);
                                data = rows;
                            } else {
                                console.log('[建议生成] ⏳ 数据表暂未就绪，跳过建议生成');
                                setLoading(false);
                                return;
                            }
                        } else {
                            throw tableError;
                        }
                    }
                } catch (err: any) {
                    if (err.message && (err.message.includes('未找到数据表') || err.message.includes('Calendar Error'))) {
                        console.log('⚠️ 等待数据表就绪...');
                        setLoading(false);
                        return;
                    }

                    console.error('❌ 从DuckDB读取数据失败:', err);

                    // 基于文件元数据生成简化建议
                    if (activeFile.data.columns && activeFile.data.columns.length > 0) {
                        const generated: SimpleSuggestion[] = [{
                            id: 'check_data',
                            label: '检查数据质量',
                            reason: `文件较大（${(activeFile.data.fileSize / 1024 / 1024).toFixed(1)} MB），建议先检查数据质量`,
                            confidence: 0.8,
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
                    generated.push({
                        id: `fill_${col}`,
                        label: t('cleaning.suggFillMissing', { col }),
                        reason: t('cleaning.suggFillReason', { percent: nullPercent.toFixed(1) }),
                        confidence: 0.8,
                        column: col,
                        action: 'fill',
                        category: 'fill_missing'
                    });
                } else if (nullPercent >= NULL_THRESHOLD_HIGH && nullPercent < NULL_THRESHOLD_DROP) {
                    generated.push({
                        id: `drop_${col}`,
                        label: t('cleaning.suggDropColumn', { col }),
                        reason: t('cleaning.suggDropReason', { percent: nullPercent.toFixed(1) }),
                        confidence: 0.7,
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
                    confidence: dupPercent > DUPLICATE_THRESHOLD ? 0.9 : 0.7,
                    action: 'dedup',
                    category: 'deduplication'
                });
            }

            // 合并AI建议和规则建议
            const aiMapped = (aiSuggestions || []).map((s: any) => ({
                id: `ai_${s.id || Math.random()}`,
                label: s.label,
                reason: s.reason,
                confidence: s.confidence || 0.8,
                action: s.action || 'normalize',
                category: s.category || 'normalize',
                column: s.column,
                sql: s.sql,
                expectedImpact: s.expectedImpact,
                dryRunStatus: s.dryRunStatus
            }));

            const allSuggestions = [...aiMapped, ...generated];

            setSuggestions(allSuggestions.sort((a, b) => {
                // AI建议优先
                if (a.id.startsWith('ai_') && !b.id.startsWith('ai_')) return -1;
                if (!a.id.startsWith('ai_') && b.id.startsWith('ai_')) return 1;
                return b.confidence - a.confidence;
            }));

            setLoading(false);
        };

        generateSuggestions();
    }, [activeFile?.id, cleaningTrigger, aiSuggestions, t]);

    // 移除已应用的建议
    const removeSuggestions = (idsToRemove: string[]) => {
        setSuggestions(prev => prev.filter(s => !idsToRemove.includes(s.id)));
    };

    return { suggestions, loading, removeSuggestions };
}
