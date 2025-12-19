import { useState } from 'react';
import { useI18n } from '../../../contexts/I18nContext';
import { useEvidence } from '../../../contexts/EvidenceContext';
import { DuckDBEngine } from '../../../db/duckdbEngine';
import { SimpleSuggestion, Project } from '../types/cleaning.types';
import { buildCleaningSQL } from '../utils/sqlBuilder';
import { renderActionText } from '../utils/suggestionUtils';

/**
 * 清洗执行Hook
 * 职责：执行SQL清洗、更新状态、管理重置
 */
export function useCleaningExecution(
    project: Project,
    activeFile: any,
    onProjectUpdate?: (project: Project) => void,
    addHistoryItem?: (item: any) => void,
    clearHistory?: () => void
) {
    const { t } = useI18n();
    const { addRecord } = useEvidence();
    const [loading, setLoading] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    /**
     * 应用选中的清洗建议
     */
    const handleApply = async (selectedSuggestions: SimpleSuggestion[]) => {
        if (selectedSuggestions.length === 0) return;

        setLoading(true);

        try {
            const engine = DuckDBEngine.getInstance();

            // 查找表名
            const tables = await engine.queryChunk('information_schema.tables', 0, 100);
            const dataTable = tables
                .filter((t: any) => t.table_name && String(t.table_name).startsWith('t_'))
                .sort((a: any, b: any) => String(b.table_name).localeCompare(String(a.table_name)))[0];

            if (!dataTable) {
                console.error('❌ 未找到以t_开头的表');
                throw new Error('未找到数据表');
            }

            const tableName = String(dataTable.table_name);

            // 执行前查询行数和列数
            const columnsBefore = await engine.getTableColumns(tableName);
            const rowCountBefore = activeFile?.data.rowCount || 0;

            // 依次执行所有清洗操作
            for (const sugg of selectedSuggestions) {
                const sqlTemplate = buildCleaningSQL(sugg);
                const sql = sqlTemplate.replace(/__TABLE_NAME__/g, tableName);
                await engine.executeCleaningSQL(sql);
            }

            // 执行后重新查询列数
            const columnsAfter = await engine.getTableColumns(tableName);
            const rowCountAfter = rowCountBefore; // 列操作不影响行数

            // 计算变化
            const rowDiff = rowCountBefore - rowCountAfter;
            const colDiff = columnsBefore.length - columnsAfter.length;

            // 更新project状态
            if (onProjectUpdate) {
                const updatedFiles = project.files.map(f => {
                    if (f.id === activeFile?.id) {
                        return {
                            ...f,
                            data: {
                                ...f.data,
                                rowCount: rowCountAfter,
                                columnCount: columnsAfter.length,
                                columns: columnsAfter.map((c: any) => c.name)
                            }
                        };
                    }
                    return f;
                });

                onProjectUpdate({
                    ...project,
                    files: updatedFiles
                });
            }

            // 记录历史 && 证据池
            for (const sugg of selectedSuggestions) {
                const actionText = renderActionText(sugg, rowCountBefore, rowCountAfter);

                if (addHistoryItem) {
                    addHistoryItem({
                        action: actionText,
                        rowCountBefore,
                        rowCountAfter
                    });
                }

                if (addRecord) {
                    addRecord({
                        type: 'cleaning',
                        title: actionText,
                        description: sugg.reason,
                        sql: buildCleaningSQL(sugg).replace(/__TABLE_NAME__/g, tableName),
                        beforeCount: rowCountBefore,
                        afterCount: rowCountAfter,
                        affectedRows: sugg.action === 'dedup' ? rowDiff : (sugg.column ? colDiff : undefined),
                        tags: [
                            sugg.id.startsWith('ai_') ? t('cleaning.tagAISuggestion') : t('cleaning.tagRuleSuggestion'),
                            sugg.action === 'dedup' ? t('cleaning.tagDedup') : (sugg.action === 'fill' ? t('cleaning.tagFillMissing') : t('cleaning.tagDropColumn'))
                        ],
                        metadata: {
                            suggestionId: sugg.id,
                            column: sugg.column,
                            action: sugg.action,
                            confidence: sugg.confidence,
                        }
                    });
                }
            }

            // 更新文件元数据
            if (activeFile && onProjectUpdate) {
                try {
                    const updatedColumns = await engine.getTableColumns(tableName);
                    const updatedFile = {
                        ...activeFile,
                        data: {
                            ...activeFile.data,
                            columns: updatedColumns.map((c: any) => c.name),
                            columnCount: updatedColumns.length,
                            rowCount: rowCountAfter,
                            tableName: tableName,
                            lastModified: Date.now()
                        },
                        // 🚀 洞察缓存失效：数据清洗后标记洞察为过期
                        analysisCache: {
                            ...activeFile.analysisCache,
                            insight: {
                                ...activeFile.analysisCache?.insight,
                                // 保留现有假设但标记为过期，需要重新生成
                                hypotheses: activeFile.analysisCache?.insight?.hypotheses || [],
                                status: 'pending' as const,
                                isStale: true, // ✨ 关键：标记洞察缓存过期
                            }
                        }
                    };

                    const updatedProject: Project = {
                        ...project,
                        files: project.files.map(f => f.id === activeFile.id ? updatedFile : f)
                    };

                    onProjectUpdate(updatedProject);

                    console.log('✅ 数据清洗完成，洞察缓存已失效，等待后台刷新');
                } catch (err) {
                    console.error('❌ 更新文件元数据失败:', err);
                }
            }
        } catch (err) {
            console.error('❌ 应用建议失败:', err);
            alert(`应用清洗建议失败: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setLoading(false);
        }
    };

    /**
     * 显示重置确认对话框
     */
    const handleReset = () => {
        setShowResetConfirm(true);
    };

    /**
     * 确认并执行重置
     */
    const confirmReset = async () => {
        setShowResetConfirm(false);

        if (!activeFile) {
            console.warn('⚠️ 没有活动文件');
            return;
        }

        setLoading(true);

        try {
            const engine = DuckDBEngine.getInstance();

            // 获取表名
            let tableName = activeFile.data.tableName;

            if (!tableName) {
                const tables = await engine.queryChunk('information_schema.tables', 0, 100);
                const workingTable = tables.find((t: any) =>
                    String(t.table_name || '').endsWith('_working')
                );

                if (workingTable) {
                    tableName = String(workingTable.table_name);
                } else {
                    console.error('❌ 无法找到working表');
                    alert('无法重置：未找到数据表');
                    return;
                }
            }

            // 调用重置方法
            const success = await engine.resetWorkingTable(tableName);

            if (!success) {
                alert('重置失败：无法恢复原始数据');
                return;
            }

            // 清空历史记录
            if (clearHistory) {
                clearHistory();
            }

            // 更新project触发DataViewer刷新
            if (onProjectUpdate) {
                const updatedColumns = await engine.getTableColumns(tableName);

                const updatedFile = {
                    ...activeFile,
                    data: {
                        ...activeFile.data,
                        columns: updatedColumns.map((c: any) => c.name),
                        columnCount: updatedColumns.length,
                        tableName: tableName,
                        lastModified: Date.now()
                    }
                };

                const updatedProject: Project = {
                    ...project,
                    files: project.files.map(f => f.id === activeFile.id ? updatedFile : f)
                };
                onProjectUpdate(updatedProject);
            }

        } catch (err) {
            console.error('❌ 重置失败:', err);
            alert(`重置失败: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setLoading(false);
        }
    };

    /**
     * 取消重置
     */
    const cancelReset = () => {
        setShowResetConfirm(false);
    };

    return {
        handleApply,
        handleReset,
        confirmReset,
        cancelReset,
        loading,
        showResetConfirm
    };
}
