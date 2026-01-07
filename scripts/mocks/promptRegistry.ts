/**
 * Mock PromptRegistry
 * 临时解决 verify-core.ts 中的 import 报错问题
 * 真实 PromptRegistry 依赖太多 Browser API (localStorage, Window, etc.)
 * 在 Node 环境中模拟其核心接口
 */

export const promptRegistry = {
    register: (prompt: any) => {
        console.log(`[MockRegistry] Registered: ${prompt.title}`);
        global.mockPrompts = global.mockPrompts || {};
        global.mockPrompts[prompt.id] = prompt;
    },
    getPrompt: (id: string) => {
        console.log(`[MockRegistry] Get: ${id}`);
        return global.mockPrompts ? global.mockPrompts[id] : undefined;
    }
};

// Polyfill global for storage
declare global {
    var mockPrompts: Record<string, any>;
}
