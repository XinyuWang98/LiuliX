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
    const prevTableNameRef = useRef<string | undefined>(tableName);
    const timerRef = useRef<NodeJS.Timeout | null>(null);  // 🆕 追踪timer，防止Strict Mode清理

    const prevDepsRef = useRef({
        hypotheses: hypothesesLength,
        isStale: insightCache?.isStale
    });

    useEffect(() => {
        logger.log('AI洞察', 'InsightChainFlow挂载/更新', { data: { hypothesesCount: hypothesesLength } });

        // tableName变化时重置loadedOnceRef（表重建后重新加载）
        if (prevTableNameRef.current !== tableName) {
            logger.log('AI洞察', 'tableName变化，重置状态', {
                data: { prev: prevTableNameRef.current, current: tableName }
            });
            loadedOnceRef.current = false;
            prevTableNameRef.current = tableName;
            // 🆕 清理旧timer
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        }

        // 判断是否需要刷新
        const 需要刷新 =
            hypothesesLength === 0 ||  // 场景1：无缓存假设
            (insightCache?.isStale === true);  // 场景2：数据已清洗，标记为过时

        // 防重复：检查status不为pending（但如果是Stale状态，说明数据变了，必须强制刷新）
        const 可以执行 = (insightCache?.isStale === true) || (insightCache?.status !== 'pending');

        if (需要刷新 && 可以执行) {
            // 检测依赖是否真正变化
            const depsChanged =
                prevDepsRef.current.hypotheses !== hypothesesLength ||
                prevDepsRef.current.isStale !== insightCache?.isStale;

            // 🆕 修复：只在依赖未变且已有timer时跳过
            if (!depsChanged && loadedOnceRef.current && timerRef.current) {
                logger.warn('AI洞察', 'Strict Mode重复调用已拦截（timer已设置）');
                return;
            }

            logger.log('AI洞察', '触发刷新', {
                data: { tableName, hypothesesCount: hypothesesLength, hasExistingTimer: !!timerRef.current }
            });

            // 清理旧timer（如果有）
            if (timerRef.current) {
                logger.log('AI洞察', '清理旧timer');
                clearTimeout(timerRef.current);
            }

            loadedOnceRef.current = true;
            prevDepsRef.current = {
                hypotheses: hypothesesLength,
                isStale: insightCache?.isStale
            };

            // ⚡ 延迟 3000ms 触发，确保高优先级的 DataCleaner (数据清洗) 能优先抢占本地模型
            logger.log('AI洞察', '延迟触发刷新 (等待DataCleaner优先)...');
            timerRef.current = setTimeout(() => {
                logger.log('AI洞察', '延迟结束，执行刷新');
                timerRef.current = null;
                onRefresh();
            }, 3000);

            return () => {
                if (timerRef.current) {
                    logger.log('AI洞察', 'useEffect cleanup - 清理timer');
                    clearTimeout(timerRef.current);
                    timerRef.current = null;
                }
            };
        } else if (需要刷新 && !可以执行) {
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
