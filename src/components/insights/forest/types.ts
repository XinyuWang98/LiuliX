import { InsightNode, DrillDownAction } from '@/types/insightTree';

/**
 * ForestNode 组件的 Props
 */
export interface ForestNodeProps {
    /** 节点数据 */
    node: InsightNode;
    /** 当前深度 (0=Root, 1=Child, 2=Grandchild) */
    depth: number;
    /** 父节点 ID (用于连线定位) */
    parentId?: string;
    /** 是否是该层级的最后一个节点 (用于连线样式) */
    isLast?: boolean;
    /** 切换展开/收起 */
    onToggle: (nodeId: string) => void;
    /** 执行下钻动作 */
    onDrillDown: (node: InsightNode, action: DrillDownAction) => void;
    /** 可用列名 (用于传给 InsightCard) */
    availableColumns: string[];
    /** 焦点处理 */
    onFocus?: (nodeId: string) => void;
    /** 采纳回调 */
    onAdopt?: () => void;
    /** 状态变更回调 (采纳/忽略) */
    onStatusChange?: (nodeId: string, isAdopted: boolean, isIgnored: boolean) => void;
}

/**
 * 连线坐标信息
 */
export interface ConnectionPoint {
    id: string;
    x: number;
    y: number;
    type: 'source' | 'target';
    depth: number;
    parentId?: string;
}

/**
 * 森林布局配置常量
 */
export const FOREST_CONFIG = {
    /** 卡片宽度 */
    CARD_WIDTH: 400,
    /** 层级水平间距 */
    LEVEL_SPACING: 80,
    /** 垂直间距 */
    NODE_SPACING: 24,
    /** 连接线颜色 */
    LINE_COLOR: 'var(--forest-line-color)',
    /** 连接线宽度 */
    LINE_WIDTH: 2,
};
