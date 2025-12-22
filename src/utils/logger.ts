/**
 * 统一日志工具
 * 格式: [服务名] 操作描述
 * 规范:
 * - 所有日志必须指定服务名
 * - 操作描述简洁明确,避免"正在"等冗余词
 * - 使用group合并复杂流程
 * - 生产环境仅保留error和warn
 */

export type ServiceName =
    | 'AI清洗'
    | 'AI洞察'
    | 'AI洞察预加载'
    | 'AI服务'
    | '本地模型'
    | 'DuckDB'
    | '数据清洗'
    | '数据分析'
    | '文件管理'
    | 'Python'
    | 'Skills'
    | 'UI'
    | '系统'
    | '报告';  // 🆕 报告生成服务

export interface LogOptions {
    data?: any; // 附加数据
    duration?: number; // 耗时(ms)
    count?: number; // 数量
}

class Logger {
    private isDev = import.meta.env.DEV;

    /**
     * 格式化日志消息
     */
    private format(service: ServiceName, message: string, options?: LogOptions): string {
        let result = `[${service}] ${message}`;

        if (options?.count !== undefined) {
            result += `: ${options.count}条`;
        }

        if (options?.duration !== undefined) {
            result += ` (${options.duration}ms)`;
        }

        return result;
    }

    /**
     * 普通日志(仅开发环境)
     */
    log(service: ServiceName, message: string, options?: LogOptions) {
        if (!this.isDev) return;
        const formatted = this.format(service, message, options);
        if (options?.data !== undefined) {
            console.log(formatted, options.data);
        } else {
            console.log(formatted);
        }
    }

    /**
     * 开始分组日志
     */
    group(service: ServiceName, title: string) {
        if (!this.isDev) return;
        console.group(`[${service}] ${title}`);
    }

    /**
     * 结束分组日志
     */
    groupEnd() {
        if (!this.isDev) return;
        console.groupEnd();
    }

    /**
     * 警告日志(生产环境保留)
     */
    warn(service: ServiceName, message: string, data?: any) {
        const formatted = `[${service}] ${message}`;
        if (data !== undefined) {
            console.warn(formatted, data);
        } else {
            console.warn(formatted);
        }
    }

    /**
     * 错误日志(生产环境保留)
     */
    error(service: ServiceName, message: string, error?: any) {
        const formatted = `[${service}] ${message}`;
        if (error !== undefined) {
            console.error(formatted, error);
        } else {
            console.error(formatted);
        }
    }

    /**
     * 调试日志(仅开发环境,需手动开启)
     */
    debug(service: ServiceName, message: string, data?: any) {
        if (!this.isDev) return;
        const formatted = `[${service}] ${message}`;
        if (data !== undefined) {
            console.debug(formatted, data);
        } else {
            console.debug(formatted);
        }
    }
}

export const logger = new Logger();
