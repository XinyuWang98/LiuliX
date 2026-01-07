/**
 * Pip Install 注释生成器
 * 根据 Prompt 的 requiredPackages 生成 pip install 注释，支持 i18n
 * 
 * @author Agent
 * @date 2026-01-07
 */

/**
 * 生成 pip install 注释
 * 
 * @param packages 依赖包列表
 * @param lang 语言代码 ('zh-CN' | 'en-US')
 * @returns 格式化的注释字符串（包含换行符），如果无依赖则返回空字符串
 * 
 * @example
 * // 中文
 * generatePipComment(['pandas', 'numpy'], 'zh-CN')
 * // => "# [依赖安装] 运行前请先执行: pip install pandas numpy\n\n"
 * 
 * // 英文
 * generatePipComment(['pandas', 'numpy'], 'en-US')
 * // => "# [Dependencies] Run before execution: pip install pandas numpy\n\n"
 */
export function generatePipComment(packages: string[], lang: string): string {
    // 空包列表直接返回
    if (!packages || packages.length === 0) {
        return '';
    }

    // 去重并排序
    const uniquePackages = [...new Set(packages)].sort();
    const pipCmd = `pip install ${uniquePackages.join(' ')}`;

    // 根据语言返回不同注释
    if (lang.startsWith('zh')) {
        return `# [依赖安装] 运行前请先执行: ${pipCmd}\n\n`;
    }

    return `# [Dependencies] Run before execution: ${pipCmd}\n\n`;
}

/**
 * 为纯净代码添加依赖注释前缀
 * 
 * @param rawCode 纯净 Python 代码
 * @param packages 依赖包列表
 * @param lang 语言代码
 * @returns 带依赖注释的代码
 */
export function prependPipComment(
    rawCode: string,
    packages: string[],
    lang: string
): string {
    const comment = generatePipComment(packages, lang);
    return comment + rawCode;
}
