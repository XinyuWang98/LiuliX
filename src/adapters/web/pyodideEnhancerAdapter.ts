/**
 * Pyodide增强器适配器
 * 
 * Web端适配层，负责：
 * 1. 加载Pyodide环境
 * 2. 安装liulix-code-enhancer Python包
 * 3. 提供TypeScript接口供业务代码调用
 * 
 * @author AntiGravity
 * @date 2026-01-03
 */

import { logger } from '@/utils/logger';

export interface EnhanceContext {
    columns: string[];
    dfName?: string;
    promptType?: string;
}

export interface EnhancementResult {
    code: string;
    rulesApplied: string[];
    originalLength: number;
    enhancedLength: number;
    stats: Record<string, any>;
    success: boolean;
    error?: string;
}

export class PyodideEnhancerAdapter {
    private static pyodide: any = null;
    private static initPromise: Promise<void> | null = null;
    private static isReady = false;

    /**
     * 初始化Pyodide环境（单例模式）
     */
    static async init(): Promise<void> {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = (async () => {
            try {
                logger.log('AI服务', 'Pyodide环境初始化中...');

                // 动态导入pyodide（避免SSR问题）
                const { loadPyodide } = await import('pyodide');

                //加载Pyodide
                this.pyodide = await loadPyodide({
                    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'  // 与主应用worker版本保持一致
                });

                logger.log('AI服务', 'Pyodide核心加载完成');

                // 安装liulix-code-enhancer
                // TODO: 生产环境从PyPI安装，开发环境从本地wheel安装
                await this.installEnhancer();

                this.isReady = true;
                logger.log('AI服务', 'Pyodide环境初始化完成');

            } catch (error: any) {
                logger.error('AI代码增强', 'Pyodide初始化失败', error);
                throw error;
            }
        })();

        return this.initPromise;
    }

    /**
     * 安装liulix-code-enhancer包
     */
    private static async installEnhancer(): Promise<void> {
        try {
            // 方案1: 从PyPI安装（生产环境）
            // await this.pyodide.loadPackage('micropip');
            // await this.pyodide.runPythonAsync(`
            //     import micropip
            //     await micropip.install('liulix-code-enhancer')
            // `);

            // 方案2: 从本地wheel安装（开发环境）
            // 将wheel文件放在public目录下
            const wheelUrl = '/packages/liulix_code_enhancer-1.0.0-py3-none-any.whl';

            await this.pyodide.loadPackage('micropip');
            await this.pyodide.runPythonAsync(`
import micropip
await micropip.install('${wheelUrl}')
            `);

            logger.log('AI代码增强', 'liulix-code-enhancer包安装完成');

        } catch (error: any) {
            logger.error('AI代码增强', '包安装失败', error);
            throw new Error(`无法安装liulix-code-enhancer: ${error.message}`);
        }
    }

    /**
     * 增强Python代码
     * 
     * @param code 原始Python代码
     * @param context 增强上下文
     * @returns 增强结果
     */
    static async enhance(
        code: string,
        context: EnhanceContext
    ): Promise<EnhancementResult> {

        // 确保初始化完成
        if (!this.isReady) {
            await this.init();
        }

        const startTime = performance.now();

        try {
            // 转义代码中的特殊字符
            const escapedCode = this.escapeCode(code);

            // 调用Python增强器
            const resultJson = await this.pyodide.runPythonAsync(`
import json
from liulix_enhancer import CodeEnhancer

# 创建增强器
enhancer = CodeEnhancer(
    columns=${JSON.stringify(context.columns)},
    df_name='${context.dfName || 'df'}'
)

# 增强代码
result = enhancer.enhance('''${escapedCode}''')

# 返回JSON
json.dumps(result)
            `);

            // 解析结果
            const result = JSON.parse(resultJson);
            const duration = performance.now() - startTime;

            // 记录成功日志
            logger.log('AI代码增强', '代码增强完成', {
                data: {
                    duration: `${duration.toFixed(1)}ms`,
                    success: result.success,
                    rulesApplied: Object.keys(result.stats || {}).length
                }
            });

            // 返回增强结果
            return {
                code: result.code,
                rulesApplied: Object.keys(result.stats || {}),
                originalLength: code.length,
                enhancedLength: result.code.length,
                stats: result.stats || {},
                success: result.success,
                error: result.error
            };

        } catch (error: any) {
            const duration = performance.now() - startTime;
            logger.error('AI代码增强', '代码增强失败', {
                error: error.message,
                duration: `${duration.toFixed(1)}ms`
            });

            // 降级：返回原代码
            return {
                code,
                rulesApplied: [],
                originalLength: code.length,
                enhancedLength: code.length,
                stats: {},
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 转义代码中的特殊字符
     */
    private static escapeCode(code: string): string {
        return code
            .replace(/\\/g, '\\\\')  // 反斜杠
            .replace(/'''/g, '\\\'\\\'\\\'')  // 三引号
            .replace(/\n/g, '\\n');  // 换行
    }

    /**
     * 检查是否已准备就绪
     */
    static isInitialized(): boolean {
        return this.isReady;
    }

    /**
     * 获取Pyodide实例（用于调试）
     */
    static getPyodide(): any {
        return this.pyodide;
    }
}
