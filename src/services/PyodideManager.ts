import { logger } from '../utils/logger';
import {
    getEnabledPackages,
    getEnabledFonts,
    getPyodidePackagesToLoad,
    chartFonts
} from '../config/analysisPackages';
import { canExecuteWithLibraries } from '../utils/libraryChecker';
import { LibraryMissingStrategy } from '../types/analysisPackage';

export interface PyodideResponse {
    id: string;
    type: 'SUCCESS' | 'ERROR' | 'STATUS' | 'READY';
    result?: any;
    error?: string;
    message?: string;
}

class PyodideManager {
    private worker: Worker | null = null;
    private listeners: Map<string, (response: PyodideResponse) => void> = new Map();
    private readyResolver: (() => void) | null = null;
    private isReady: boolean = false;
    private readyPromise: Promise<void>;

    constructor() {
        this.readyPromise = new Promise((resolve) => {
            this.readyResolver = resolve;
        });
    }

    public async initialize(onProgress?: (msg: string, progress: number) => void) {
        if (this.worker) return;

        // Create worker using Vite's worker import syntax
        this.worker = new Worker(new URL('../workers/pyodide/worker.ts', import.meta.url), {
            type: 'module',
        });

        this.worker.onmessage = (event) => {
            const data = event.data as PyodideResponse;

            if (data.type === 'READY') {
                // 原有的单一加载逻辑已移除，改由 App.tsx 显式调用 loadEssentials
                this.isReady = true;
                if (this.readyResolver) this.readyResolver();
            } else if (data.type === 'STATUS') {
                // 透传 Worker 的进度消息
                if (onProgress) {
                    onProgress(data.message || 'Loading...', 0);
                }
                logger.log('Python', `状态: ${data.message}`);
            } else {
                // Handle request responses
                if (data.id && this.listeners.has(data.id)) {
                    // 🔍 性能埋点日志透传
                    if (data.type === 'SUCCESS' && data.result?.textOutput) {
                        const text = data.result.textOutput as string;
                        // 提取所有 [Perf] 开头的行并打印
                        const perfLines = text.split('\n').filter(line => line.trim().startsWith('[Perf]'));
                        perfLines.forEach(line => logger.log('Python', line.trim()));
                    }

                    this.listeners.get(data.id)!(data);
                    this.listeners.delete(data.id);
                }
            }
        };
    }

    /**
     * Phase 1: 加载核心环境 (Blocking)
     * 仅加载 pandas, numpy, matplotlib 等基础包
     */
    public async loadEssentials(onProgress?: (msg: string) => void) {
        await this.waitForReady();
        // 核心包其实在 worker 启动时已经由 Pyodide 自动加载了 (loadPyodideAndPackages)
        // 这里主要做一些基础配置或检查，或者在此处显式加载核心包以获得进度
        // 目前 worker.ts 中是自动加载的，所以这里暂且保留为空，
        // 但为了统一接口，可以在 worker 中把自动加载改为等待指令。
        // 为最小化改动，假设 worker 启动完毕即代表核心包就绪。
        if (onProgress) onProgress('Core packages ready');
    }

    /**
     * Phase 2: 加载用户扩展包 (Silent/Background)
     * 根据设置加载 scikit-learn, statsmodels 等
     */
    public async loadUserConfigExtensions(onProgress?: (msg: string) => void) {
        await this.waitForReady();

        // 1. 获取用户启用的包
        const enabledIds = getEnabledPackages();
        // 核心包ID，不需要重复加载
        const coreIds = ['basic'];

        // 过滤出需要加载的扩展包 ID
        const extensionIds = enabledIds.filter(id => !coreIds.includes(id));

        // 计算对应的 Pyodide 包名
        const packagesToLoad = getPyodidePackagesToLoad(extensionIds);

        if (packagesToLoad.length > 0) {
            logger.log('Python', `[后台] 正在静默加载扩展包: ${packagesToLoad.join(', ')}`);
            if (onProgress) onProgress(`Loading extensions: ${packagesToLoad.join(', ')}`);
            await this.sendMessage('LOAD_PACKAGES', { packages: packagesToLoad });
        }

        // 2. 加载字体 (通常很快，也可以放在这里)
        const { fonts } = getEnabledFonts(undefined);
        if (fonts.length > 0) {
            const fontId = fonts[0];
            const fontConfig = chartFonts.find(f => f.id === fontId);
            if (fontConfig) {
                await this.loadFont(fontConfig.fontUrl, fontConfig.fontFile);
            }
        }
    }

    public async waitForReady() {
        if (this.isReady) return;
        return this.readyPromise;
    }

    /**
     * 检查并安装指定的Python库
     * @param requiredPackages - Prompt需要的库列表
     * @param onProgress - 进度回调
     */
    public async ensurePackagesInstalled(
        requiredPackages: string[],
        onProgress?: (msg: string) => void
    ): Promise<void> {
        if (!requiredPackages || requiredPackages.length === 0) {
            return;
        }

        const { missingLibraries, strategy } = canExecuteWithLibraries(requiredPackages);

        // ✅ 仅在 FILTER_SUGGESTIONS 模式下检查用户是否启用
        if (strategy === LibraryMissingStrategy.FILTER_SUGGESTIONS && missingLibraries.length > 0) {
            throw new Error(`以下库未启用: ${missingLibraries.join(', ')}。请在设置中启用或切换为"自动加载"模式。`);
        }

        // ✅ 无条件发送所有 requiredPackages，让 Worker 的 micropip 自己判断
        // micropip 会自动跳过已安装的包，无需在此处过滤
        logger.log('Python库配置', '确保库已安装', {
            data: { packages: requiredPackages.join(', ') }
        });

        if (onProgress) {
            onProgress(`正在检查/安装 ${requiredPackages.join(', ')}...`);
        }

        await this.sendMessage('LOAD_PACKAGES', { packages: requiredPackages });

        logger.log('Python库配置', '库检查/安装完成', {
            data: { packages: requiredPackages.join(', ') }
        });
    }

    public async runPython(code: string, requiredPackages?: string[]): Promise<any> {
        await this.waitForReady();

        // 在执行代码前检查并安装所需的库
        if (requiredPackages && requiredPackages.length > 0) {
            await this.ensurePackagesInstalled(requiredPackages);
        }

        return this.sendMessage('RUN_CODE', code);
    }

    public async loadData(filename: string, csvContent: string): Promise<any> {
        await this.waitForReady();
        return this.sendMessage('LOAD_DATA', { filename, csv: csvContent });
    }

    /**
     * 从文件内容加载数据到 DataFrame
     * @param fileContent - 文件内容（CSV/JSON 字符串）
     * @param fileType - 文件类型 ('csv' | 'json')
     * @param options - 加载选项
     * @returns DataFrameInfo 对象
     */
    public async loadDataFromFile(
        fileContent: string,
        fileType: 'csv' | 'json',
        options: { maxRows?: number; sample?: boolean } = {}
    ): Promise<any> {
        await this.waitForReady();
        return this.sendMessage('LOAD_DATA_FILE', {
            content: fileContent,
            fileType,
            options,
            transferMethod: 'JSON'  // 明确标记为 JSON 传输
        });
    }

    /**
     * 🆕 从 DuckDB 加载数据到 DataFrame（支持 Arrow 传输）
     * @param engine - DuckDBEngine 实例
     * @param tableName - 表名
     * @param options - 加载选项
     * @returns DataFrameInfo 对象
     */
    public async loadDataFromDuckDB(
        engine: any,  // DuckDBEngine 类型
        tableName: string,
        options: {
            maxRows?: number;
            transferMethod?: 'ARROW' | 'ARROW_SAMPLED' | 'JSON';
        } = {}
    ): Promise<any> {
        await this.waitForReady();

        const { transferMethod = 'ARROW', maxRows } = options;

        // 根据传输方案选择不同的导出方式
        if (transferMethod.startsWith('ARROW')) {
            // Arrow 传输路径
            const arrowBuffer = await engine.exportArrowTable(tableName, maxRows);

            logger.log('AI服务', 'Arrow 数据导出完成', {
                data: {
                    table: tableName,
                    bufferSize: `${(arrowBuffer.length / 1024 / 1024).toFixed(2)}MB`,
                    maxRows
                }
            });

            return this.sendMessage('LOAD_DATA_FILE', {
                content: arrowBuffer,
                fileType: 'arrow',  // 新类型标识
                options: { maxRows },
                transferMethod
            });

        } else {
            // JSON 传输路径（降级）
            const rows = await engine.runQuery(`SELECT * FROM ${tableName}${maxRows ? ` LIMIT ${maxRows}` : ''}`);
            const jsonContent = JSON.stringify(rows);

            logger.log('AI服务', 'JSON 数据导出完成', {
                data: {
                    table: tableName,
                    dataSize: `${(jsonContent.length / 1024 / 1024).toFixed(2)}MB`,
                    maxRows
                }
            });

            return this.sendMessage('LOAD_DATA_FILE', {
                content: jsonContent,
                fileType: 'json',
                options: { maxRows },
                transferMethod: 'JSON'
            });
        }
    }

    /**
     * 计算 DataFrame 的列统计信息
     * @returns ColumnStats[] 数组
     */
    public async calculateColumnStats(): Promise<any> {
        await this.waitForReady();
        return this.sendMessage('CALCULATE_STATS', {});
    }

    /**
     * 获取 DataFrame 预览数据（前 N 行）
     * @param rows - 获取的行数，默认 100
     * @returns 二维数组数据
     */
    public async getPreviewData(rows: number = 100): Promise<any> {
        await this.waitForReady();
        return this.sendMessage('GET_PREVIEW', { rows });
    }

    /**
     * 动态加载字体文件到 Pyodide (解决中文乱码)
     * @param fontUrl - 字体文件URL
     * @param fontName - 字体文件名 (如 'SimHei.ttf')
     */
    public async loadFont(fontUrl: string, fontName: string): Promise<any> {
        await this.waitForReady();
        return this.sendMessage('LOAD_FONT_URL', { url: fontUrl, name: fontName });
    }

    /**
     * 写入文件到 Pyodide 虚拟文件系统
     * @param filename - 文件名
     * @param binaryContent - 二进制内容
     */
    public async writeFile(filename: string, binaryContent: Uint8Array): Promise<any> {
        await this.waitForReady();
        return this.sendMessage('WRITE_FILE', { filename, content: binaryContent });
    }

    /**
     * 加载中文字体（Source Han Sans CN）
     * 注意：异步执行，失败不影响主流程
     */
    public async loadChineseFont(): Promise<void> {
        try {
            await this.sendMessage('LOAD_FONT_URL', {
                url: 'https://cdn.jsdelivr.net/gh/be5invis/source-han-sans-ttf/SubsetOTF/CN/SourceHanSansCN-Regular.otf',
                name: 'SourceHanSansCN.otf'
            });
            logger.log('Python', '中文字体加载成功');
        } catch (err) {
            logger.warn('Python', '中文字体加载失败（不影响功能）', { error: String(err) });
        }
    }

    private sendMessage(type: string, content: any): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.worker) {
                reject(new Error('Pyodide worker not initialized.'));
                return;
            }

            const id = Math.random().toString(36).substring(7);

            this.listeners.set(id, (response) => {
                if (response.type === 'SUCCESS') {
                    resolve(response.result);
                } else {
                    reject(new Error(response.error || 'Unknown worker error'));
                }
            });

            this.worker.postMessage({ id, type, content });
        });
    }

    /**
     * 加载用户配置的包和字体
     */

}

export const pyodideManager = new PyodideManager();
