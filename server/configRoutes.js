/**
 * Feature Flags 配置 API
 * 提供核心Feature Flags的远程配置管理
 * 
 * @author Antigravity Agent
 * @date 2026-01-08
 */

/**
 * 核心Feature Flags配置（扩展为5个）
 * 从环境变量读取，支持生产/开发环境切换
 * 
 * @date 2026-02-03 v2.0 新增AI服务控制（REAL_AI_INSIGHT, ENABLE_LOCAL_ROUTER）
 */
export function getCoreFlags() {
    return {
        // 🔴 P0: 邀请码前置验证（生产环境必须远程控制）
        ENABLE_INVITE_CODE_GATE: process.env.ENABLE_INVITE_CODE_GATE === 'true',

        // 🟡 P1: 高级API配置界面（MVP阶段建议隐藏）
        ENABLE_ADVANCED_API_CONFIG: process.env.ENABLE_ADVANCED_API_CONFIG === 'true',

        // 🟢 P2: AST代码增强器（紧急回滚开关）
        USE_AST_CODE_ENHANCER: process.env.USE_AST_CODE_ENHANCER !== 'false', // 默认true

        // 🆕 P1: 真实AI洞察（生产环境启用DeepSeek API）
        REAL_AI_INSIGHT: process.env.REAL_AI_INSIGHT !== 'false', // 默认true

        // 🆕 P2: 本地Router AI（实验性功能，默认关闭）
        ENABLE_LOCAL_ROUTER: process.env.ENABLE_LOCAL_ROUTER === 'true', // 默认false
    };
}

/**
 * 注册Feature Flags路由
 * @param {express.Router} router - Express Router实例
 */
export function registerConfigRoutes(router) {
    /**
     * GET /config
     * 获取核心Feature Flags配置
     */
    router.get('/config', (req, res) => {
        const flags = getCoreFlags();

        console.log('[Feature Flags] 配置请求:', {
            ENABLE_INVITE_CODE_GATE: flags.ENABLE_INVITE_CODE_GATE,
            ENABLE_ADVANCED_API_CONFIG: flags.ENABLE_ADVANCED_API_CONFIG,
            USE_AST_CODE_ENHANCER: flags.USE_AST_CODE_ENHANCER,
            REAL_AI_INSIGHT: flags.REAL_AI_INSIGHT,
            ENABLE_LOCAL_ROUTER: flags.ENABLE_LOCAL_ROUTER,
        });

        res.json({
            success: true,
            data: {
                featureFlags: flags,
                timestamp: Date.now(),
                version: '1.0.0'
            }
        });
    });

    console.log('✅ Feature Flags 路由已注册: GET /config');
}

