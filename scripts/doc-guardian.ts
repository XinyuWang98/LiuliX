import fs from 'fs';
import path from 'path';
import process from 'process';

// Add colors for better CLI output
const colors = {
    red: (str: string) => `\x1b[31m${str}\x1b[0m`,
    green: (str: string) => `\x1b[32m${str}\x1b[0m`,
    yellow: (str: string) => `\x1b[33m${str}\x1b[0m`,
    blue: (str: string) => `\x1b[34m${str}\x1b[0m`,
    reset: '\x1b[0m'
};

const DOCS_ROOT = path.resolve(process.cwd(), 'docs');
const INDEX_FILE = path.resolve(process.cwd(), '📚文档导航.md');

// Configuration
const CONFIG = {
    categories: {
        '00-必读': { id: '00', name: '必读', alias: ['核心', '产品'] },
        '01-架构设计': { id: '01', name: '架构设计', alias: ['架构', '设计'] },
        '02-开发日志': { id: '02', name: '开发日志', alias: ['日志', '开发日志'] },
        '03-测试验证': { id: '03', name: '测试验证', alias: ['测试'] },
        '04-技术专题': { id: '04', name: '技术专题', alias: ['专题', '技术专题', '设计'] },
        '05-项目管理': { id: '05', name: '项目管理', alias: ['管理', '错误分析'] },
        '99-归档': { id: '99', name: '归档', alias: [] }
    }
};

/**
 * --- Shared Utils ---
 */
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
    const files = fs.readdirSync(dirPath);

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith('.md') && !file.toLowerCase().includes('readme')) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });

    return arrayOfFiles;
}

function getTitleFromMarkdown(filePath: string): string {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        for (const line of lines) {
            if (line.startsWith('# ')) {
                return line.replace('# ', '').trim();
            }
        }
    } catch (e) { }
    return path.basename(filePath, '.md');
}

/**
 * --- Module: LINT ---
 */
function runLint() {
    console.log(colors.blue('🔍 Starting Document Linting...'));
    let errors = 0;
    let checked = 0;

    const categories = Object.keys(CONFIG.categories);

    // 1. Check Root Directory Rules
    const rootDocs = fs.readdirSync(DOCS_ROOT).filter(f => f.endsWith('.md'));
    if (rootDocs.length > 0) {
        console.error(colors.red(`❌ Root Error: Docs root contains mkdown files: ${rootDocs.join(', ')}`));
        errors += rootDocs.length;
    }

    // 2. Check Each Category
    categories.forEach(category => {
        const catPath = path.join(DOCS_ROOT, category);
        if (!fs.existsSync(catPath)) return;

        console.log(`Checking ${category}...`);

        // Use recursive scan for 04-Tech and 99-Archive, shallow for others? 
        // Rule says 04 MUST use subdirs. 
        const isRecursive = category.startsWith('04') || category.startsWith('99');

        // Scan files
        const files = getAllFiles(catPath);

        // ID Uniqueness Check
        const idMap = new Map<string, string>();

        files.forEach(filePath => {
            checked++;
            const fileName = path.basename(filePath);
            const relPath = path.relative(DOCS_ROOT, filePath);

            // Skip README
            if (fileName.toLowerCase() === 'readme.md') return;
            // Skip Archive content for naming rules strictly? Maybe looser for archive.
            if (category.startsWith('99')) return;

            // Pattern: ID-Type-Name.md  (ID can be 2 or 3 digits)
            // e.g. 01-核心-概览.md
            const regex = /^(\d{2,3})-(.+)-(.+)\.md$/;
            const match = fileName.match(regex);

            if (!match) {
                console.error(colors.red(`  [Naming] Invalid Format: ${relPath}`));
                errors++;
                return;
            }

            const [, id, type, name] = match;

            // Logic: Check Type Alias
            const config = CONFIG.categories[category as keyof typeof CONFIG.categories];
            if (!config.alias.includes(type)) {
                console.warn(colors.yellow(`  [Naming] Unknown Type '${type}' in ${relPath}. Expected: ${config.alias.join(', ')}`));
                // Warn only, maybe strict match isn't required by regex but by convention
            }

            // Uniqueness
            if (idMap.has(id)) {
                console.error(colors.red(`  [Duplicate ID] ${id} used in ${relPath} AND ${idMap.get(id)}`));
                errors++;
            } else {
                idMap.set(id, relPath);
            }
        });
    });

    console.log('\nLint Summary:');
    if (errors === 0) {
        console.log(colors.green(`✅ All ${checked} files passed checks.`));
    } else {
        console.log(colors.red(`❌ Found ${errors} errors.`));
        process.exit(1);
    }
}

/**
 * --- Module: ARCHIVE ---
 */
function runArchive(args: string[]) {
    const yearArg = args.find(a => a.startsWith('--year='));
    const year = yearArg ? yearArg.split('=')[1] : null;
    const execute = args.includes('--execute');

    if (!year) {
        console.error(colors.red('Error: Please specify year with --year=YYYY'));
        process.exit(1);
    }

    console.log(colors.blue(`📦 Starting Check for Year: ${year}`));
    if (!execute) {
        console.log(colors.yellow('⚠️  DRY RUN MODE (No files will be moved)'));
        console.log('Use --execute to perform operation\n');
    }

    const targets = ['02-开发日志', '03-测试验证'];
    let moveList: { from: string, to: string }[] = [];

    targets.forEach(cat => {
        const catPath = path.join(DOCS_ROOT, cat);
        if (!fs.existsSync(catPath)) return;

        const files = fs.readdirSync(catPath).filter(f => f.endsWith('.md'));

        files.forEach(file => {
            const filePath = path.join(catPath, file);
            let isMatch = false;

            // 1. Check Filename
            if (file.includes(year!)) {
                isMatch = true;
            } else {
                // 2. Check Content (Header)
                try {
                    const content = fs.readFileSync(filePath, 'utf-8').slice(0, 500); // Read first 500 chars
                    // Check for Date: YYYY-MM-DD or 2025年
                    if (content.includes(`${year}-`) || content.includes(`${year}年`)) {
                        isMatch = true;
                    }
                } catch (e) { }
            }

            if (isMatch) {
                const targetDir = path.join(DOCS_ROOT, '99-归档', year!, cat);
                moveList.push({
                    from: filePath,
                    to: path.join(targetDir, file)
                });
            }
        });
    });

    if (moveList.length === 0) {
        console.log('No files found to archive.');
        return;
    }

    console.log(colors.blue(`Found ${moveList.length} files to archive:`));
    moveList.forEach(item => {
        const fromName = path.relative(process.cwd(), item.from);
        const toName = path.relative(process.cwd(), item.to);
        console.log(` ${fromName} -> ${toName}`);
    });

    if (execute) {
        console.log(colors.green('\nExecuting moves...'));
        moveList.forEach(item => {
            const targetDir = path.dirname(item.to);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }
            fs.renameSync(item.from, item.to);
            console.log(` moved: ${path.basename(item.from)}`);
        });
        console.log(colors.green('Archive Complete.'));
    } else {
        console.log(colors.yellow('\n[DRY RUN] Skipped actual move.'));
    }
}

/**
 * --- Module: INDEX ---
 */
function runIndex() {
    console.log(colors.blue('📑 Generating Index...'));

    let content = `# 📚 DataPrism 文档导航\n\n`;
    content += `> [!TIP]\n> 文档维护规则请参考: [06-核心-文档归类维护规则](docs/00-必读/06-核心-文档归类维护规则.md)\n\n`;
    content += `**最后更新**: ${new Date().toLocaleString()}\n\n`;

    const categories = Object.keys(CONFIG.categories).filter(c => c !== '99-归档'); // Explicitly handle archive later if needed

    categories.forEach(cat => {
        const catPath = path.join(DOCS_ROOT, cat);
        if (!fs.existsSync(catPath)) return;

        const config = CONFIG.categories[cat as keyof typeof CONFIG.categories];
        content += `## ${cat} (${config.name})\n\n`;

        // Special handling for 04-Tech (subdirs)
        if (cat.startsWith('04')) {
            const subdirs = fs.readdirSync(catPath).filter(f => fs.statSync(path.join(catPath, f)).isDirectory());
            subdirs.forEach(sub => {
                content += `### ${sub}\n`;
                const subFiles = getAllFiles(path.join(catPath, sub)).sort();
                subFiles.forEach(f => {
                    if (path.basename(f).includes('README')) return;
                    const title = getTitleFromMarkdown(f);
                    const relLink = path.relative(process.cwd(), f);
                    content += `- [${title}](${relLink})\n`;
                });
                content += '\n';
            });
        } else {
            // Flat structure for others
            const files = fs.readdirSync(catPath).filter(f => f.endsWith('.md')).sort();

            // Build table for better view? Or just list. 
            // Rules example used Table for some, List for others. Let's use List for simplicity and standard automation.
            // Or try to parse table? No, let's Stick to List to result in a clean output.

            files.forEach(file => {
                if (file.toLowerCase().includes('readme')) return;
                const fullPath = path.join(catPath, file);
                const title = getTitleFromMarkdown(fullPath);
                const relLink = path.relative(process.cwd(), fullPath);
                content += `- [${title}](${relLink})\n`;
            });
        }
        content += '\n';
    });

    // Handle Archive Link
    content += `## 🗄️ 归档 (Archive)\n`;
    content += `- [进入归档目录](docs/99-归档/)\n`;

    fs.writeFileSync(INDEX_FILE, content);
    console.log(colors.green(`✅ Successfully updated ${INDEX_FILE}`));
}


/**
 * --- Main Entry ---
 */
function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'lint':
            runLint();
            break;
        case 'archive':
            runArchive(args);
            break;
        case 'index':
            runIndex();
            break;
        default:
            console.log('Usage:');
            console.log('  npx tsx scripts/doc-guardian.ts lint');
            console.log('  npx tsx scripts/doc-guardian.ts index');
            console.log('  npx tsx scripts/doc-guardian.ts archive --year=YYYY [--execute]');
            process.exit(1);
    }
}

main();
