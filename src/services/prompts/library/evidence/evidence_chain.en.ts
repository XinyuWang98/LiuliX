/**
 * Evidence Chain Generation Prompt Template (English Version)
 * Generates tree-structured relationship paths: Anomaly → Cause → Supporting Data
 */

/**
 * Evidence chain node structure
 */
export interface EvidenceNode {
    id: string;
    title: string;
    description: string;
    children?: EvidenceNode[];
}

/**
 * Generate evidence chain prompt (Internal - English)
 * @param anomalySummary - Basic information about the current anomaly (e.g., "Row 37 contains duplicate data, value 'abc' appears twice")
 * @param relatedData - Optional data slice related to the anomaly (provides context)
 * @returns prompt string
 */
export function generateEvidenceChainPromptInternal(
    anomalySummary: string,
    relatedData?: any[]
): string {
    const dataContext = relatedData
        ? JSON.stringify(relatedData.slice(0, 5)) // Only take first 5 to prevent excessive length
        : 'No additional data slice';

    return `
You are a professional data traceability analyst. The following anomaly has been detected:

Anomaly Description: ${anomalySummary}
Related Data Sample: ${dataContext}

Please construct a complete evidence chain showing the possible sources and downstream impacts of the anomaly.
Output must be pure JSON, strictly following the structure below (no explanations, markdown, or formatting notes):

{
  "id": "root",
  "title": "Data Anomaly Root Node",
  "description": "${anomalySummary}",
  "children": [
    {
      "id": "source1",
      "title": "Upstream Source 1",
      "description": "Brief description, e.g.: Crawler-scraped Table A.user_id field",
      "children": []  // Can continue nesting; leave empty array if no children
    },
    {
      "id": "source2",
      "title": "Upstream Source 2",
      "description": "Brief description, e.g.: Manually uploaded CSV file row 37"
    },
    {
      "id": "impact1",
      "title": "Downstream Impact 1",
      "description": "Brief description, e.g.: Report page statistics total deviation +1"
    }
  ]
}

Requirements:
- Total children: 2-4 (at least 1 source + 1 impact)
- Each description should not exceed 30 words
- Use simple numbering for id: source1/source2/impact1/impact2, etc.
- Output JSON only, no other text
`.trim();
}

/**
 * Parse AI-returned evidence chain result (Internal - English)
 * @param aiResponse - Raw text returned by Gemini API (expected to be JSON string)
 * @returns Tree-structured evidence chain data; returns null if parsing fails (frontend can display "No evidence chain available")
 */
export function parseEvidenceChainResultInternal(aiResponse: string): EvidenceNode | null {
    try {
        // Try to parse JSON directly
        const parsed = JSON.parse(aiResponse.trim());

        // Basic validation: must have id, title, description
        if (
            parsed &&
            typeof parsed === 'object' &&
            parsed.id &&
            parsed.title &&
            parsed.description &&
            Array.isArray(parsed.children)
        ) {
            return parsed as EvidenceNode;
        }

        return null;
    } catch (e) {
        // If JSON parsing fails, try to extract possible remaining JSON block from text
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const fallback = JSON.parse(jsonMatch[0]);
                if (fallback && typeof fallback === 'object') {
                    return fallback as EvidenceNode;
                }
            } catch {
                // Complete failure
            }
        }

        console.warn('Evidence chain parsing failed, returning null', e);
        return null;
    }
}
