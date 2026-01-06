// Batch Insight Generation Prompt (English Version)

/**
 * Generate AI prompt for batch insight suggestions (Internal - English)
 */
export function generateBatchInsightsPromptInternal(
    columns: string[],
    rowCount: number,
    totalRows: number,
    sampleData: any[]
): string {
    const columnList = columns.join(', ');

    // Handle BigInt serialization issue
    const sampleDataCleaned = sampleData.slice(0, 5).map(row => {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(row)) {
            cleaned[key] = typeof value === 'bigint' ? value.toString() : value;
        }
        return cleaned;
    });

    const sampleJson = JSON.stringify(sampleDataCleaned);

    return `You are a senior data analyst. Please analyze the following dataset and generate insight suggestions.

## Dataset Information
- Columns: ${columnList}
- Sampled rows: ${rowCount} rows
- Total rows: ${totalRows} rows
- Sample data:
${sampleJson}

## Requirements
Generate 3-5 data insight suggestions, each including:
1. title: Insight title
2. description: Insight description
3. columns_used: Array of column names used
4. full_mode.code: Complete Python analysis code
5. aggregated_mode.sql: DuckDB pre-aggregation SQL
6. aggregated_mode.viz_code: Visualization code

## Code Standards
- Use df as the data variable name
- Use matplotlib to generate charts
- Output format is JSON, containing image(base64) and summary
- **Important: Before performing numerical aggregation operations, ensure columns are numeric types (use pd.to_numeric(df['column'], errors='coerce'))**
- **Newlines in strings must use \\\\n escaping, do not directly line break inside single or double quotes**
- **Example: ax.text(0.5, 0.5, 'Line 1\\\\nLine 2') instead of ax.text(0.5, 0.5, 'Line 1 newline Line 2')**


## Output Format
[
    {
        "title": "Insight Title",
        "description": "Insight Description",
        "columns_used": ["Column1", "Column2"],
        "full_mode": {
            "code": "Complete Python Code"
        },
        "aggregated_mode": {
            "sql": "DuckDB SQL",
            "viz_code": "Visualization Code"
        }
    }
]

Please return the JSON array directly, without any other content.`;
}
