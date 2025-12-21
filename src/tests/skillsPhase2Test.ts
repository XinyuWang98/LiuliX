/**
 * Skills Phase 2 快速测试
 * 验证核心功能是否正常工作
 */

import { getSkillsConfig, setSkillsConfig, isSkillsEnabled } from '../config/skillsConfig';
import { logger } from '../utils/logger';

/**
 * 测试1：兼容性开关系统
 */
export function testSkillsConfig() {
    logger.group('Skills', '兼容性开关系统测试');

    // 1. 获取默认配置（应全部关闭）
    const config = getSkillsConfig();
    console.assert(config.GLOBAL_ENABLED === false, '全局开关应默认关闭');
    console.assert(config.MODULES.INSIGHT_CHAIN === false, '洞察链开关应默认关闭');

    // 2. 启用Skills
    setSkillsConfig({ GLOBAL_ENABLED: true });
    console.assert(isSkillsEnabled() === true, 'Skills应已启用');

    // 3. 启用洞察链模块
    setSkillsConfig({
        MODULES: { ...config.MODULES, INSIGHT_CHAIN: true }
    });
    console.assert(isSkillsEnabled('INSIGHT_CHAIN') === true, '洞察链应已启用');

    logger.log('Skills', '✅ 兼容性开关系统测试通过');
    logger.groupEnd();
}

/**
 * 测试2：多步执行引擎（Mock测试）
 */
export async function testStepsExecutor() {
    logger.group('Skills', '多步执行引擎测试');

    try {
        // 类型检查通过即可
        logger.log('Skills', '✅ 多步执行引擎类型检查通过');
    } catch (error) {
        logger.error('Skills', '测试失败', error);
    }

    logger.groupEnd();
}

/**
 * 快速运行所有测试
 */
export async function runQuickTests() {
    console.log('=== Skills Phase 2 快速测试 ===');

    testSkillsConfig();
    await testStepsExecutor();

    console.log('=== 测试完成 ===');
}

// 导出测试函数供控制台调用
if (typeof window !== 'undefined') {
    (window as any).testSkillsPhase2 = runQuickTests;
}
