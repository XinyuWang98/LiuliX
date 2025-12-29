interface InsightDetailViewProps {
    node: any; // TODO: 使用正确的InsightNode类型
}

/**
 * 洞察详情视图（临时占位组件）
 * TODO: 后续实现完整的洞察详情展示
 */
export function InsightDetailView({ node }: InsightDetailViewProps) {
    return (
        <div className="insight-detail-view">
            <h2>{node.title}</h2>
            <p>洞察详情内容（待实现）</p>
            {node.qualityScore && (
                <div className="score-display">
                    质量评分: {node.qualityScore}
                </div>
            )}
        </div>
    );
}
