/**
 * 自动化日志捕捉工具
 * 用于测试时自动收集所有日志，方便问题诊断
 */

interface LogEntry {
    timestamp: number;
    level: 'log' | 'warn' | 'error' | 'group' | 'groupEnd';
    service: string;
    message: string;
    data?: any;
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

        console.log('[LogCapture] 📝 开始捕捉日志');
    }

    /**
     * 停止捕捉日志
     */
    stop() {
        if (!this.isCapturing) return;

        this.isCapturing = false;
        console.log('[LogCapture] ⏹️ 停止捕捉日志', { totalLogs: this.logs.length });
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

        this.logs.push(entry);

        // 超过最大数量时删除最早的日志
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
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

        return JSON.stringify(exportData, null, 2);
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

            if (log.data) {
                lines.push('');
                lines.push('```json');
                lines.push(JSON.stringify(log.data, null, 2));
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
        console.log('[LogCapture] 💾 日志已下载', { filename });
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
            groupEnd: '📁'
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
        console.log('[LogCapture] 🗑️ 日志已清空');
    }
}

// 全局单例
export const logCapture = new LogCapture();

// 开发环境自动暴露到window
if (import.meta.env.DEV) {
    (window as any).logCapture = logCapture;
    console.log('[LogCapture] 💡 使用方法：');
    console.log('  logCapture.start()     - 开始捕捉');
    console.log('  logCapture.stop()      - 停止捕捉');
    console.log('  logCapture.download()  - 下载日志');
    console.log('  logCapture.getStats()  - 查看统计');
}
