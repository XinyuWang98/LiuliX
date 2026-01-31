/**
 * Playground 的 Mock 数据服务实现
 * 提供静态数据集，用于在没有后端连接的情况下测试自定义 Prompt。
 */

import { IDataContextService } from './IDataContextService';
import { ColumnStats } from '@/types/data';

// 静态泰坦尼克号数据集 (子集)
const TITANIC_DATA = [
    { PassengerId: 1, Survived: 0, Pclass: 3, Name: "Braund, Mr. Owen Harris", Sex: "male", Age: 22, Fare: 7.25, Embarked: "S" },
    { PassengerId: 2, Survived: 1, Pclass: 1, Name: "Cumings, Mrs. John Bradley (Florence Briggs Thayer)", Sex: "female", Age: 38, Fare: 71.2833, Embarked: "C" },
    { PassengerId: 3, Survived: 1, Pclass: 3, Name: "Heikkinen, Miss. Laina", Sex: "female", Age: 26, Fare: 7.925, Embarked: "S" },
    { PassengerId: 4, Survived: 1, Pclass: 1, Name: "Futrelle, Mrs. Jacques Heath (Lily May Peel)", Sex: "female", Age: 35, Fare: 53.1, Embarked: "S" },
    { PassengerId: 5, Survived: 0, Pclass: 3, Name: "Allen, Mr. William Henry", Sex: "male", Age: 35, Fare: 8.05, Embarked: "S" },
    { PassengerId: 6, Survived: 0, Pclass: 3, Name: "Moran, Mr. James", Sex: "male", Age: null, Fare: 8.4583, Embarked: "Q" },
    { PassengerId: 7, Survived: 0, Pclass: 1, Name: "McCarthy, Mr. Timothy J", Sex: "male", Age: 54, Fare: 51.8625, Embarked: "S" },
    { PassengerId: 8, Survived: 0, Pclass: 3, Name: "Palsson, Master. Gosta Leonard", Sex: "male", Age: 2, Fare: 21.075, Embarked: "S" },
    { PassengerId: 9, Survived: 1, Pclass: 3, Name: "Johnson, Mrs. Oscar W (Elisabeth Vilhelmina Berg)", Sex: "female", Age: 27, Fare: 11.1333, Embarked: "S" },
    { PassengerId: 10, Survived: 1, Pclass: 2, Name: "Nasser, Mrs. Nicholas (Adele Achem)", Sex: "female", Age: 14, Fare: 30.0708, Embarked: "C" },
];

export class MockDataService implements IDataContextService {

    /**
     * 获取静态泰坦尼克号数据集的采样数据
     */
    async getSampleData(limit: number = 10): Promise<any[]> {
        return TITANIC_DATA.slice(0, limit);
    }

    /**
     * 获取用于测试 Stats Injection 的 Mock 列统计信息
     */
    async getColumnStats(columns: string[]): Promise<ColumnStats[]> {
        return columns.map(col => {
            // 基于列名的 Mock 逻辑
            if (col === 'Age') {
                return {
                    column_name: 'Age',
                    data_type: 'numeric',
                    unique_count: 88,
                    missing_count: 177,
                    missing_ratio: 0.19,
                    numeric_stats: {
                        min: 0.42, max: 80, mean: 29.69, median: 28, std: 14.52,
                        q1: 20.125, q3: 38,
                        histogram: [10, 20, 40, 30, 15, 5, 2, 1, 0, 1], // 伪造的 bins
                        distribution: {
                            bins: 10,
                            counts: [10, 20, 40, 30, 15, 5, 2, 1, 0, 1],
                            min: 0, max: 80
                        }
                    }
                } as ColumnStats;
            }
            else if (col === 'Fare') {
                return {
                    column_name: 'Fare',
                    data_type: 'numeric',
                    unique_count: 248,
                    missing_count: 0,
                    missing_ratio: 0,
                    numeric_stats: {
                        min: 0, max: 512, mean: 32.20, median: 14.45, std: 49.69,
                        q1: 7.91, q3: 31,
                        histogram: [100, 20, 10, 5, 2, 1, 0, 0, 0, 1],
                        distribution: {
                            bins: 10,
                            counts: [100, 20, 10, 5, 2, 1, 0, 0, 0, 1],
                            min: 0, max: 512
                        }
                    }
                } as ColumnStats;
            }
            else if (col === 'Sex') {
                return {
                    column_name: 'Sex',
                    data_type: 'categorical',
                    unique_count: 2,
                    missing_count: 0,
                    missing_ratio: 0,
                    categorical_stats: {
                        top_values: [
                            { value: 'male', count: 577, percentage: 0.64 },
                            { value: 'female', count: 314, percentage: 0.35 }
                        ],
                        value_counts: { 'male': 577, 'female': 314 }
                    }
                } as ColumnStats;
            }

            // 默认回退
            return {
                column_name: col,
                data_type: 'text',
                unique_count: 10,
                missing_count: 0,
                missing_ratio: 0
            } as ColumnStats;
        });
    }

    /**
     * 简单的模板替换
     */
    async previewPrompt(template: string, vars: Record<string, any>): Promise<string> {
        let result = template || '';
        for (const [key, value] of Object.entries(vars)) {
            // 替换 {{key}}，不区分大小写或严格匹配取决于需求
            // 目前使用严格替换，符合正则习惯
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, String(value));
        }
        return result;
    }

    async runTest(code: string): Promise<any> {
        return {
            status: 'success',
            message: 'Mock 执行完成。代码模拟成功。',
            timestamp: Date.now()
        };
    }
}
