/**
 * 清洗Prompt批量升级脚本
 * 专门处理 seedCleaningPrompts.ts 中的15个清洗Prompt
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetFile = path.join(__dirname, '../src/services/prompts/seedCleaningPrompts.ts');

// 清洗Prompt统一配置
const CLEANING_CONFIG = {
    packageId: 'basic',
    requiredPackages: [],  // SQL清洗不需要Python包
    outputCharts: []       // 清洗不输出图表
};

// 处理文件
function upgradeCleaningPrompts() {
    let content = fs.readFileSync(targetFile, 'utf-8');
    const lines = content.split('\n');
    const result = [];

    let i = 0;
    while (i < lines.length) {
        const line = lines[i];

        // 检测是否是清洗Prompt的开始（id行）
        if (line.trim().startsWith('id: \'cleaner-')) {
            // 找到description行
            let descLine = i;
            while (descLine < lines.length && !lines[descLine].includes('description:')) {
                descLine++;
            }

            // 检查是否已有配置
            const nextLine = descLine + 1;
            if (nextLine < lines.length && lines[nextLine].includes('能力包配置')) {
                // 已有配置，跳过
                result.push(line);
                i++;
                continue;
            }

            // 添加当前行
            result.push(line);
            i++;

            // 继续添加到description行
            while (i <= descLine) {
                result.push(lines[i]);
                i++;
            }

            // 提取ID作为slug
            const idMatch = line.match(/id: '([^']+)'/);
            const slug = idMatch ? idMatch[1] : '';

            // 插入配置块
            const indent = '        ';
            result.push('');
            result.push(`${indent}// 能力包配置 (v2.1)`);
            result.push(`${indent}slug: '${slug}',`);
            result.push(`${indent}packageId: '${CLEANING_CONFIG.packageId}',`);
            result.push(`${indent}requiredPackages: [],`);
            result.push(`${indent}outputCharts: [],`);

            continue;
        }

        result.push(line);
        i++;
    }

    fs.writeFileSync(targetFile, result.join('\n'), 'utf-8');
    console.log('✅ 清洗Prompt元数据批量更新完成');
}

upgradeCleaningPrompts();
