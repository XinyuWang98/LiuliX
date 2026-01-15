/**
 * Feature Flags 配置 API
 * 提供核心Feature Flags的远程配置管理
 * 
 * @author Antigravity Agent
 * @date 2026-01-08
 */

/**
 * 核心Feature Flags配置（仅3个）
 * 从环境变量读取，支持生产/开发环境切换
 */
function getCoreFlags() {
    return {
        // 🔴 P0: 邀请码前置验证（生产环境必须远程控制）
        ENABLE_INVITE_CODE_GATE: process.env.ENABLE_INVITE_CODE_GATE === 'true',

        // 🟡 P1: 高级API配置界面（MVP阶段建议隐藏）
        ENABLE_ADVANCED_API_CONFIG: process.env.ENABLE_ADVANCED_API_CONFIG === 'true',

        // 🟢 P2: AST代码增强器（紧急回滚开关）
        USE_AST_CODE_ENHANCER: process.env.USE_AST_CODE_ENHANCER !== 'false', // 默认true
    };
}

/**
 * 注册Feature Flags路由
 * @param {express.Router} router - Express Router实例
 */
function registerConfigRoutes(router) {
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

module.exports = { registerConfigRoutes, getCoreFlags };
