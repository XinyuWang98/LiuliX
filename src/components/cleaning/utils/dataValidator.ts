// 数据验证工具函数

/**
 * 判断值是否为缺失值
 * @param val 待检查的值
 * @returns 是否为缺失值
 */
export const isMissing = (val: any): boolean => {
    if (val === null || val === undefined) return true;
    if (typeof val === 'string') {
        const trimmed = val.trim();
        return trimmed === '' || trimmed === '-' || trimmed === 'N/A' || trimmed === 'NA' ||
            trimmed === 'null' || trimmed === 'NULL' || trimmed === 'None' || trimmed === '#N/A';
    }
    return false;
};
