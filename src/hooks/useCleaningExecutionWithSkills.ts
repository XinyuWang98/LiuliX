/**
 * 数据清洗执行Hook（Skills版本）
 * 通过Generic Skills (sys_run_sql) 执行清洗操作
 */

import { useState } from 'react';
import { sysRunSQL } from '@/services/skills/generic/sys_run_sql';
import { logger } from '@/utils/logger';
import { toast } from '@/components/common/Toast';

export interface CleaningOperation {
    type: 'deduplicate' | 'fill_missing' | 'remove_column';
    tableName: string;
    columns?: string[];
    strategy?: string;
}

export function useCleaningExecutionWithSkills() {
    const [isExecuting, setIsExecuting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * 执行清洗操作（通过sys_run_sql）
     */
    const executeCleaningWithSkills = async (operation: CleaningOperation) => {
        setIsExecuting(true);
        setError(null);

        logger.group('数据清洗', 'Skills模式执行');
        logger.log('数据清洗', '操作类型', { data: operation.type });

        try {
            // 1. 生成SQL语句
            const sql = generateCleaningSQL(operation);
            logger.log('数据清洗', '生成SQL', { data: sql });

            // 2. 通过sys_run_sql执行（权限：CLEANING）
            const result = await sysRunSQL({
                sql,
                permission: 'CLEANING'
            });

            if (result.success) {
                logger.log('数据清洗', '执行成功');
                toast.success('清洗操作执行成功');
                logger.groupEnd();
                return { success: true, data: result.data };
            } else {
                throw new Error(result.error || '清洗操作失败');
            }

        } catch (err: any) {
            const errorMessage = err.message || '未知错误';
            logger.error('数据清洗', 'Skills执行失败', errorMessage);
            setError(errorMessage);
            toast.error(`清洗失败：${errorMessage}`);
            logger.groupEnd();

            // 降级到传统模式（可选）
            logger.warn('数据清洗', '尝试降级到传统模式');
            return { success: false, error: errorMessage };
        } finally {
            setIsExecuting(false);
        }
    };

    /**
     * 生成清洗SQL语句
     */
    function generateCleaningSQL(operation: CleaningOperation): string {
        const { type, tableName, columns, strategy } = operation;

        switch (type) {
            case 'deduplicate':
                if (columns && columns.length > 0) {
                    // 按指定列去重
                    const dupCols = columns.map(c => `"${c}"`).join(', ');
                    return `
                        DELETE FROM ${tableName}
                        WHERE rowid NOT IN (
                            SELECT MIN(rowid)
                            FROM ${tableName}
                            GROUP BY ${dupCols}
                        )
                    `.trim();
                } else {
                    // 全列去重
                    return `
                        CREATE TABLE temp_${tableName} AS
                        SELECT DISTINCT * FROM ${tableName};
                        DELETE FROM ${tableName};
                        INSERT INTO ${tableName} SELECT * FROM temp_${tableName};
                        DROP TABLE temp_${tableName};
                    `.trim();
                }

            case 'fill_missing':
                const column = columns?.[0] || '';
                let fillExpression = '';

                switch (strategy) {
                    case 'mean':
                        fillExpression = `(SELECT AVG("${column}") FROM ${tableName})`;
                        break;
                    case 'median':
                        fillExpression = `(SELECT MEDIAN("${column}") FROM ${tableName})`;
                        break;
                    case 'zero':
                        fillExpression = '0';
                        break;
                    default:
                        fillExpression = 'NULL';
                }

                return `
                    UPDATE ${tableName}
                    SET "${column}" = COALESCE("${column}", ${fillExpression})
                    WHERE "${column}" IS NULL
                `.trim();

            case 'remove_column':
                const columnsToKeep = columns || [];
                const keepCols = columnsToKeep.map(c => `"${c}"`).join(', ');
                return `
                    CREATE TABLE temp_${tableName} AS
                    SELECT ${keepCols} FROM ${tableName};
                    DELETE FROM ${tableName};
                    INSERT INTO ${tableName} SELECT * FROM temp_${tableName};
                    DROP TABLE temp_${tableName};
                `.trim();

            default:
                throw new Error(`未知的清洗操作类型: ${type}`);
        }
    }

    return {
        isExecuting,
        error,
        executeCleaningWithSkills
    };
}
