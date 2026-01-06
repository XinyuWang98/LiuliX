/**
 * Evidence Chain - 语言路由加载器
 * 
 * 根据当前语言设置，动态加载对应语言版本的证据链生成器
 */

import { getCurrentLanguage } from '@/contexts/I18nContext';
import * as evidenceEn from './evidence_chain.en';
import * as evidenceZh from './evidence_chain.zh';

// 导出证据节点接口（使用中文版本作为主接口）
export type { 证据节点 } from './evidence_chain.zh';

// 预加载所有语言版本模块
const promptModules = {
    'en-US': evidenceEn,
    'zh-CN': evidenceZh
} as const;

/**
 * 生成证据链Prompt
 * 自动根据当前语言选择对应版本
 */
export function 生成证据链Prompt(
    异常摘要: string,
    相关数据?: any[]
): string {
    const lang = getCurrentLanguage();
    const module = promptModules[lang];
    return module.generateEvidenceChainPromptInternal(异常摘要, 相关数据);
}

/**
 * 解析证据链结果
 * 自动根据当前语言选择对应版本
 */
export function 解析证据链结果(AI返回结果: string): evidenceZh.证据节点 | null {
    const lang = getCurrentLanguage();
    const module = promptModules[lang];
    // 由于英文版和中文版的接口字段名不同，这里使用any来兼容
    return module.parseEvidenceChainResultInternal(AI返回结果) as any;
}
