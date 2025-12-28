// 中文翻译主入口（聚合所有模块）
import { LanguageConfig } from '@/types/i18n';
import { common, data, nav, sidebar, chat, language, hardware } from './common';
import { settings } from './settings';
import { prompt } from './prompt';
import { dataSource } from './dataSource';
import { fileUpload } from './fileUpload';
import { cleaning } from './cleaning';
import { themes, workshop, grid, pagination, workflow } from './misc';
import welcome from './welcome';
import { insightChain, insight, exploration, evidence, quality, report } from './analysis';
import { aiCost, aiRetry, cache, localModel, config } from './ai';
import { errors } from './errors';
import { header, inviteCode } from './header';

export const zhCN: LanguageConfig = {
    code: 'zh-CN',
    name: '简体中文',
    translations: {
        common,
        data,
        nav,
        sidebar,
        chat,
        language,
        settings,
        prompt,
        dataSource,
        fileUpload,
        themes,
        welcome,
        workshop,
        cleaning,
        grid,
        pagination,
        workflow,
        insightChain,
        insight,
        exploration,
        evidence,
        quality,
        report,
        aiCost,
        aiRetry,
        cache,
        localModel,
        config,
        errors,
        hardware,
        header,
        inviteCode,
        // ✅ 新增：analysis别名和progress翻译
        analysis: {
            initializing: '正在准备分析环境...',
            readyHint: '点击"生成假设"开始分析',
            waitingForData: '等待数据就绪...',
        },
        progress: {
            generatingPrompt: '正在生成Prompt...',
            sendingRequest: '正在发送请求...',
        },
    },
};
