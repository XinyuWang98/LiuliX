export type BlockType = 'upload' | 'cleaning' | 'hypothesis' | 'insights' | 'report' | 'chat';

export interface ExplorationBlock {
    id: string;
    type: BlockType;
    title?: string; // Optional - defaults to translation based on type
    content: any; // 具体数据结构根据 type 不同而不同
    isCollapsed: boolean;
    isPinned: boolean;
    timestamp: number;
    // 引用其他块的 ID
    referenceId?: string;
}

export interface ExplorationAction {
    onToggleCollapse: (id: string) => void;
    onPin: (id: string) => void;
    onMoveUp: (id: string) => void;
    onAddToEvidence: (id: string) => void;
    onQuote: (id: string) => void;
    onDelete: (id: string) => void;
}
