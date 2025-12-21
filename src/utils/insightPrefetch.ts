/**
 * 洞察预加载与L1/L3缓存支持
 * 
 * 方案4：并行预加载 + 方案3-L1：精确匹配缓存 + 方案3-L3：增量更新
 */

import { logger } from './logger';
import { ProjectFile } from './projectUtils';
import { generateInsightSuggestions } from './insightGenerator';

const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30分钟缓存有效期

/**
 * L1缓存：精确匹配缓存检查
 * @param file 项目文件
 * @returns 是否有有效缓存
 */
export function hasValidInsightCache(file: ProjectFile): boolean {
    const cache = file.analysisCache?.insight;
    if (!cache || !cache.prefetchedSuggestions) return false;

    // 检查是否过期
    if (cache.isStale) return false;

    // 检查缓存时间
    const now = Date.now();
    const generatedAt = cache.generatedAt || 0;
    if (now - generatedAt > CACHE_EXPIRY_MS) return false;

    return cache.status === 'ready' && cache.prefetchedSuggestions.length > 0;
}

/**
 * 方案4：为文件预加载洞察建议（并行预加载 + L1缓存）
 */
export async function prefetchInsightsForFile(
    file: ProjectFile,
    projectId: string,
    fileIndex: number,
    setProjects: (updater: (projects: any[]) => any[]) => void,
    saveProjects: (projects: any[]) => Promise<void>
): Promise<void> {
    try {
        // L1检查：如果已有有效缓存，跳过
        if (hasValidInsightCache(file)) {
            logger.log('AI洞察预加载', `使用L1缓存: ${file.data.fileName}`);
            return;
        }

        logger.log('AI洞察预加载', `开始预生成: ${file.data.fileName}`);

        const insights = await generateInsightSuggestions(
            file.data.tableName!,
            file.data.columns,
            file.data.rowCount
        );

        // 存储到项目缓存（L1：精确匹配缓存）
        setProjects(currentProjects => {
            const targetProject = currentProjects.find((p: any) => p.id === projectId);
            if (!targetProject) return currentProjects;

            const updatedFiles = targetProject.files.map((f: any, idx: number) => {
                if (idx === fileIndex) {
                    return {
                        ...f,
                        analysisCache: {
                            ...f.analysisCache,
                            insight: {
                                ...f.analysisCache?.insight,
                                prefetchedSuggestions: insights,
                                status: 'ready' as const,
                                isStale: false,
                                generatedAt: Date.now()
                            }
                        }
                    };
                }
                return f;
            });

            const finalProjects = currentProjects.map((p: any) =>
                p.id === projectId ? { ...p, files: updatedFiles } : p
            );
            saveProjects(finalProjects).catch(err => logger.warn('文件管理', 'IDB保存失败', err));
            return finalProjects;
        });

        logger.log('AI洞察预加载', `预生成成功: ${file.data.fileName}`, { count: insights.length });

    } catch (err) {
        logger.warn('AI洞察预加载', `预生成失败（不影响主流程）: ${file.data.fileName}`, err);
    }
}

/**
 * 方案3-L3：数据清洗后标记缓存为过期（增量更新）
 * @param projectId 项目ID
 * @param fileId 文件ID
 * @param setProjects 状态更新函数
 */
export function invalidateInsightCache(
    projectId: string,
    fileId: string,
    setProjects: (updater: (projects: any[]) => any[]) => void
): void {
    logger.log('AI洞察', `L3缓存失效标记 项目:${projectId} 文件:${fileId}`);

    setProjects(currentProjects => {
        return currentProjects.map((p: any) => {
            if (p.id === projectId) {
                return {
                    ...p,
                    files: p.files.map((f: any) => {
                        if (f.id === fileId && f.analysisCache?.insight) {
                            return {
                                ...f,
                                analysisCache: {
                                    ...f.analysisCache,
                                    insight: {
                                        ...f.analysisCache.insight,
                                        isStale: true // 标记为需要重新生成
                                    }
                                }
                            };
                        }
                        return f;
                    })
                };
            }
            return p;
        });
    });
}
