export interface QualityIssue {
    type: 'missing_values' | 'duplicates' | 'outliers' | 'inconsistent_types';
    severity: 'low' | 'medium' | 'high';
    description: string;
    affectedCount: number;
    column?: string;
}

export interface QualityReport {
    score: number; // 0-100
    issues: QualityIssue[];
    summary: string;
    status: 'healthy' | 'warning' | 'critical';
}

/**
 * Service to perform quick, local data quality checks.
 * This runs synchronously on the client side to provide immediate feedback.
 */
export const DataQualityService = {
    /**
     * Assess the quality of the provided dataset.
     * @param data Array of row objects
     * @param columns Array of column definitions (optional, inferred from keys if missing)
     * @param t Translation function
     */
    assessQuality: (data: any[], columns: string[] | undefined, t: (key: string, params?: any) => string): QualityReport => {
        if (!data || data.length === 0) {
            return {
                score: 100,
                issues: [],
                summary: t('quality.noData'),
                status: 'healthy'
            };
        }

        const issues: QualityIssue[] = [];
        const totalRows = data.length;
        let totalDeductions = 0;

        // 1. Check for Missing Values
        const keys = columns || Object.keys(data[0]);

        keys.forEach(key => {
            let missingCount = 0;
            data.forEach(row => {
                const val = row[key];
                if (val === null || val === undefined || val === '') {
                    missingCount++;
                }
            });

            if (missingCount > 0) {
                const percentage = missingCount / totalRows;
                let severity: QualityIssue['severity'] = 'low';
                let deduction = 5;

                if (percentage > 0.1) {
                    severity = 'medium';
                    deduction = 10;
                }
                if (percentage > 0.3) {
                    severity = 'high';
                    deduction = 20;
                }

                issues.push({
                    type: 'missing_values',
                    severity,
                    description: t('quality.missingValues', { count: missingCount, column: key }),
                    affectedCount: missingCount,
                    column: key
                });

                totalDeductions += deduction;
            }
        });

        // 2. Check for Duplicates (Simple Row Equality)
        // To identify duplicates efficiently for large datasets without dragging perf too much
        // We'll use a set of stringified values for a "good enough" check on smaller datasets
        // or just sample check if data is huge. For now, full check.
        const seen = new Set<string>();
        let duplicateCount = 0;

        // optimization: only check first 5 columns for 'identity' to save time if many cols
        const checkKeys = keys.slice(0, 5);

        data.forEach(row => {
            // Create a signature based on checkKeys
            const signature = checkKeys.map(k => String(row[k])).join('|');
            if (seen.has(signature)) {
                duplicateCount++;
            } else {
                seen.add(signature);
            }
        });

        if (duplicateCount > 0) {
            const percentage = duplicateCount / totalRows;
            let severity: QualityIssue['severity'] = 'low';
            let deduction = 10;

            if (percentage > 0.05) {
                severity = 'medium';
                deduction = 20;
            }
            if (percentage > 0.2) {
                severity = 'high';
                deduction = 40;
            }

            issues.push({
                type: 'duplicates',
                severity,
                description: t('quality.duplicates', { count: duplicateCount }),
                affectedCount: duplicateCount
            });
            totalDeductions += deduction;
        }

        // Calculate Final Score
        const score = Math.max(0, 100 - totalDeductions);

        let status: QualityReport['status'] = 'healthy';
        if (score < 85) status = 'warning';
        if (score < 60) status = 'critical';

        // Summary
        let summary = t('quality.good');
        if (status === 'warning') summary = t('quality.needsReviews');
        if (status === 'critical') summary = t('quality.criticalIssues');

        return {
            score,
            issues,
            summary,
            status
        };
    }
};
