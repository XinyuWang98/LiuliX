// 中文翻译主入口（聚合所有模块）
import { LanguageConfig } from '@/types/i18n';
import { common, data, nav, sidebar, chat, language } from './common';
import { settings } from './settings';
import { prompt } from './prompt';
import { dataSource } from './dataSource';
import { fileUpload } from './fileUpload';
import { cleaning } from './cleaning';
import { themes, welcome, workshop, grid, pagination, workflow } from './misc';
import { insightChain, exploration, evidence, quality, report } from './analysis';
import { aiCost, aiRetry, cache, localModel, config } from './ai';
import { errors } from './errors';

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
    },
};
