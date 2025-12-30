import { useState, useEffect, useRef } from 'react';
import { useI18n } from '../../../contexts/I18nContext';
import { SimpleSuggestion } from '../types/cleaning.types';
import { logger } from '../../../utils/logger';

// 导入拆分的模块
import {
    fetchDataForAnalysis,
    generateRuleBasedSuggestions,
    triggerAISuggestionGeneration,
    generateMetadataFallbackSuggestion
} from '../utils/suggestionGenerators';
import {
    mergeSuggestions,
    filterDuplicateAISuggestions,
    mapAISuggestions,
    isCacheFresh
} from '../utils/suggestionFilters';

/**
 * 建议生成Hook
 * 职责：状态管理、触发生成、缓存管理
 * 核心业务逻辑已拆分到 utils/suggestionGenerators 和 utils/suggestionFilters
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
    const [aiProgressMsg, setAiProgressMsg] = useState('');
    const [aiGenerated, setAiGenerated] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 提取关键属性作为独立依赖
    const tableName = activeFile?.data?.tableName;
    const rowCount = activeFile?.data?.rowCount;

    // 防止重复生成
    const loadedOnceRef = useRef<{ [key: string]: boolean }>({});
    const abortControllerRef = useRef<AbortController | null>(null);
    const lastProcessedTableNameRef = useRef<string | undefined>(undefined);

    useEffect(() => {
        logger.log('数据清洗', 'useEffect触发', {
            data: {
                activeFileId: activeFile?.id,
                tableName: tableName,
                lastProcessedTableName: lastProcessedTableNameRef.current,
                tableNameChanged: tableName !== lastProcessedTableNameRef.current,
                hasData: !!activeFile?.data,
                rowCount: rowCount,
                aiSuggestionsCount: aiSuggestions?.length || 0
            }
        });

        const generateSuggestions = async () => {
            setLoading(true);
            setError(null);

            if (!activeFile || !activeFile.data) {
                logger.log('数据清洗', '跳过：无activeFile或数据');
                setSuggestions([]);
                setLoading(false);
                return;
            }

            // 1. 获取数据
            let data: any[] = [];
            try {
                data = await fetchDataForAnalysis(activeFile);
            } catch (err: any) {
                if (err.message === 'FALLBACK_TO_METADATA') {
                    // 使用元数据降级方案
                    const fallbackSuggestions = generateMetadataFallbackSuggestion(activeFile, t);
                    setSuggestions(fallbackSuggestions);
                    setLoading(false);
                    return;
                }
                setSuggestions([]);
                setLoading(false);
                return;
            }

            if (data.length === 0) {
                setSuggestions([]);
                setLoading(false);
                return;
            }

            // 2. 生成规则建议
            const ruleSuggestions = generateRuleBasedSuggestions(data, t);

            // 3. 处理AI建议（三种来源：prop、缓存、自动生成）
            let aiMapped: SimpleSuggestion[] = [];
            let shouldKeepLoading = false;

            // 3.1 优先使用传入的prop AI建议
            if (aiSuggestions && aiSuggestions.length > 0) {
                logger.log('数据清洗', '使用手动触发的AI建议');
                // 🐛 DEBUG: 检查原始数据
                logger.log('数据清洗', '手动触发 - 原始数据source', {
                    data: aiSuggestions.slice(0, 2).map(s => ({ id: s.id, source: (s as any).source }))
                });
                aiMapped = mapAISuggestions(aiSuggestions);
                // 🐛 DEBUG: 检查映射后数据
                logger.log('数据清洗', '手动触发 - 映射后source', {
                    data: aiMapped.slice(0, 2).map(s => ({ id: s.id, source: s.source }))
                });
            }
            // 3.2 尝试读取缓存
            else if (activeFile?.analysisCache?.cleaning?.suggestions?.length > 0 &&
                !activeFile.analysisCache.cleaning.isStale) {

                if (isCacheFresh(activeFile.analysisCache.cleaning.timestamp)) {
                    logger.log('数据清洗', '命中AI建议缓存');
                    // 🐛 DEBUG: 检查缓存数据
                    logger.log('数据清洗', '缓存 - 原始数据source', {
                        data: activeFile.analysisCache.cleaning.suggestions.slice(0, 2).map((s: any) => ({ id: s.id, source: s.source }))
                    });
                    aiMapped = mapAISuggestions(activeFile.analysisCache.cleaning.suggestions);
                    // 🐛 DEBUG: 检查映射后数据
                    logger.log('数据清洗', '缓存 - 映射后source', {
                        data: aiMapped.slice(0, 2).map(s => ({ id: s.id, source: s.source }))
                    });
                } else {
                    logger.log('数据清洗', '缓存已过期（>24小时），重新生成');
                    if (activeFile.analysisCache.cleaning) {
                        activeFile.analysisCache.cleaning.isStale = true;
                    }
                }
            }
            // 3.3 自动触发预加载
            else {
                const cacheKey = `${activeFile.id}_${activeFile.data.tableName}`;

                if (onProjectUpdate &&
                    project &&
                    activeFile.data.tableName &&
                    (!activeFile.analysisCache?.cleaning || activeFile.analysisCache.cleaning.isStale === true)) {

                    shouldKeepLoading = true;

                    if (!loadedOnceRef.current[cacheKey]) {
                        logger.log('数据清洗', '触发AI建议自动预加载');
                        loadedOnceRef.current[cacheKey] = true;

                        // 异步执行AI生成
                        (async () => {
                            // 取消之前的请求
                            if (abortControllerRef.current) {
                                abortControllerRef.current.abort();
                            }
                            abortControllerRef.current = new AbortController();

                            try {
                                setLoading(true);

                                const aiResults = await triggerAISuggestionGeneration(
                                    activeFile,
                                    t,
                                    language.name,
                                    abortControllerRef.current.signal,
                                    setAiProgressMsg
                                );

                                if (aiResults.length > 0) {
                                    logger.log('数据清洗', '自动预加载完成', { count: aiResults.length });
                                    // 🐛 DEBUG: 检查自动生成的结果
                                    logger.log('数据清洗', '自动预加载 - aiResults source', {
                                        data: aiResults.slice(0, 2).map(s => ({ id: s.id, source: s.source }))
                                    });
                                    setAiGenerated(true);

                                    // 立即更新UI
                                    setSuggestions(prev => {
                                        const rulesOnly = filterDuplicateAISuggestions(prev);
                                        return mergeSuggestions(aiResults, rulesOnly);
                                    });

                                    // 保存到缓存
                                    const updatedFile = {
                                        ...activeFile,
                                        analysisCache: {
                                            ...activeFile.analysisCache,
                                            cleaning: {
                                                suggestions: aiResults,
                                                status: 'ready',
                                                isStale: false,
                                                generatedAt: Date.now(),
                                                timestamp: Date.now()
                                            }
                                        }
                                    };

                                    const updatedProject = {
                                        ...project,
                                        files: project.files.map((f: any) =>
                                            f.id === activeFile.id ? updatedFile : f
                                        )
                                    };

                                    onProjectUpdate(updatedProject);
                                } else {
                                    setAiGenerated(true);
                                }
                            } catch (err: any) {
                                if (err.name !== 'AbortError') {
                                    console.warn('[建议生成] AI生成失败:', err);
                                }
                            } finally {
                                setLoading(false);
                                setAiProgressMsg('');
                            }
                        })();
                    }
                }
            }

            // 4. 合并并排序建议
            const allSuggestions = mergeSuggestions(aiMapped, ruleSuggestions);
            setSuggestions(allSuggestions);

            // 5. 记录已处理的tableName
            if (activeFile?.data?.tableName) {
                lastProcessedTableNameRef.current = activeFile.data.tableName;
                logger.log('数据清洗', '建议生成完成', {
                    data: {
                        tableName: activeFile.data.tableName,
                        totalSuggestions: allSuggestions.length,
                        aiCount: aiMapped.length,
                        ruleCount: ruleSuggestions.length
                    }
                });
            }

            // 只有当不需要继续等待AI时，才关闭Loading
            if (!shouldKeepLoading) {
                setLoading(false);
            }
        };

        generateSuggestions();

        // Cleanup: 取消未完成的AI请求
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [activeFile?.id, tableName, rowCount, aiSuggestions, t, language.name, cleaningTrigger]);

    // 移除已应用的建议
    const removeSuggestions = (idsToRemove: string[]) => {
        setSuggestions(prev => prev.filter(s => !idsToRemove.includes(s.id)));
    };

    // 手动刷新AI建议
    const refreshAISuggestions = async () => {
        if (!activeFile?.data?.tableName || !onProjectUpdate || !project) return;

        setLoading(true);
        setAiProgressMsg(t('cleaning.processing'));
        setError(null);
        console.log('[建议生成] 手动刷新 AI 建议...');

        try {
            // 创建AbortController（手动刷新也支持取消）
            const controller = new AbortController();

            const aiResults = await triggerAISuggestionGeneration(
                activeFile,
                t,
                language.name,
                controller.signal,
                setAiProgressMsg
            );

            if (aiResults.length > 0) {
                console.log('[建议生成] 刷新完成，获得', aiResults.length, '条AI建议');
                setAiGenerated(true);

                setSuggestions(prev => {
                    const rulesOnly = filterDuplicateAISuggestions(prev);
                    return mergeSuggestions(aiResults, rulesOnly);
                });
            }
        } catch (err: any) {
            console.warn('[建议生成] 刷新失败:', err);
            setError(err.message || 'AI Generation Failed');
        } finally {
            setLoading(false);
            setAiProgressMsg('');
        }
    };

    // 检查是否有AI建议
    const hasAISuggestions = suggestions.some(s => s.id.startsWith('ai_'));

    return {
        suggestions,
        loading,
        aiProgressMsg,
        removeSuggestions,
        refreshAISuggestions,
        hasAISuggestions,
        aiGenerated,
        error
    };
}
