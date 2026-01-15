/**
 * 洞察刷新 Hook
 * 负责：Strict Mode防重、tableName变化检测、智能刷新判断
 */
import { useEffect, useRef } from 'react';
import { logger } from '../utils/logger';

interface UseInsightRefreshOptions {
    hypothesesLength: number;
    tableName?: string;
    insightCache?: {
        isStale?: boolean;
        status?: string;
    };
    onRefresh: () => void;
}

export function useInsightRefresh({
    hypothesesLength,
    tableName,
    insightCache,
    onRefresh,
}: UseInsightRefreshOptions) {
    // Strict Mode 防重
    const loadedOnceRef = useRef(false);
    const prevTableNameRef = useRef<string | undefined>(undefined);  // 不使用初始tableName，确保首次变化能被检测
    const timerRef = useRef<NodeJS.Timeout | null>(null);  // 用于500ms延迟，确保表创建完成

    const prevDepsRef = useRef({
        hypotheses: hypothesesLength,
        isStale: insightCache?.isStale
    });

    useEffect(() => {
        logger.log('AI洞察', 'InsightChainFlow挂载/更新', { data: { hypothesesCount: hypothesesLength } });

        // tableName变化时重置loadedOnceRef（表重建后重新加载）
        const tableNameChanged = prevTableNameRef.current !== tableName;
        if (tableNameChanged) {
            logger.log('AI洞察', 'tableName变化，重置状态', {
                data: { prev: prevTableNameRef.current, current: tableName }
            });

            const wasUndefined = prevTableNameRef.current === undefined;
            const nowHasValue = tableName !== undefined;

            prevTableNameRef.current = tableName;
            loadedOnceRef.current = false; // 重置，允许重新加载

            // 清理旧timer
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }

            // ✅ 优化：如果从undefined变为有效值，立即触发（不再延迟500ms）
            // 理由：AI 调用只需 DuckDB 数据，不需要等待 Pyodide/UI 初始化
            if (wasUndefined && nowHasValue) {
                logger.log('AI洞察', '检测到tableName从空变为有效，立即触发加载（并发优化）');
                onRefresh(); // 立即触发，不再延迟
                return;
            }

            // 🔥 如果tableName变为undefined，也提前退出
            if (!nowHasValue) {
                logger.log('AI洞察', 'tableName变为undefined，跳过刷新');
                return;
            }
        }

        // 判断是否需要刷新
        const shouldRefresh =
            (hypothesesLength === 0 ||  // 场景1：无缓存假设
                (insightCache?.isStale === true)) &&  // 场景2：数据已清洗，标记为过时
            tableName !== undefined;  // ⚠️ 关键：只有tableName有效时才刷新

        // 防重复：检查status不为pending（但如果是Stale状态，说明数据变了，必须强制刷新）
        const canExecute = (insightCache?.isStale === true) || (insightCache?.status !== 'pending');

        // 🔍 调试日志
        logger.log('AI洞察', '刷新条件检查', {
            data: {
                shouldRefresh,
                canExecute,
                hypothesesLength,
                tableName,
                isStale: insightCache?.isStale,
                status: insightCache?.status
            }
        });

        if (shouldRefresh && canExecute) {
            // 检测依赖是否真正变化
            const depsChanged =
                prevDepsRef.current.hypotheses !== hypothesesLength ||
                prevDepsRef.current.isStale !== insightCache?.isStale;

            // 🆕 修复：只在依赖未变且已加载时跳过（防止Strict Mode + 重复状态更新）
            if (!depsChanged && loadedOnceRef.current) {
                logger.warn('AI洞察', 'Strict Mode或重复状态更新已拦截');
                return;
            }

            logger.log('AI洞察', '触发刷新', {
                data: { tableName, hypothesesCount: hypothesesLength, hasExistingTimer: !!timerRef.current }
            });

            // 清理旧timer
            if (timerRef.current) {
                logger.log('AI洞察', '清理旧timer');
                clearTimeout(timerRef.current);
            }

            loadedOnceRef.current = true;
            prevDepsRef.current = {
                hypotheses: hypothesesLength,
                isStale: insightCache?.isStale
            };

            // ✅ 优化：立即触发（移除延迟），实现与 Pyodide 并发
            logger.log('AI洞察', '立即触发刷新（并发优化）');
            onRefresh(); // 立即执行，不再延迟

            return () => {
                if (timerRef.current) {
                    logger.log('AI洞察', 'useEffect cleanup - 清理timer');
                    clearTimeout(timerRef.current);
                    timerRef.current = null;
                }
            };
        } else if (shouldRefresh && !canExecute) {
            logger.warn('AI洞察', '刷新被阻止（防重复）', { data: { status: insightCache?.status } });
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        hypothesesLength,
        insightCache?.isStale,
        insightCache?.status,
        tableName
    ]);
}
