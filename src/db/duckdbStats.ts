import * as duckdb from '@duckdb/duckdb-wasm';
import { logger } from '../utils/logger';
import { getTableColumns } from './duckdbQuery';

/**
 * DuckDB统计分析功能
 * 职责：列统计信息、直方图、分布数据
 */

/**
 * 获取表的所有列详细统计信息
 * 包括：基础统计、数值统计(五数概括+标准差+偏度)、分类统计(TOP 5)、分布直方图
 */
export async function getColumnStats(
    conn: duckdb.AsyncDuckDBConnection,
    tableName: string
): Promise<any[]> {
    if (!conn) return [];

    // 1. 获取列名和类型
    const columns = await getTableColumns(conn, tableName);
    const stats: any[] = [];

    // 2. 为每一列构建聚合查询
    for (const col of columns) {
        try {
            // 基础统计（所有类型）
            const basicSql = `
                SELECT 
                    count(*) as total,
                    count("${col.name}") as non_null,
                    approx_count_distinct("${col.name}") as unique_count
                FROM ${tableName}
            `;
            const basicResult = await conn.query(basicSql);
            const basicRow = basicResult.get(0);

            const total = Number(basicRow ? basicRow['total'] : 0);
            const nonNull = Number(basicRow ? basicRow['non_null'] : 0);
            const nullCount = total - nonNull;
            const uniqueCount = Number(basicRow ? basicRow['unique_count'] : 0);

            // 判断是否为数值类型
            const isNumeric = ['INT', 'DOUBLE', 'FLOAT', 'DECIMAL', 'NUMERIC'].some(t =>
                col.type.toUpperCase().includes(t)
            );

            let numericStats = null;
            let categoricalStats = null;
            let distribution = null;

            if (isNumeric && nonNull > 0) {
                // 数值类型：获取详细统计
                try {
                    const numericSql = `
                        SELECT 
                            min("${col.name}") as min_val,
                            approx_quantile("${col.name}", 0.25) as q1,
                            median("${col.name}") as median_val,
                            avg("${col.name}") as mean_val,
                            approx_quantile("${col.name}", 0.75) as q3,
                            max("${col.name}") as max_val,
                            stddev("${col.name}") as stddev_val,
                            skewness("${col.name}") as skewness_val,
                            kurtosis("${col.name}") as kurtosis_val,
                            CASE 
                                WHEN avg("${col.name}") != 0 
                                THEN stddev("${col.name}") / avg("${col.name}")
                                ELSE NULL 
                            END as cv_val
                        FROM ${tableName}
                        WHERE "${col.name}" IS NOT NULL
                    `;
                    const numericResult = await conn.query(numericSql);
                    const numericRow = numericResult.get(0);

                    if (numericRow) {
                        numericStats = {
                            min: Number(numericRow['min_val']),
                            q1: Number(numericRow['q1']),
                            median: Number(numericRow['median_val']),
                            mean: Number(numericRow['mean_val']),
                            q3: Number(numericRow['q3']),
                            max: Number(numericRow['max_val']),
                            stddev: Number(numericRow['stddev_val']),
                            iqr: Number(numericRow['q3']) - Number(numericRow['q1']),  // 🆕 v2.3 四分位距
                            skewness: Number(numericRow['skewness_val']),
                            kurtosis: Number(numericRow['kurtosis_val']),
                            cv: numericRow['cv_val'] !== null ? Number(numericRow['cv_val']) : undefined
                        };

                        // 获取直方图数据 (Smart Binning)
                        try {
                            const min = numericStats.min;
                            const max = numericStats.max;

                            if (min !== max && isFinite(min) && isFinite(max)) {
                                // 智能判断：如果唯一值很少 (<= 20)，直接显示具体值的分布
                                if (uniqueCount <= 20) {
                                    const discreteSql = `
                                        SELECT 
                                            "${col.name}" as value,
                                            count(*) as count 
                                        FROM ${tableName} 
                                        WHERE "${col.name}" IS NOT NULL 
                                        GROUP BY "${col.name}" 
                                        ORDER BY "${col.name}" ASC
                                    `;
                                    const discreteResult: any = await conn.query(discreteSql);
                                    const counts: number[] = [];
                                    const labels: number[] = [];

                                    for (let i = 0; i < discreteResult.numRows; i++) {
                                        const row: any = discreteResult.get(i);
                                        counts.push(Number(row['count']));
                                        labels.push(Number(row['value']));
                                    }

                                    distribution = {
                                        bins: counts.length,
                                        counts: counts,
                                        min: min,
                                        max: max,
                                        labels: labels // 传递具体值给前端
                                    };

                                } else {
                                    // 连续数值：使用分箱直方图 (10个区间)
                                    const binWidth = (max - min) / 10;
                                    // 使用CASE WHEN手动分桶，避免width_bucket兼容性问题
                                    const histSql = `
                                        SELECT 
                                            CASE 
                                                WHEN "${col.name}" < ${min + binWidth} THEN 0
                                                WHEN "${col.name}" < ${min + binWidth * 2} THEN 1
                                                WHEN "${col.name}" < ${min + binWidth * 3} THEN 2
                                                WHEN "${col.name}" < ${min + binWidth * 4} THEN 3
                                                WHEN "${col.name}" < ${min + binWidth * 5} THEN 4
                                                WHEN "${col.name}" < ${min + binWidth * 6} THEN 5
                                                WHEN "${col.name}" < ${min + binWidth * 7} THEN 6
                                                WHEN "${col.name}" < ${min + binWidth * 8} THEN 7
                                                WHEN "${col.name}" < ${min + binWidth * 9} THEN 8
                                                ELSE 9
                                            END as bucket,
                                            COUNT(*) as count
                                        FROM ${tableName}
                                        WHERE "${col.name}" IS NOT NULL
                                        GROUP BY bucket
                                        ORDER BY bucket
                                    `;
                                    const histResult: any = await conn.query(histSql);
                                    const counts = new Array(10).fill(0);

                                    for (let i = 0; i < histResult.numRows; i++) {
                                        const row: any = histResult.get(i);
                                        if (row) {
                                            const bucket = Number(row['bucket']);
                                            if (bucket >= 0 && bucket < 10) {
                                                counts[bucket] = Number(row['count']);
                                            }
                                        }
                                    }

                                    distribution = {
                                        bins: 10,
                                        counts: counts,
                                        min: min,
                                        max: max
                                    };
                                }
                            }
                        } catch (histError) {
                            logger.warn('DuckDB', `获取列直方图失败: ${col.name}`, histError);
                        }
                    }
                } catch (numericError) {
                    logger.warn('DuckDB', `获取数值统计失败: ${col.name}`, numericError);
                }
            } else if (nonNull > 0) {
                // 非数值类型：获取 TOP 10 VALUES
                try {
                    const topValuesSql = `
                        SELECT 
                            "${col.name}" as value,
                            COUNT(*) as count
                        FROM ${tableName}
                        WHERE "${col.name}" IS NOT NULL
                        GROUP BY "${col.name}"
                        ORDER BY count DESC
                        LIMIT 10
                    `;
                    const topValuesResult = await conn.query(topValuesSql);
                    const topValues = [];

                    for (let i = 0; i < topValuesResult.numRows; i++) {
                        const row = topValuesResult.get(i);
                        if (row) {
                            topValues.push({
                                value: String(row['value']),
                                count: Number(row['count'])
                            });
                        }
                    }

                    categoricalStats = { topValues };
                } catch (catError) {
                    logger.warn('DuckDB', `获取分类统计失败: ${col.name}`, catError);
                }
            }

            stats.push({
                name: col.name,
                type: col.type,
                total,
                nullCount,
                uniqueCount,
                numericStats,
                categoricalStats,
                distribution
            });

        } catch (e) {
            logger.warn('DuckDB', `获取列统计失败: ${col.name}`, e);
            stats.push({
                name: col.name,
                type: col.type,
                error: true,
                total: 0,
                nullCount: 0,
                uniqueCount: 0
            });
        }
    }
    return stats;
}
