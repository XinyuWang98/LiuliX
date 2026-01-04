import { useState } from 'react';
import { useI18n } from '../../../contexts/I18nContext';
import { useEvidence } from '../../../contexts/EvidenceContext';
import { DuckDBEngine } from '../../../db/duckdbEngine';
import { skillsDispatcher } from '../../../services/skills/dispatcher';
import { SimpleSuggestion, Project } from '../types/cleaning.types';
import { buildCleaningSQL } from '../utils/sqlBuilder';
import { renderActionText } from '../utils/suggestionUtils';
import { logger } from '../../../utils/logger';

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
     * P0 修复：支持部分成功记录，即使某些SQL失败也不影响其他
     * P1 修复：针对数值列自动修正AI填充的字符串'null'
     */
    const handleApply = async (selectedSuggestions: SimpleSuggestion[]) => {
        if (selectedSuggestions.length === 0) return;

        setLoading(true);
        logger.group('清洗执行', `⚙️ 应用 ${selectedSuggestions.length} 条建议`);

        // P0：追踪成功和失败
        const successList: SimpleSuggestion[] = [];
        const failureList: { sugg: SimpleSuggestion; error: string }[] = [];

        try {
            const engine = DuckDBEngine.getInstance();

            // ✅ 修复：查找工作表时增强过滤条件，防止误选 dry-run 临时表
            const tables = await engine.queryChunk('information_schema.tables', 0, 100);
            const dataTable = tables
                .filter((t: any) => {
                    const name = String(t.table_name || '');
                    return name.startsWith('t_')         // 正式表前缀
                        && name.endsWith('_working')     // 工作表后缀
                        && !name.includes('_dryrun_');   // 排除临时表
                })
                .sort((a: any, b: any) => String(b.table_name).localeCompare(String(a.table_name)))[0];

            if (!dataTable) {
                console.error('❌ 未找到有效的工作表 (_working)');
                throw new Error('未找到工作表');
            }

            const tableName = String(dataTable.table_name);

            // ✅ 防御性验证：二次确认表名不包含 _dryrun_
            if (tableName.includes('_dryrun_')) {
                console.error('❌ 严重错误：选中了临时表！', tableName);
                throw new Error('内部错误：误选临时表');
            }
            logger.log('清洗执行', `选中工作表: ${tableName}`);

            // 执行前查询行数和列数
            const columnsBefore = await engine.getTableColumns(tableName);
            const rowCountBefore = activeFile?.data.rowCount || 0;

            // 🆕 设置当前表名供Skills使用
            skillsDispatcher.setCurrentTable(tableName);

            // P0：逐条执行，独立错误处理
            for (const sugg of selectedSuggestions) {
                try {
                    // ✅ 优先使用AI生成的SQL（经过Dry-Run校验的），否则回退到本地模板
                    let sqlTemplate = sugg.sql;
                    if (!sqlTemplate) {
                        logger.warn('清洗执行', `建议${sugg.id}缺失SQL，回退到本地模板构建`);
                        sqlTemplate = buildCleaningSQL(sugg);
                    }

                    // P1：针对数值列的'null'字符串修正
                    if (sugg.actionType === 'fillMissing' && sugg.column) {
                        const column = columnsBefore.find((c: any) => c.name === sugg.column);

                        if (column && /DOUBLE|INT|FLOAT|DECIMAL|NUMERIC/i.test(column.type)) {
                            // 数值列：将字符串 'null' 替换为 NULL
                            sqlTemplate = sqlTemplate
                                .replace(/=\s*'null'/gi, '= NULL')
                                .replace(/=\s*"null"/gi, '= NULL');

                            logger.log('清洗执行', `数值列修正: ${sugg.column} (${column.type})`, {
                                data: { before: "SET = 'null'", after: "SET = NULL" }
                            });
                        }
                    }

                    const sql = sqlTemplate.replace(/__TABLE_NAME__/g, tableName);

                    // ✅ 通过Skills执行SQL清洗
                    const result = await skillsDispatcher.execute('sys_run_sql', {
                        sql,
                        permission: 'CLEANING'
                    });

                    if (result.success) {
                        successList.push(sugg);
                        logger.log('清洗执行', `✅ 建议 ${sugg.id} 执行成功`);

                        // P0：成功即记录历史（不等待全部完成）
                        const actionText = renderActionText(sugg, rowCountBefore, rowCountBefore);

                        if (addHistoryItem) {
                            addHistoryItem({
                                action: actionText,
                                rowCountBefore,
                                rowCountAfter: rowCountBefore // 列操作不影响行数
                            });
                        }

                        if (addRecord) {
                            addRecord({
                                type: 'cleaning',
                                title: actionText,
                                description: sugg.reason,
                                sql: sql,
                                beforeCount: rowCountBefore,
                                afterCount: rowCountBefore,
                                affectedRows: sugg.column ? 1 : undefined,
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
                    } else {
                        failureList.push({ sugg, error: result.error || '未知错误' });
                        logger.warn('清洗执行', `❌ 建议 ${sugg.id} 执行失败`, { error: result.error });
                    }
                } catch (error) {
                    // 单条建议失败不影响其他
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    failureList.push({ sugg, error: errorMsg });
                    logger.error('清洗执行', `❌ 建议 ${sugg.id} 抛出异常`, { error });
                }
            }

            // 执行后重新查询列数
            const columnsAfter = await engine.getTableColumns(tableName);

            // 更新project状态
            if (onProjectUpdate) {
                const updatedFiles = project.files.map(f => {
                    if (f.id === activeFile?.id) {
                        return {
                            ...f,
                            data: {
                                ...f.data,
                                rowCount: rowCountBefore,
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
                            rowCount: rowCountBefore,
                            tableName: tableName,
                            lastModified: Date.now()
                        },
                        // 🚀 洞察缓存失效：数据清洗后标记洞察为过期
                        analysisCache: {
                            ...activeFile.analysisCache,
                            insight: {
                                ...activeFile.analysisCache?.insight,
                                hypotheses: activeFile.analysisCache?.insight?.hypotheses || [],
                                status: 'pending' as const,
                                isStale: true,
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
                    // 元数据更新失败不影响主流程
                    logger.warn('清洗执行', '元数据更新失败', { error: err });
                }
            }

            // P0：反馈结果
            logger.log('清洗执行', `✅ 完成`, {
                data: {
                    total: selectedSuggestions.length,
                    success: successList.length,
                    failure: failureList.length
                }
            });
            logger.groupEnd();

            // P0：失败反馈UI
            if (failureList.length > 0) {
                const errorMsg = `${failureList.length} 条建议执行失败：\n${failureList.map(f => `• ${f.sugg.actionType || f.sugg.action}: ${f.error}`).join('\n')}`;
                alert(errorMsg);
                logger.error('清洗执行', '部分建议失败', {
                    failures: failureList.map(f => ({ id: f.sugg.id, error: f.error }))
                });
            }

            if (successList.length > 0) {
                logger.log('清洗执行', `✅ ${successList.length} 条建议成功应用`);
            }

        } catch (err) {
            // 仅全局错误（如找不到表）会到这里
            logger.groupEnd();
            logger.error('清洗执行', '应用建议失败（全局错误）', err);
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

            // ✅ 修复：查找工作表时增强过滤条件（与 handleApply 保持一致）
            let tableName = activeFile.data.tableName;

            if (!tableName) {
                const tables = await engine.queryChunk('information_schema.tables', 0, 100);
                const workingTable = tables.find((t: any) => {
                    const name = String(t.table_name || '');
                    return name.startsWith('t_')
                        && name.endsWith('_working')
                        && !name.includes('_dryrun_');
                });

                if (workingTable) {
                    tableName = String(workingTable.table_name);
                } else {
                    console.error('❌ 无法找到有效的工作表');
                    alert('无法重置：未找到工作表');
                    return;
                }
            }

            // ✅ 防御性验证：确认表名有效
            if (tableName.includes('_dryrun_')) {
                console.error('❌ 严重错误：尝试重置临时表！', tableName);
                alert('内部错误：无效的表名');
                return;
            }
            console.log(`[清洗执行] ✅ 重置目标表: ${tableName}`);

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
