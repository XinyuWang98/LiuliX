/**
 * DeepSeek API 响应时间基准测试
 * 
 * 使用方法：
 * node server/benchmark-deepseek.js
 */

const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

const API_KEY = process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY_INSIGHT || process.env.DEEPSEEK_API_KEY_CLEANING;
const API_URL = 'https://api.deepseek.com/v1/chat/completions';

if (!API_KEY) {
    console.error('❌ Error: DEEPSEEK_API_KEY (or INSIGHT/CLEANING variants) not found in .env.local');
    console.log('Loaded env from:', path.resolve(process.cwd(), '.env.local'));
    process.exit(1);
}

const prompts = [
    {
        name: 'Simple (Hello World)',
        content: 'Say hello in 5 words.'
    },
    {
        name: 'Medium (Data Cleaning Plan)',
        content: `I have a dataset with columns: id, name, age, salary, join_date. 
        Please suggest 3 data cleaning operations. Return JSON format.`
    },
    {
        name: 'Hard (Complex Analysis Plan)',
        content: `I have a sales dataset with 1 million rows: transaction_id, customer_id, product_id, category, amount, date, region.
        Please provide a detailed analysis plan to identify:
        1. Seasonal trends
        2. Top performing categories per region
        3. Customer retention rates
        4. Price elasticity
        
        For each point, suggest specific Python pandas code snippets and visualization libraries to use.
        Also suggest 3 hypothesis to test.
        Output must be in JSON format.`
    }
];

async function measureRequest(prompt) {
    const start = Date.now();
    try {
        const response = await axios.post(API_URL, {
            model: "deepseek-chat",
            messages: [{ role: "user", content: prompt.content }],
            stream: false
        }, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 60000
        });
        const duration = (Date.now() - start) / 1000;
        console.log(`✅ [${prompt.name}] Success: ${duration.toFixed(2)}s`);
        return duration;
    } catch (error) {
        const duration = (Date.now() - start) / 1000;
        console.error(`❌ [${prompt.name}] Failed after ${duration.toFixed(2)}s:`, error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
        return duration;
    }
}

async function runBenchmark() {
    console.log('🚀 Starting DeepSeek API Benchmark\n');
    console.log(`Target URL: ${API_URL}`);
    console.log(`Time Limit for Vercel Hobby: 10s\n`);

    const results = [];

    for (const prompt of prompts) {
        process.stdout.write(`Testing ${prompt.name}... `);
        const duration = await measureRequest(prompt);
        results.push({ name: prompt.name, duration });
    }

    console.log('\n📊 Benchmark Results:');
    console.table(results);

    const failCount = results.filter(r => r.duration > 10).length;
    if (failCount > 0) {
        console.log(`\n⚠️  Conclusion: ${failCount}/${results.length} requests exceeded the 10s limit.`);
        console.log('   Vercel Serverless (Hobby) is NOT suitable.');
    } else {
        console.log('\n✨ Conclusion: All requests finished within 10s.');
        console.log('   Vercel Serverless (Hobby) MIGHT be suitable (if network acts perfectly).');
    }
}

runBenchmark();
