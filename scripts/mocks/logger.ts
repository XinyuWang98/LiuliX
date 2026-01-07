/**
 * Mock Logger
 * 绕过真实 Logger 对 import.meta.env 的依赖
 */
export const logger = {
    log: (scope: string, msg: string, data?: any) => {
        // Simple console output for verification
        // console.log(`[${scope}] ${msg}`, data ? JSON.stringify(data).substring(0, 100) : '');
    },
    warn: (scope: string, msg: string, data?: any) => {
        console.warn(`[${scope}] ⚠️ ${msg}`);
    },
    error: (scope: string, msg: string, err?: any) => {
        console.error(`[${scope}] ❌ ${msg}`, err);
    },
    group: () => { },
    groupEnd: () => { }
};
