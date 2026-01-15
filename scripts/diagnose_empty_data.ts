
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5173';
const DATASET_PATH = path.resolve(__dirname, '../test_datasets/small_sales_100.csv');
const OUTPUT_FILE = path.resolve(__dirname, 'debug_failure_code.py');

(async () => {
    console.log('🔍 Starting Empty Data Diagnosis...');
    console.log(`📂 Dataset: ${DATASET_PATH}`);

    if (!fs.existsSync(DATASET_PATH)) {
        console.error('❌ Dataset not found!');
        process.exit(1);
    }

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1280, height: 800 }
    });

    try {
        const page = await browser.newPage();
        let lastGeneratedCode: string | null = null;
        let lastPromptId: string | null = null;

        // Monitor Console
        page.on('console', async msg => {
            const text = msg.text();
            const args = msg.args();

            // Log purely for debug (truncated)
            if (!text.includes('[fast_refresh]') && !text.includes('HMR')) {
                // console.log(`[Browser] ${text.substring(0, 100)}...`);
            }

            // Iterate over all args to find code or errors
            for (const arg of args) {
                try {
                    const val = await arg.jsonValue() as any;

                    // 1. Capture Generated Code
                    if (val && typeof val === 'object') {
                        // Check for standard log structure: { code: ... } (because logger unwraps options.data)
                        if (val.code) {
                            lastGeneratedCode = val.code;
                            console.log('📝 Captured generated code (Length: ' + lastGeneratedCode?.length + ')');
                        }
                        // Fallback: check nested just in case
                        else if (val.data && val.data.code) {
                            lastGeneratedCode = val.data.code;
                            console.log('📝 Captured generated code (Length: ' + lastGeneratedCode?.length + ')');
                        }
                    }

                    // 2. Capture Prompt ID
                    if (val && typeof val === 'object' && val.promptId) {
                        lastPromptId = val.promptId;
                        console.log(`👉 Treating Prompt: ${lastPromptId}`);
                    }

                    // 3. Detect Error inside Objects (e.g. JSHandle@error)
                    // The error might be a string in val.message or just the val itself if it's a string
                    const errStr = typeof val === 'string' ? val : (val.message || val.error || JSON.stringify(val));

                    if (errStr && (errStr.includes('ValueError: 绘图被拦截') || errStr.includes('检测到数据为空'))) {
                        console.error('🚨 [ERROR DETECTED] Empty Data Error found in object!');

                        if (lastGeneratedCode) {
                            console.log(`💾 Saving failing code to ${OUTPUT_FILE}...`);
                            const content = `# Prompt ID: ${lastPromptId || 'Unknown'}\n# Error: ${errStr}\n\n${lastGeneratedCode}`;
                            fs.writeFileSync(OUTPUT_FILE, content);
                            console.log('✅ Code saved. Exiting...');
                            await browser.close();
                            process.exit(0);
                        } else {
                            console.warn('❌ Error detected but no code was captured yet.');
                        }
                    }

                } catch (e) {
                    // Ignore circular json errors etc
                }
            }

            // Fallback: Check raw text for error key phrase
            if (text.includes('ValueError: 绘图被拦截') || text.includes('检测到数据为空')) {
                // ... same logic ...
                if (lastGeneratedCode) {
                    console.log(`💾 Saving failing code (from text match) to ${OUTPUT_FILE}...`);
                    const content = `# Prompt ID: ${lastPromptId || 'Unknown'}\n# Error Log: ${text}\n\n${lastGeneratedCode}`;
                    fs.writeFileSync(OUTPUT_FILE, content);
                    console.log('✅ Code saved. Exiting...');
                    await browser.close();
                    process.exit(0);
                }
            }
        });

        // Start Test Flow
        await page.goto(BASE_URL, { waitUntil: 'networkidle0' });

        // Clean state
        await page.evaluate(() => {
            localStorage.clear();
            localStorage.setItem('use_local_model', 'false');
            localStorage.setItem('app_has_run_before', 'true');
        });
        await page.reload({ waitUntil: 'networkidle0' });

        // Upload
        const inputUploadHandle = await page.$('input[type=file]');
        if (!inputUploadHandle) throw new Error('Upload input not found');
        await inputUploadHandle.uploadFile(DATASET_PATH);
        console.log('📤 Uploaded file, waiting for execution...');

        // Wait for max 2 minutes
        await new Promise(resolve => setTimeout(resolve, 120000));

        console.log('⏳ Timeout waiting for error. Maybe it passed?');

    } catch (e) {
        console.error('Fatal error:', e);
    } finally {
        await browser.close();
    }
})();
