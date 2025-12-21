/**
 * 洞察刷新 Hook
 * 负责：Strict Mode防重、tableName变化检测、智能刷新判断
 */
import { useEffect, useRef } from 'react';

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

    const prevDepsRef = useRef({
        hypotheses: hypothesesLength,
        isStale: insightCache?.isStale
    });

    useEffect(() => {
        console.log('🔍 InsightChainFlow mounted/updated, hypotheses.length:', hypothesesLength);

        // tableName变化时重置loadedOnceRef（表重建后重新加载）
        if (prevTableNameRef.current !== tableName) {
            console.log('[洞察链] 📌 tableName变化，重置状态:', {
                旧表: prevTableNameRef.current,
                新表: tableName
            });
            loadedOnceRef.current = false;
            prevTableNameRef.current = tableName;
        }

        // 判断是否需要刷新
        const 需要刷新 =
            hypothesesLength === 0 ||  // 场景1：无缓存假设
            (insightCache?.isStale === true);  // 场景2：数据已清洗，标记为过时

        // 防重复：检查status不为pending（避免并发调用）
        const 可以执行 = insightCache?.status !== 'pending';

        if (需要刷新 && 可以执行) {
            // 检测依赖是否真正变化
            const depsChanged =
                prevDepsRef.current.hypotheses !== hypothesesLength ||
                prevDepsRef.current.isStale !== insightCache?.isStale;

            // 仅在Strict Mode双重调用时阻止（依赖未变）
            if (!depsChanged && loadedOnceRef.current) {
                console.log('[InsightChainFlow] ⏭️ Strict Mode重复调用已拦截');
                return;
            }

            console.log('[洞察链] 🔄 触发刷新:', {
                原因: hypothesesLength === 0 ? '无缓存' : 'isStale=true',
                isStale: insightCache?.isStale,
                status: insightCache?.status,
                depsChanged
            });

            loadedOnceRef.current = true;
            prevDepsRef.current = {
                hypotheses: hypothesesLength,
                isStale: insightCache?.isStale
            };

            onRefresh();
        } else if (需要刷新 && !可以执行) {
            console.log('[洞察链] ⏸️ 刷新被阻止（防重复）:', { status: insightCache?.status });
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        hypothesesLength,
        insightCache?.isStale,
        insightCache?.status,
        tableName
    ]);
}
