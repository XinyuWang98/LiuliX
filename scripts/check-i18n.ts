
import fs from 'fs';
import path from 'path';
import { zhCN } from '../src/locales/zh-CN/index.ts';
import { enUS } from '../src/locales/en-US/index.ts';
import { logger } from '../src/utils/logger';


// 扁平化对象，保留值用于校验
function flattenWithValues(obj: any, prefix = ''): Map<string, string> {
    let keys = new Map<string, string>();
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            const currentKey = prefix ? `${prefix}.${key}` : key;

            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                const childKeys = flattenWithValues(value, currentKey);
                childKeys.forEach((v, k) => keys.set(k, v));
            } else {
                keys.set(currentKey, String(value));
            }
        }
    }
    return keys;
}

// 递归查找 src 目录下所有的 .ts 和 .tsx 文件
function getAllFiles(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            getAllFiles(filePath, fileList);
        } else {
            // 扫描 .ts, .tsx 文件，排除 .d.ts
            if (/\.(ts|tsx)$/.test(file) && !file.endsWith('.d.ts')) {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}

// 提取文件中的 t('key') 用法
function scanKeysInFile(filePath: string): { key: string, line: number }[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const keys: { key: string, line: number }[] = [];

    // 正则匹配 t('key') 或 t("key")
    // 捕获组: t('common.ok')
    const regex = /\bt\(\s*(['"])([\w\.-]+)\1\s*[),]/g;

    let match;
    // 简单的行号计算
    while ((match = regex.exec(content)) !== null) {
        const key = match[2];
        const precedingContent = content.substring(0, match.index);
        const lineNumber = precedingContent.split('\n').length;
        keys.push({ key, line: lineNumber });
    }

    return keys;
}

// 检查字符串是否包含中文字符 (CJK Unified Ideographs)
function hasChineseChar(str: string): boolean {
    return /[\u4e00-\u9fff]/.test(str);
}

async function main() {
    logger.log('系统', '🔍 开始 i18n 深度扫描...');

    // 1. 加载已定义的 Keys 和 Values
    logger.log('系统', '📖 正在加载语言包定义...');
    const zhMap = flattenWithValues(zhCN.translations);
    const enMap = flattenWithValues(enUS.translations);

    // 只保留 Key 用于存在性检查
    const zhKeys = new Set(zhMap.keys());
    const enKeys = new Set(enMap.keys());

    logger.log('系统', `   - zh-CN: ${zhKeys.size} 个 keys`);
    logger.log('系统', `   - en-US: ${enKeys.size} 个 keys`);

    // 2. 扫描代码库
    const srcDir = path.resolve(process.cwd(), 'src');
    logger.log('系统', `📂 正在扫描源码目录: ${srcDir}`);
    const files = getAllFiles(srcDir);
    logger.log('系统', `   - 找到 ${files.length} 个文件`);

    const usedKeys = new Map<string, { file: string, line: number }[]>();

    files.forEach(file => {
        const found = scanKeysInFile(file);
        found.forEach(({ key, line }) => {
            if (!usedKeys.has(key)) {
                usedKeys.set(key, []);
            }
            usedKeys.get(key)!.push({ file: path.relative(process.cwd(), file), line });
        });
    });

    logger.log('系统', `   - 代码中使用了 ${usedKeys.size} 个唯一的 key`);

    // 3. 检测缺失的 Keys
    logger.log('系统', '\n❌ 正在检查 MISSING keys (代码中使用了但语言包没定义的)...');

    const missingZh: string[] = [];
    const missingEn: string[] = [];

    const sortedUsedKeys = Array.from(usedKeys.keys()).sort();

    sortedUsedKeys.forEach(key => {
        const inZh = zhKeys.has(key);
        const inEn = enKeys.has(key);

        if (!inZh) missingZh.push(key);
        if (!inEn) missingEn.push(key);
    });

    if (missingZh.length > 0) {
        console.log(`\n🇨🇳 [zh-CN] 缺失 ${missingZh.length} 个 keys:`);
        missingZh.forEach(key => {
            console.log(`   - ${key}`);
            const locs = usedKeys.get(key)!.slice(0, 3);
            locs.forEach(loc => console.log(`     at ${loc.file}:${loc.line}`));
            if (usedKeys.get(key)!.length > 3) console.log(`     ... 以及另外 ${usedKeys.get(key)!.length - 3} 处`);
        });
    } else {
        logger.log('系统', '✅ [zh-CN] 无缺失 Key。');
    }

    if (missingEn.length > 0) {
        console.log(`\n🇺🇸 [en-US] 缺失 ${missingEn.length} 个 keys:`);
        missingEn.forEach(key => {
            console.log(`   - ${key}`);
            const locs = usedKeys.get(key)!.slice(0, 3);
            locs.forEach(loc => console.log(`     at ${loc.file}:${loc.line}`));
        });
    } else {
        logger.log('系统', '✅ [en-US] 无缺失 Key。');
    }

    // 4. 检测未使用的 Keys
    logger.log('系统', '\n🗑️ 正在检查 UNUSED keys (语言包定义了但代码中未使用的)...');

    // 白名单：某些 Key 可能是动态拼接的，或者仅作为数据配置使用
    const whitelistPrefixes = ['themes.', 'prompt.', 'cleaning.validationError.'];

    const unusedZh: string[] = [];

    zhKeys.forEach(key => {
        // 如果代码中没找到这个 key
        if (!usedKeys.has(key)) {
            // 检查白名单
            const isWhitelisted = whitelistPrefixes.some(prefix => key.startsWith(prefix));
            if (!isWhitelisted) {
                unusedZh.push(key);
            }
        }
    });

    if (unusedZh.length > 0) {
        console.log(`\n⚠️ [zh-CN] 可能未使用的 ${unusedZh.length} 个 keys (已排除白名单):`);
        // 只显示前 50 个避免刷屏
        unusedZh.slice(0, 50).forEach(key => console.log(`   - ${key}`));
        if (unusedZh.length > 50) console.log(`   ... 还有 ${unusedZh.length - 50} 个`);
    } else {
        logger.log('系统', '✅ [zh-CN] 无冗余 Key (基于静态分析)。');
    }

    // 5. 语种一致性校验
    logger.log('系统', '\n🌍 正在检查语种一致性 (Consistency Check)...');

    const inconsistentZh: string[] = [];
    const inconsistentEn: string[] = [];

    // 检查 zh-CN: 理论上应该包含中文，或者至少不应该全是英文（除非是专业术语）
    // 策略：如果一个 Value 纯英文且长度 > 5，可能是漏翻译
    zhMap.forEach((value, key) => {
        // 忽略纯标点/数字
        if (!/[a-zA-Z]/.test(value)) return;

        // 简单启发式：不含中文 且 包含英文 且 长度 > 5
        if (!hasChineseChar(value) && /[a-zA-Z]{5,}/.test(value)) {
            // 排除一些显然的例外，如 URLs 或 ID
            if (!key.includes('url') && !key.includes('id') && !key.includes('code')) {
                inconsistentZh.push(`${key}: "${value}"`);
            }
        }
    });

    // 检查 en-US: 绝不应该包含中文
    enMap.forEach((value, key) => {
        if (hasChineseChar(value)) {
            inconsistentEn.push(`${key}: "${value}"`);
        }
    });

    if (inconsistentZh.length > 0) {
        console.log(`\n🤔 [zh-CN] 疑似未翻译 (${inconsistentZh.length} 个):`);
        inconsistentZh.forEach(item => console.log(`   - ${item}`));
    } else {
        logger.log('系统', '✅ [zh-CN] 语种一致性检查通过。');
    }

    if (inconsistentEn.length > 0) {
        console.log(`\n🚨 [en-US] 发现意外的中文字符 (${inconsistentEn.length} 个):`);
        inconsistentEn.forEach(item => console.log(`   - ${item}`));
    } else {
        logger.log('系统', '✅ [en-US] 语种一致性检查通过 (无中文字符)。');
    }

    // 总结
    console.log('\n--- 📊 最终总结 ---');

    // 只有缺失 Key 才是 Error，其他只是 Warning
    const hasCriticalErrors = missingZh.length > 0 || missingEn.length > 0;
    const hasWarnings = unusedZh.length > 0 || inconsistentEn.length > 0 || inconsistentZh.length > 0;

    if (hasCriticalErrors) {
        logger.error('系统', '❌ 检测到缺失的翻译 Key，请修复！');
        process.exit(1);
    } else if (hasWarnings) {
        logger.warn('系统', '⚠️  检测通过，但存在警告（未使用的 Key 或潜在的一致性问题），建议后续优化。');
        process.exit(0); // 允许通过
    } else {
        logger.log('系统', '🎉 完美！i18n 状态健康。');
        process.exit(0);
    }
}

main().catch(err => {
    logger.error('系统', '脚本执行出错', err);
    process.exit(1);
});
