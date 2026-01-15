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
    | 'AI配置'  // 🆕 AI配置与推荐
    | 'AI代码增强'  // 🆕 AI代码增强服务
    | '本地模型'
    | 'DuckDB'
    | '数据清洗'
    | '数据准备'  // 🆕 数据准备服务(采样+脱敏)
    | '清洗执行'  // 🆕 清洗执行服务
    | '数据分析'
    | '数据隐私'  // 🆕 数据脱敏服务
    | '数据持久化'  // 🆕 DataFrame持久化服务
    | '内存评估'  // 🆕 内存评估服务
    | '质量门控'  // 🆕 质量门控服务
    | '资源管理'  // 🆕 资源与限制管理
    | '文件管理'
    | 'Python'
    | 'Python库配置'  // 🆕 Python库配置管理
    | 'Python Worker'  // 🆕 Pyodide Worker专用
    | 'Skills'
    | 'UI'
    | '用户操作'  // 🆕 用户操作（采纳洞察等）
    | '用户设置'  // 🆕 用户设置管理
    | '系统'
    | '报告'  // 🆕 报告生成服务
    | '诊断工具'  // 🆕 WebLLM诊断等工具
    | '日志捕获'  // 🆕 日志捕获工具
    | '列名校验';  // 🆕 列名校验工具

export interface LogOptions {
    data?: any; // 附加数据
    duration?: number; // 耗时(ms)
    count?: number; // 数量
}

class Logger {
    private isDev: boolean;
    private explicitlyDisabled: boolean = false;

    constructor() {
        // 1. 默认基于环境
        let devMode = true;
        try {
            devMode = (import.meta as any).env?.DEV ?? true;
        } catch {
            devMode = true;
        }

        // 2. 允许 localStorage 覆盖 (liulix_debug_mode = 'true' | 'false')
        try {
            const stored = localStorage.getItem('liulix_debug_mode');
            if (stored === 'true') {
                devMode = true;
                this.explicitlyDisabled = false;
            }
            if (stored === 'false') {
                devMode = false;
                this.explicitlyDisabled = true; // 显式关闭时，标记为“完全禁用”
            }
        } catch { }

        this.isDev = devMode;

        // 3. 挂载全局控制函数 (增加简单口令验证)
        if (typeof window !== 'undefined') {
            (window as any).toggleDebugLogs = (enable?: boolean, secret?: string) => {
                // 简单的防误触验证
                if (enable && secret !== 'liulix-dev') {
                    console.warn('❌ Access Denied: Missing or invalid secret key.');
                    return false;
                }

                const newState = enable ?? !this.isDev;
                this.isDev = newState;
                this.explicitlyDisabled = !newState; // 同步更新禁用状态

                localStorage.setItem('liulix_debug_mode', String(newState));

                if (newState) {
                    console.log(`[Logger] Debug logs ENABLED (All logs visible)`);
                } else {
                    console.log(`[Logger] Debug logs DISABLED (Errors/Warns hidden)`);
                }
                return newState;
            };
        }
    }

    /**
     * 获取当前时间戳
     */
    private getTimestamp(): string {
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', { hour12: false });
        const ms = now.getMilliseconds().toString().padStart(3, '0');
        return `${time}.${ms}`;
    }

    /**
     * 格式化日志消息
     */
    private format(service: ServiceName, message: string, options?: LogOptions): string {
        const timestamp = this.getTimestamp();
        let result = `[${timestamp}] [${service}] ${message}`;

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
     * 开始分组日志（默认收起）
     * 用于详细调试信息或低优先级内容
     */
    groupCollapsed(service: ServiceName, title: string) {
        if (!this.isDev) return;
        console.groupCollapsed(`[${service}] ${title}`);
    }

    /**
     * 结束分组日志
     */
    groupEnd() {
        if (!this.isDev) return;
        console.groupEnd();
    }

    /**
     * 警告日志(生产环境保留，除非显式禁用)
     */
    warn(service: ServiceName, message: string, data?: any) {
        if (this.explicitlyDisabled) return; // 显式禁用时隐藏
        const timestamp = this.getTimestamp();
        const formatted = `[${timestamp}] [${service}] ${message}`;
        if (data !== undefined) {
            console.warn(formatted, data);
        } else {
            console.warn(formatted);
        }
    }

    /**
     * 错误日志(生产环境保留，除非显式禁用)
     */
    error(service: ServiceName, message: string, error?: any) {
        if (this.explicitlyDisabled) return; // 显式禁用时隐藏
        const timestamp = this.getTimestamp();
        const formatted = `[${timestamp}] [${service}] ${message}`;
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
