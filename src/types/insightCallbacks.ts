/**
 * Insight Callbacks Type Definitions
 * 
 * 洞察分析模块的回调函数类型定义
 * 提供类型安全和代码复用
 * 
 * @author AntiGravity
 * @date 2026-01-09
 */

/**
 * 洞察采纳回调函数
 * 
 * 当用户点击洞察卡片的"采纳"按钮时触发
 * 
 * @param nodeId 被采纳的洞察节点ID
 * 
 * @example
 * ```typescript
 * const handleAdopt: InsightAdoptCallback = async (nodeId) => {
 *     console.log('采纳洞察:', nodeId);
 *     await triggerFollowUp(nodeId);
 * };
 * ```
 */
export type InsightAdoptCallback = (nodeId: string) => void | Promise<void>;

/**
 * 洞察状态变更回调函数
 * 
 * 当洞察卡片的采纳/忽略状态发生变化时触发
 * 
 * @param nodeId 节点ID
 * @param isAdopted 是否被采纳
 * @param isIgnored 是否被忽略
 * 
 * @example
 * ```typescript
 * const handleStatusChange: InsightStatusChangeCallback = (nodeId, isAdopted, isIgnored) => {
 *     updateInsightNode(nodeId, { isAdopted, isIgnored });
 * };
 * ```
 */
export type InsightStatusChangeCallback = (
    nodeId: string,
    isAdopted: boolean,
    isIgnored: boolean
) => void;

/**
 * 洞察忽略回调函数
 * 
 * 当用户点击洞察卡片的"忽略"按钮时触发
 * 
 * @param nodeId 被忽略的洞察节点ID
 */
export type InsightIgnoreCallback = (nodeId: string) => void | Promise<void>;

/**
 * 洞察下钻回调函数
 * 
 * 当用户点击洞察卡片的下钻按钮时触发
 * 
 * @param parentNodeId 父节点ID
 * @param drillAction 下钻动作配置
 */
export type InsightDrillDownCallback = (
    parentNodeId: string,
    drillAction: {
        promptId: string;
        label: string;
        params?: Record<string, any>;
    }
) => void | Promise<void>;
