
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🆕 从命令行参数获取语言和报告后缀
// 注意：当作为模块导入时，process.argv 仍然是主进程的参数
export const LOCALE = process.argv[2] || 'zh-CN';  // zh-CN 或 en-US
export const REPORT_SUFFIX = process.argv[3] || 'zh-CN-Full';  // 报告文件名后缀
export const ENV_MODE = process.argv[4] || 'dev';  // dev 或 production

// 🆕 生成带时间戳的报告文件名
export const generateReportPath = () => {
    const now = new Date();
    const timestamp = now.toISOString()
        .replace(/:/g, '-')  // 替换冒号为连字符
        .replace(/\..+/, '')  // 移除毫秒部分
        .replace('T', '_');   // 替换 T 为下划线

    // 格式: 2026-01-15_03-40-01
    // 注意：这里 __dirname 是 scripts/test-utils，所以要往上找两级回到 root/docs
    return path.resolve(
        __dirname,
        '../../docs/03-测试验证/48-测试-批量洞察分析测试报告-' + REPORT_SUFFIX + '-' + timestamp + '.md'
    );
};

// 🆕 根据环境选择 URL
export const BASE_URL = ENV_MODE === 'production'
    ? 'http://localhost:4173'  // Vite Preview (生产构建)
    : 'http://localhost:5173'; // Vite Dev (开发环境)

export const DATASET_DIR = path.resolve(__dirname, '../../test_datasets');

export interface DatasetConfig {
    path: string;
    expectedTime: number;
}

// 数据集定义
export const DATASETS: DatasetConfig[] = [
    // Small Group (<1MB)
    { path: 'test_datasets/small_sales_100.csv', expectedTime: 30 },
    { path: 'test_datasets/small_users_200.csv', expectedTime: 30 },
    { path: 'test_datasets/small_inventory_50.csv', expectedTime: 30 },
    { path: 'test_datasets/small_weather_365.csv', expectedTime: 30 },
    { path: 'test_datasets/small_students_500.csv', expectedTime: 30 },

    // Medium Group (1MB - 10MB)
    { path: 'test_datasets/medium_feedback_800.csv', expectedTime: 45 },
    { path: 'test_datasets/medium_orders_500.csv', expectedTime: 45 },
    { path: 'test_datasets/medium_stocks_1000.csv', expectedTime: 45 },
    { path: 'test_datasets/medium_housing_1500.csv', expectedTime: 45 },
    { path: 'test_datasets/medium_flights_5000.csv', expectedTime: 45 },

    // Large Group (10MB - 100MB)
    { path: 'test_datasets/large_employees_1500.csv', expectedTime: 60 },
    { path: 'test_datasets/large_sensors_2000.csv', expectedTime: 60 },
    { path: 'test_datasets/large_webtraffic_3000.csv', expectedTime: 60 },
    { path: 'test_datasets/xlarge_iot_20k.csv', expectedTime: 90 },
    { path: 'test_datasets/xlarge_logs_8000.csv', expectedTime: 90 },

    // Mega Group (>100MB)
    { path: 'test_datasets/mega_ecommerce_600k.csv', expectedTime: 120 },
    { path: 'test_datasets/trips_data_1m.csv', expectedTime: 180 },
    { path: 'test_datasets/big_sales_2m.csv', expectedTime: 240 },
];

export interface LogEntry {
    time: string;
    msg: string;
    type: string;
}

export interface InsightDetail {
    promptId: string;
    title: string;
    score: number;
    status: string;
    params: Record<string, unknown>;
    error?: string | null;
}

export interface TestResult {
    dataset: string;
    size: string;
    columnCount: number;  // 🆕 列数
    aiSuggestionDuration: number;  // 🆕 AI建议生成耗时 (ms)
    promptLength: number;  // 🆕 Router Prompt字符数
    isColdStart?: boolean; // 🆕 标记是否为冷启动
    metrics: {
        uploadDuration: number;
        ingestDuration: number;
        aiLatency: number;
        totalDuration: number;
        duckDBInitDuration?: number; // 🆕 DuckDB初始化耗时 (仅冷启动有意义)
    };
    insights: InsightDetail[];
    timeline: {
        time: string;
        stage: string;
        duration: string;
        note: string;
    }[];
    errors: string[];
}

// 辅助函数：解析日志时间
export function parseTime(msg: string): string {
    const match = msg.match(/\[(\d{2}:\d{2}:\d{2}\.\d{3})\]/);
    return match ? match[1] : new Date().toLocaleTimeString('en-US', { hour12: false }) + '.' + new Date().getMilliseconds().toString().padStart(3, '0');
}

export function getGroup(sizeStr: string): string {
    const time = parseInt(sizeStr);
    if (time <= 30) return 'Small (<1MB)';
    if (time <= 45) return 'Medium (1-10MB)';
    if (time <= 90) return 'Large (10-100MB)';
    return 'Mega (>100MB)';
}
