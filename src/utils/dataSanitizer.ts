/**
 * 数据脱敏工具
 * 用于在发送数据给AI前进行安全脱敏处理
 */

// ==================== 敏感列检测模式 ====================

const SENSITIVE_PATTERNS = {
    name: /name|姓名|用户名|userName|nickname|昵称/i,
    email: /email|邮箱|mail/i,
    phone: /phone|手机|电话|mobile|tel|联系方式/i,
    idCard: /id_card|身份证|idcard|识别号|identification/i,
    address: /address|地址|addr|住址/i,
    password: /password|密码|pwd|pass/i,
    bankCard: /bank|银行卡|card_no|卡号/i
};

// ==================== 类型定义 ====================

export interface DesensitizedColumnInfo {
    name: string;              // 列名（保留，AI需要理解语义）
    type: string;              // 数据类型
    nullable: boolean;
    isSensitive: boolean;      // 是否为敏感列

    // 统计信息
    stats: {
        totalRows: number;
        nullCount: number;
        nullRate: number;       // 百分比 0-100
        uniqueCount: number;

        // 数值列统计
        min?: number;
        max?: number;
        mean?: number;
        median?: number;

        // 文本列模式
        avgLength?: number;
        patternExample?: string;  // 如: "邮箱格式"
        topPatterns?: string[];   // 如: ["数字3位", "字母5位"]
    };

    // 脱敏样本（仅用于格式参考，不泄露真实数据）
    sampleValues?: string[];
}

export interface DataQualityIssue {
    severity: 'high' | 'medium' | 'low';
    column?: string;
    description: string;
}

// ==================== 敏感列检测 ====================

/**
 * 检测列是否为敏感列
 */
export function isSensitiveColumn(columnName: string): boolean {
    return Object.values(SENSITIVE_PATTERNS).some(pattern =>
        pattern.test(columnName)
    );
}

/**
 * 获取敏感列类型
 */
export function getSensitiveType(columnName: string): string | null {
    for (const [type, pattern] of Object.entries(SENSITIVE_PATTERNS)) {
        if (pattern.test(columnName)) {
            return type;
        }
    }
    return null;
}

// ==================== 脱敏函数 ====================

/**
 * 脱敏单个值
 */
export function desensitizeValue(
    value: any,
    columnName: string,
    dataType: string
): string {
    if (value === null || value === undefined) {
        return 'NULL';
    }

    const valueStr = String(value);
    const sensitiveType = getSensitiveType(columnName);

    // 根据敏感类型脱敏
    if (sensitiveType === 'idCard') {
        // 身份证: 保留前6位后4位，中间8位*
        if (valueStr.length === 18) {
            return valueStr.substring(0, 6) + '********' + valueStr.substring(14);
        }
        return '身份证格式';
    }

    if (sensitiveType === 'phone') {
        // 手机号: 保留前3位后4位，中间4位*
        if (valueStr.length === 11) {
            return valueStr.substring(0, 3) + '****' + valueStr.substring(7);
        }
        return '手机号格式';
    }

    if (sensitiveType === 'name') {
        // 姓名: 保留姓，名用*
        if (valueStr.length >= 2) {
            return valueStr.charAt(0) + '*'.repeat(valueStr.length - 1);
        }
        return '*';
    }

    if (sensitiveType === 'email') {
        // 邮箱: 保留前3位和@域名
        const atIndex = valueStr.indexOf('@');
        if (atIndex > 0) {
            const prefix = valueStr.substring(0, Math.min(3, atIndex));
            const domain = valueStr.substring(atIndex);
            return prefix + '***' + domain;
        }
        return '***@***.com';
    }

    if (sensitiveType === 'address') {
        // 地址: 只保留省/市级别
        if (valueStr.includes('省')) {
            const provinceEnd = valueStr.indexOf('省') + 1;
            return valueStr.substring(0, provinceEnd) + '***';
        }
        if (valueStr.includes('市')) {
            const cityEnd = valueStr.indexOf('市') + 1;
            return valueStr.substring(0, cityEnd) + '***';
        }
        return '地址信息';
    }

    if (sensitiveType === 'password') {
        // 密码: 完全隐藏
        return '******';
    }

    if (sensitiveType === 'bankCard') {
        // 银行卡: 保留前4位后4位
        if (valueStr.length >= 16) {
            return valueStr.substring(0, 4) + '********' + valueStr.substring(valueStr.length - 4);
        }
        return '卡号格式';
    }

    // 非敏感列，根据数据类型处理
    if (dataType.includes('INT') || dataType.includes('DOUBLE') || dataType.includes('FLOAT')) {
        // 数值: 保留数量级
        const num = parseFloat(valueStr);
        if (!isNaN(num) && num > 0) {
            const digits = Math.floor(Math.log10(Math.abs(num))) + 1;
            return `${digits}位数`;
        }
        return '数值';
    }

    if (dataType.includes('DATE') || dataType.includes('TIME')) {
        // 日期: 保留格式
        return 'YYYY-MM-DD格式';
    }

    // 其他文本: 保留长度和字符类型
    const charType = detectCharType(valueStr);
    return `${valueStr.length}字符(${charType})`;
}

/**
 * 检测字符类型
 */
function detectCharType(str: string): string {
    const hasNumber = /\d/.test(str);
    const hasLetter = /[a-zA-Z]/.test(str);
    const hasChinese = /[\u4e00-\u9fa5]/.test(str);

    const types: string[] = [];
    if (hasChinese) types.push('中文');
    if (hasLetter) types.push('字母');
    if (hasNumber) types.push('数字');

    return types.length > 0 ? types.join('+') : '其他';
}

// ==================== 元数据构建 ====================

/**
 * 构建脱敏后的列元数据
 */
export function buildDesensitizedMetadata(
    columns: any[],
    stats: any[]
): DesensitizedColumnInfo[] {
    return columns.map((col, index) => {
        const stat = stats[index] || {};
        const isSensitive = isSensitiveColumn(col.name);

        // 构建脱敏样本
        const sampleValues: string[] = [];
        if (stat.sampleData && Array.isArray(stat.sampleData)) {
            // 取前3个样本进行脱敏
            for (let i = 0; i < Math.min(3, stat.sampleData.length); i++) {
                const desensitized = desensitizeValue(
                    stat.sampleData[i],
                    col.name,
                    col.type
                );
                sampleValues.push(desensitized);
            }
        }

        // 构建模式示例
        let patternExample = '';
        if (isSensitive) {
            const sensitiveType = getSensitiveType(col.name);
            const patternMap: Record<string, string> = {
                'idCard': '身份证格式(18位)',
                'phone': '手机号格式(11位)',
                'name': '姓名格式(2-4字)',
                'email': '邮箱格式(xxx@xxx.com)',
                'address': '地址格式(省市区)',
                'password': '密码(已隐藏)',
                'bankCard': '银行卡号格式(16-19位)'
            };
            patternExample = patternMap[sensitiveType!] || '敏感信息';
        } else if (col.type.includes('VARCHAR')) {
            patternExample = `文本(平均${stat.avgLength || 0}字符)`;
        } else if (col.type.includes('INT') || col.type.includes('DOUBLE')) {
            patternExample = `数值(${stat.min || 0}-${stat.max || 0})`;
        } else if (col.type.includes('DATE')) {
            patternExample = '日期格式';
        }

        return {
            name: col.name,
            type: col.type,
            nullable: col.nullable || false,
            isSensitive,
            stats: {
                totalRows: stat.total || 0,
                nullCount: stat.nullCount || 0,
                nullRate: stat.total > 0 ? ((stat.nullCount || 0) / stat.total * 100) : 0,
                uniqueCount: stat.uniqueCount || 0,
                min: stat.min,
                max: stat.max,
                mean: stat.mean,
                median: stat.median,
                avgLength: stat.avgLength,
                patternExample,
                topPatterns: stat.topPatterns || []
            },
            sampleValues
        };
    });
}

/**
 * 生成数据质量问题列表
 */
export function generateQualityIssues(
    desensitizedData: DesensitizedColumnInfo[]
): DataQualityIssue[] {
    const issues: DataQualityIssue[] = [];

    for (const col of desensitizedData) {
        // 高缺失率
        if (col.stats.nullRate > 50) {
            issues.push({
                severity: 'high',
                column: col.name,
                description: `列"${col.name}"缺失率${col.stats.nullRate.toFixed(1)}%，严重影响数据质量`
            });
        } else if (col.stats.nullRate > 20) {
            issues.push({
                severity: 'medium',
                column: col.name,
                description: `列"${col.name}"缺失率${col.stats.nullRate.toFixed(1)}%`
            });
        }

        // 唯一值过少
        if (col.stats.uniqueCount === 1 && col.stats.totalRows > 1) {
            issues.push({
                severity: 'medium',
                column: col.name,
                description: `列"${col.name}"所有值相同，可能为冗余列`
            });
        }

        // 全空列
        if (col.stats.nullCount === col.stats.totalRows) {
            issues.push({
                severity: 'high',
                column: col.name,
                description: `列"${col.name}"全部为空值，建议删除`
            });
        }
    }

    return issues;
}
