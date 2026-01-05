import { UserPrompt } from '@/types/prompt';

/**
 * L1 Prompt: Explorer General (Router) - English
 */
export const explorerGeneralPrompt: UserPrompt = {
    id: 'explorer-general-v1',
    name: 'explorer_general',
    title: 'Global Data Explorer',
    description: 'Analyze dataset overview, recommend most valuable analysis directions, and predict potential drill-down paths',

    slug: 'explorer-general-v1',
    packageId: 'basic',
    requiredPackages: ['pandas'],
    outputCharts: ['report'],

    layer: 'L1_DECISION',

    dimensions: [
        { category: 'industry', value: 'general', label: 'General' },
        { category: 'intent', value: 'exploration', label: 'Global Exploration' },
        { category: 'method', value: 'auto', label: 'Auto Recommend' },
        { category: 'output', value: 'report', label: 'Recommendation List' }
    ],

    relatedWorkerIds: ['worker-distribution-v1', 'worker-correlation-v1'],

    template: `
You are an experienced data scientist assistant.
Your task is to recommend 3 "most valuable" subsequent analysis actions based on the dataset summary and historical analysis records.

# Available Analysis Tools (Prompts)
| promptId | Name | Scenario | Required Params |
|----------|------|----------|-----------------|
| worker-distribution-v1 | Distribution | Distribution shape, skewness, categorical counts | column_name |
| worker-correlation-v1 | Correlation | Linear/Non-linear relationships, group differences | col_x, col_y |

# Dataset Summary
{{df_summary}}

# Analysis History (if any)
{{history}}

# Thinking Steps
1. If history exists, analyze what the user did before and recommend "follow-up" drill-downs.
2. Find key columns with high variance or significant business meaning (Recommend Distribution).
3. Find column combinations that may have causality or correlation (Recommend Correlation).
4. For each recommendation, predict the user's possible next drill-down action (drillHint).

# Output Requirements
Return a JSON object containing a "recommendations" array.
Each recommendation must include:
- promptId: Corresponding L2 Prompt ID (choose from table above)
- params: Parameter object (e.g., {"column_name": "xxx"} or {"col_x": "xxx", "col_y": "xxx"})
- reason: Recommendation reason (one sentence, in English)
- drillHint: Predicted drill-down suggestion (optional)
  - promptId: Drill-down Prompt ID
  - params: Drill-down parameters
  - label: Drill-down button label

# Output Format (JSON Only)
{
  "recommendations": [
    {
      "promptId": "worker-distribution-v1",
      "params": { "column_name": "Price" },
      "reason": "Price column has high variance, suggest checking its distribution to identify price ranges.",
      "drillHint": {
        "promptId": "worker-correlation-v1",
        "params": { "col_x": "Price", "col_y": "Area" },
        "label": "Analyze Price vs Area"
      }
    }
  ]
}
`,

    inputVariables: ['df_summary', 'history'],
    author: 'System',
    version: '2.0.0',
    isBuiltIn: true,
    isOfficial: true,
    updatedAt: Date.now()
};
