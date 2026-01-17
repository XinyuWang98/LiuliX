/**
 * 自动化日志捕捉工具
 * 用于测试时自动收集所有日志，方便问题诊断
 */

interface LogEntry {
    timestamp: number;
    level: 'log' | 'warn' | 'error' | 'group' | 'groupEnd' | 'user'; // 添加 'user' 级别用于用户操作
    service: string;
    message: string;
    data?: any;
    error?: {
        message: string;
        stack?: string;
        name?: string;
    };
    systemState?: {
        memory?: string;
        browser?: string;
        activeProjects?: number;
        featureFlags?: Record<string, boolean>;
    };
}

class LogCapture {
    private logs: LogEntry[] = [];
    private maxLogs = 1000; // 最多存储1000条日志
    private isCapturing = false;
    private sessionStartTime = Date.now();

    /**
     * 开始捕捉日志
     */
    start() {
        if (this.isCapturing) return;

        this.isCapturing = true;
        this.sessionStartTime = Date.now();
        this.logs = [];

        // 使用 try-catch 兼容 Node.js 环境
        try {
            if (typeof window !== 'undefined' && (import.meta as any).env?.DEV) {
                console.log('[LogCapture] 开始捕捉日志');
            }
        } catch {
            // Node.js 环境忽略
        }
    }

    /**
     * 停止捕捉日志
     */
    stop() {
        if (!this.isCapturing) return;

        this.isCapturing = false;
        try {
            if (typeof window !== 'undefined' && (import.meta as any).env?.DEV) {
                console.log('[LogCapture] 停止捕捉日志', { totalLogs: this.logs.length });
            }
        } catch {
            // Node.js 环境忽略
        }
    }

    /**
     * 添加日志条目
     */
    addLog(level: LogEntry['level'], service: string, message: string, data?: any) {
        if (!this.isCapturing) return;

        const entry: LogEntry = {
            timestamp: Date.now(),
            level,
            service,
            message,
            data
        };

        // 如果 data 是 Error 对象，提取错误信息
        if (data instanceof Error) {
            entry.error = {
                message: data.message,
                stack: data.stack,
                name: data.name
            };
            entry.data = undefined; // 避免重复存储
        }

        this.logs.push(entry);

        // 超过最大数量时删除最早的日志
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
    }

    /**
     * 添加用户操作日志（便捷方法）
     */
    addUserAction(action: string, details?: any) {
        this.addLog('user', '用户操作', action, details);
    }

    /**
     * 添加系统状态快照
     */
    addSystemSnapshot(context: string) {
        if (!this.isCapturing) return;

        const snapshot: LogEntry = {
            timestamp: Date.now(),
            level: 'log',
            service: '系统状态',
            message: context,
            systemState: {
                memory: this.getMemoryInfo(),
                browser: navigator.userAgent,
                activeProjects: this.getActiveProjectsCount(),
                featureFlags: this.getFeatureFlags()
            }
        };

        this.logs.push(snapshot);
    }

    /**
     * 获取内存信息
     */
    private getMemoryInfo(): string {
        if ('deviceMemory' in navigator) {
            return `${(navigator as any).deviceMemory}GB`;
        }
        return 'Unknown';
    }

    /**
     * 获取活动项目数量
     */
    private getActiveProjectsCount(): number {
        try {
            const projects = localStorage.getItem('liulix_projects');
            return projects ? JSON.parse(projects).length : 0;
        } catch {
            return 0;
        }
    }

    /**
     * 获取 Feature Flags 状态
     */
    private getFeatureFlags(): Record<string, boolean> {
        try {
            const flags = localStorage.getItem('liulix_feature_flags');
            return flags ? JSON.parse(flags) : {};
        } catch {
            return {};
        }
    }

    /**
     * 安全地序列化对象（处理 BigInt）
     */
    private safeStringify(obj: any, space?: number): string {
        return JSON.stringify(obj, (_key, value) => {
            // 将 BigInt 转换为字符串
            if (typeof value === 'bigint') {
                return value.toString();
            }
            return value;
        }, space);
    }

    /**
     * 导出日志为JSON
     */
    exportJSON(): string {
        const exportData = {
            sessionStart: new Date(this.sessionStartTime).toISOString(),
            sessionDuration: Date.now() - this.sessionStartTime,
            totalLogs: this.logs.length,
            userAgent: navigator.userAgent,
            logs: this.logs.map(log => ({
                time: new Date(log.timestamp).toISOString(),
                elapsed: `${((log.timestamp - this.sessionStartTime) / 1000).toFixed(1)}s`,
                level: log.level,
                service: log.service,
                message: log.message,
                data: log.data
            }))
        };

        return this.safeStringify(exportData, 2);
    }

    /**
     * 导出日志为Markdown
     */
    exportMarkdown(): string {
        const lines: string[] = [];

        lines.push('# 测试日志报告');
        lines.push('');
        lines.push(`**会话开始**: ${new Date(this.sessionStartTime).toLocaleString('zh-CN')}`);
        lines.push(`**会话时长**: ${((Date.now() - this.sessionStartTime) / 1000).toFixed(1)}秒`);
        lines.push(`**总日志数**: ${this.logs.length}`);
        lines.push(`**浏览器**: ${navigator.userAgent}`);
        lines.push('');
        lines.push('---');
        lines.push('');
        lines.push('## 日志详情');
        lines.push('');

        this.logs.forEach(log => {
            const elapsed = ((log.timestamp - this.sessionStartTime) / 1000).toFixed(1);
            const icon = this.getLogIcon(log.level);

            lines.push(`### ${icon} [${elapsed}s] ${log.service}`);
            lines.push('');
            lines.push(`**${log.message}**`);

            // 显示错误堆栈
            if (log.error) {
                lines.push('');
                lines.push('**错误详情**:');
                lines.push('```');
                lines.push(`${log.error.name || 'Error'}: ${log.error.message}`);
                if (log.error.stack) {
                    lines.push('');
                    lines.push(log.error.stack);
                }
                lines.push('```');
            }

            // 显示数据
            if (log.data) {
                lines.push('');
                lines.push('```json');
                lines.push(this.safeStringify(log.data, 2));
                lines.push('```');
            }

            // 显示系统状态快照
            if (log.systemState) {
                lines.push('');
                lines.push('**系统状态**:');
                lines.push('```json');
                lines.push(this.safeStringify(log.systemState, 2));
                lines.push('```');
            }

            lines.push('');
        });

        return lines.join('\n');
    }

    /**
     * 下载日志文件
     */
    download(format: 'json' | 'markdown' = 'markdown') {
        const content = format === 'json' ? this.exportJSON() : this.exportMarkdown();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `test-logs-${timestamp}.${format === 'json' ? 'json' : 'md'}`;
        const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/markdown' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();

        URL.revokeObjectURL(url);
        try {
            if (typeof window !== 'undefined' && (import.meta as any).env?.DEV) {
                console.log('[LogCapture] 日志已下载', { filename });
            }
        } catch {
            // Node.js 环境忽略
        }
    }

    /**
     * 获取日志图标
     */
    private getLogIcon(level: LogEntry['level']): string {
        const icons = {
            log: '📘',
            warn: '⚠️',
            error: '❌',
            group: '📂',
            groupEnd: '📁',
            user: '🖱️'
        };
        return icons[level] || '📝';
    }

    /**
     * 获取日志统计
     */
    getStats() {
        const stats = {
            total: this.logs.length,
            byLevel: {} as Record<string, number>,
            byService: {} as Record<string, number>
        };

        this.logs.forEach(log => {
            stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
            stats.byService[log.service] = (stats.byService[log.service] || 0) + 1;
        });

        return stats;
    }

    /**
     * 清空日志
     */
    clear() {
        this.logs = [];
        try {
            if (typeof window !== 'undefined' && (import.meta as any).env?.DEV) {
                console.log('[LogCapture] 日志已清空');
            }
        } catch {
            // Node.js 环境忽略
        }
    }
}

// 全局单例
export const logCapture = new LogCapture();

// 开发环境自动暴露到window
try {
    if (typeof window !== 'undefined' && (import.meta as any).env?.DEV) {
        (window as any).logCapture = logCapture;
        console.log('[LogCapture] 使用方法：\n  logCapture.start()     - 开始捕捉\n  logCapture.stop()      - 停止捕捉\n  logCapture.download()  - 下载日志\n  logCapture.getStats()  - 查看统计');
    }
} catch {
    // Node.js 环境忽略
}
