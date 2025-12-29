import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module 中的 __dirname 替代
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const projectRoot = path.resolve(__dirname, '..');
const scanDirs = ['src', 'server'];
const excludeDirs = ['node_modules', '.git', 'dist', 'build', 'deprecated'];
const extensions = ['.ts', '.tsx', '.js', '.jsx'];
const excludePatterns = [
    /\.css$/,           // 排除CSS文件
    /\/locales\//,      // 排除i18n配置文件
    /\.test\./,         // 排除测试文件
    /\.spec\./,         // 排除测试文件
];

// 文件行数阈值
const LINE_THRESHOLD = 500;

// 统计函数
function countLines(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n').length;
}

// 递归扫描目录
function scanDirectory(dir, results = []) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // 跳过排除的目录
            if (excludeDirs.includes(item)) continue;
            scanDirectory(fullPath, results);
        } else if (stat.isFile()) {
            const ext = path.extname(item);
            if (!extensions.includes(ext)) continue;

            // 检查排除模式
            const relativePath = path.relative(projectRoot, fullPath);
            if (excludePatterns.some(pattern => pattern.test(relativePath))) continue;

            const lines = countLines(fullPath);
            results.push({
                path: relativePath.replace(/\\/g, '/'),
                lines,
                size: stat.size
            });
        }
    }

    return results;
}

// 主逻辑
console.log('🔍 开始扫描项目文件...\n');

let allFiles = [];
for (const dir of scanDirs) {
    const fullDir = path.join(projectRoot, dir);
    if (fs.existsSync(fullDir)) {
        allFiles = allFiles.concat(scanDirectory(fullDir));
    }
}

// 按行数排序
allFiles.sort((a, b) => b.lines - a.lines);

// 筛选超过阈值的文件
const oversizedFiles = allFiles.filter(f => f.lines > LINE_THRESHOLD);

console.log(`📊 扫描完成，共 ${allFiles.length} 个文件`);
console.log(`⚠️  超过 ${LINE_THRESHOLD} 行的文件：${oversizedFiles.length} 个\n`);

if (oversizedFiles.length > 0) {
    console.log('='.repeat(80));
    console.log('超标文件列表（按行数降序）：');
    console.log('='.repeat(80));

    oversizedFiles.forEach((file, index) => {
        console.log(`\n${index + 1}. ${file.path}`);
        console.log(`   行数: ${file.lines} 行`);
        console.log(`   大小: ${(file.size / 1024).toFixed(2)} KB`);
        console.log(`   超出: ${file.lines - LINE_THRESHOLD} 行`);
    });

    console.log('\n' + '='.repeat(80));
    console.log(`\n总计: ${oversizedFiles.length} 个文件需要审查是否拆分`);
} else {
    console.log('✅ 所有文件均符合行数规范（≤500行）');
}

// 输出JSON格式供后续分析
const outputPath = path.join(projectRoot, '.antigravity', 'file_scan_result.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify({
    scanTime: new Date().toISOString(),
    totalFiles: allFiles.length,
    oversizedFiles: oversizedFiles,
    threshold: LINE_THRESHOLD
}, null, 2));

console.log(`\n📝 详细结果已保存至: ${path.relative(projectRoot, outputPath)}`);
