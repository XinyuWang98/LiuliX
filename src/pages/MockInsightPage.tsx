import { useState } from 'react';
import { ForestExplorer } from '../components/insights/forest/ForestExplorer';
import { InsightNode } from '../types/insightTree';
import { logger } from '@/utils/logger';

export function MockInsightPage() {
    const [mockNode, setMockNode] = useState<InsightNode>({
        id: 'root-1',
        depth: 0,
        title: '洞察建议1: 销售增长趋势',
        columnsUsed: ['sales_data.csv', 'revenue'],
        fileName: 'sales_data.csv',
        promptId: 'root-prompt',
        params: {},
        isLoading: false,
        isExpanded: true,
        result: {
            code: "df.groupby('quarter')['revenue'].sum().sort_values(ascending=False)",
            summary: "Revenue increased by 15% in Q3 driven by high-value customer acquisitions.",
            columnsUsed: ['revenue'],
            image: "", // Insert a dummy base64 or leaving empty to test layout
        },
        drillDownActions: [
            {
                label: '客户分析',
                promptId: 'analyze-customer',
                params: { method: 'segmentation' },
                isRecommended: true
            },
            {
                label: '地区分布',
                promptId: 'analyze-region',
                params: { method: 'heatmap' },
                isRecommended: true
            }
        ],
        children: [
            // Creating a child that matches "客户分析" action
            {
                id: 'child-1',
                depth: 1,
                title: '分析结果: 高价值客户',
                columnsUsed: ['customer_id', 'ltv'],
                promptId: 'analyze-customer', // MATCHES Action promptId
                params: { method: 'segmentation' }, // Partial match
                isLoading: false,
                isExpanded: true,
                drillDownActions: [
                    {
                        label: '客户流失',
                        promptId: 'analyze-churn',
                        params: {},
                        isRecommended: false
                    }
                ],
                children: [], // No grandchildren yet
                result: {
                    code: "df[df['ltv'] > 1000].groupby('segment').count()",
                    summary: "Found 150 high-value customers contributing 40% revenue.",
                    columnsUsed: ['ltv']
                }
            }
        ]
    });

    const handleDrillDown = (_node: InsightNode, action: any) => {
        logger.log('UI', 'Mock Drill Down', { data: action });
        // Simulate adding a child
        if (action.label === '地区分布') {
            const newChild: InsightNode = {
                id: `child-${Date.now()}`,
                depth: 1,
                title: '分析结果: 华东地区销量',
                columnsUsed: ['region', 'sales'],
                promptId: 'analyze-region', // Matches action
                params: action.params,
                isLoading: false,
                isExpanded: true,
                drillDownActions: [],
                children: [],
                result: {
                    code: "df.groupby('region')['sales'].sum()",
                    summary: "East China region shows highest growth.",
                    columnsUsed: ['region']
                }
            };

            setMockNode(prev => ({
                ...prev,
                children: [...prev.children, newChild]
            }));
        }
    };

    return (
        <div style={{ padding: '40px', background: '#101622', minHeight: '100vh', color: 'white' }}>
            <h2>Insight Mock Page (Action-Container Layout)</h2>
            <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                <ForestExplorer
                    nodes={[mockNode]}
                    columns={['date', 'revenue', 'cost', 'profit']}
                    onDrillDown={handleDrillDown}
                    onCustomAnalysis={(pid, params) => logger.log('UI', 'Custom:', { data: { pid, params } })}
                    onToggleExpand={(id) => {
                        // Simple toggle mock for root
                        if (id === mockNode.id) {
                            setMockNode(p => ({ ...p, isExpanded: !p.isExpanded }));
                        }
                    }}
                />
            </div>

            <div style={{ marginTop: '40px', padding: '20px', border: '1px solid #333' }}>
                <h3>Debug Info</h3>
                <p>Root Children Count: {mockNode.children.length}</p>
                <p>DrillDown Actions: {mockNode.drillDownActions.length}</p>
            </div>
        </div>
    );
}
