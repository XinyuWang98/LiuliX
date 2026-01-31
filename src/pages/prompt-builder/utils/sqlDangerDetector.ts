/**
 * SQL危险操作检测器
 * 用于识别可能造成数据损失或安全风险的SQL语句
 */

export type DangerType = 'DELETE' | 'DROP' | 'TRUNCATE' | 'ALTER' | 'UPDATE_WITHOUT_WHERE';
export type Severity = 'high' | 'medium' | 'low';

export interface DangerousOperation {
    type: DangerType;
    line: number;
    statement: string;
    severity: Severity;
    message: string;
}

/**
 * 检测SQL代码中的危险操作
 * @param code SQL代码字符串
 * @returns 危险操作数组
 */
export function detectDangerousSQL(code: string): DangerousOperation[] {
    const dangers: DangerousOperation[] = [];
    const lines = code.split('\n');

    lines.forEach((line, idx) => {
        const trimmed = line.trim();
        const upperLine = trimmed.toUpperCase();

        // 跳过注释行
        if (upperLine.startsWith('--') || upperLine.startsWith('/*') || !trimmed) {
            return;
        }

        // DELETE操作（高危）
        if (upperLine.match(/^\s*DELETE\s+FROM/i)) {
            const hasWhere = upperLine.includes('WHERE');
            dangers.push({
                type: 'DELETE',
                line: idx + 1,
                statement: trimmed,
                severity: hasWhere ? 'medium' : 'high',
                message: hasWhere
                    ? '检测到DELETE操作，请确保WHERE条件正确'
                    : '检测到DELETE操作且无WHERE条件，将删除所有数据！'
            });
        }

        // DROP操作（高危）
        if (upperLine.match(/^\s*DROP\s+(TABLE|DATABASE|SCHEMA)/i)) {
            dangers.push({
                type: 'DROP',
                line: idx + 1,
                statement: trimmed,
                severity: 'high',
                message: '检测到DROP操作，这将永久删除数据库对象！'
            });
        }

        // TRUNCATE操作（高危）
        if (upperLine.match(/^\s*TRUNCATE\s+(TABLE)?/i)) {
            dangers.push({
                type: 'TRUNCATE',
                line: idx + 1,
                statement: trimmed,
                severity: 'high',
                message: '检测到TRUNCATE操作，这将清空表中所有数据！'
            });
        }

        // ALTER操作（中危）
        if (upperLine.match(/^\s*ALTER\s+TABLE/i)) {
            dangers.push({
                type: 'ALTER',
                line: idx + 1,
                statement: trimmed,
                severity: 'medium',
                message: '检测到ALTER TABLE操作，可能影响表结构'
            });
        }

        // UPDATE without WHERE（高危）
        if (upperLine.match(/^\s*UPDATE\s+/i) && !upperLine.includes('WHERE')) {
            dangers.push({
                type: 'UPDATE_WITHOUT_WHERE',
                line: idx + 1,
                statement: trimmed,
                severity: 'high',
                message: 'UPDATE语句缺少WHERE条件，将影响所有行！'
            });
        }
    });

    return dangers;
}

/**
 * 获取危险操作的总结信息
 * @param dangers 危险操作数组
 * @returns 总结对象
 */
export function getDangerSummary(dangers: DangerousOperation[]): {
    total: number;
    high: number;
    medium: number;
    low: number;
} {
    return {
        total: dangers.length,
        high: dangers.filter(d => d.severity === 'high').length,
        medium: dangers.filter(d => d.severity === 'medium').length,
        low: dangers.filter(d => d.severity === 'low').length
    };
}
