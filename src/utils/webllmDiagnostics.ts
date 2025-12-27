/**
 * WebLLM模型缓存诊断工具
 * 自动在页面加载时检查并输出到Console
 */

import { logger } from './logger';

export async function diagnoseWebLLMCache() {
    logger.group('诊断工具', 'WebLLM模型缓存诊断');

    try {
        // 1. 检查本地模型开关
        const useLocalModel = localStorage.getItem('use_local_model');
        logger.log('诊断工具', `本地模型开关: ${useLocalModel || '未设置'}`);

        if (!useLocalModel) {
            logger.warn('诊断工具', '建议设置: localStorage.setItem("use_local_model", "true")');
        }

        // 2. 列出所有IndexedDB数据库
        const databases = await indexedDB.databases();
        logger.log('诊断工具', 'IndexedDB数据库列表', { data: databases });

        const webllmDB = databases.find(db =>
            db.name?.toLowerCase().includes('webllm') ||
            db.name?.toLowerCase().includes('model') ||
            db.name?.toLowerCase().includes('mlc')
        );

        if (webllmDB) {
            logger.log('诊断工具', `找到WebLLM数据库: ${webllmDB.name} (版本: ${webllmDB.version})`);
        } else {
            logger.log('诊断工具', '未找到WebLLM相关数据库');
            logger.log('诊断工具', '这可能是首次使用，需要下载约2.5GB模型文件');
        }

        // 3. 检查浏览器存储使用情况
        const estimate = await navigator.storage.estimate();
        const usageMB = (estimate.usage! / 1024 / 1024).toFixed(0);
        const quotaGB = (estimate.quota! / 1024 / 1024 / 1024).toFixed(1);
        const usagePercent = ((estimate.usage! / estimate.quota!) * 100).toFixed(1);

        logger.log('诊断工具', '浏览器存储使用', {
            data: {
                已使用: `${usageMB} MB`,
                总配额: `${quotaGB} GB`,
                使用率: `${usagePercent}%`
            }
        });

        // 4. 检查模型配置
        logger.log('诊断工具', '当前模型配置: Qwen2.5-7B-Instruct-q4f16_1-MLC');

        // 5. 给出建议
        logger.log('诊断工具', '诊断结果:');
        if (!webllmDB && parseInt(usageMB) < 100) {
            logger.log('诊断工具', '❌ 模型未缓存，需要首次下载（约2.5GB）');
            logger.log('诊断工具', '建议:\n   1. 确保网络通畅（或开启代理）\n   2. 触发AI功能时会自动下载\n   3. 下载完成后会永久缓存');
        } else if (webllmDB) {
            logger.log('诊断工具', '✅ 模型已缓存，应该可以离线使用');
            logger.log('诊断工具', '如果仍然下载，可能是:\n   1. 浏览器缓存损坏，需要清理重新下载\n   2. IndexedDB权限问题');
        } else {
            logger.log('诊断工具', '⚠️ 有存储占用但未找到WebLLM数据库');
            logger.log('诊断工具', '可能需要清理浏览器缓存后重新下载');
        }

    } catch (error) {
        logger.error('诊断工具', '诊断过程出错', error);
    } finally {
        logger.groupEnd();
    }
}
