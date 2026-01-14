// 英文翻译主入口（已模块化，对齐zh-CN结构）
import { LanguageConfig } from '@/types/i18n';
import { common, data, nav, sidebar, language } from './common';
import { prompt } from './prompt';
import { settings } from './settings';
import welcome from './welcome';
import { workbench } from './workbench';
import { whitepaper } from './whitepaper';
import { fileUpload } from './fileUpload';
import { dataSource } from './dataSource';
import { themes, workshop, workflow, grid, pagination } from './misc';
import { cleaning } from './cleaning';
import { analysis, quality, insightChain, insight, exploration, evidence, report, progress } from './analysis';
import { aiCost, aiRetry, cache, localModel, config } from './ai';
import { errors } from './errors';
import { packages } from './packages';

export const enUS: LanguageConfig = {
    code: 'en-US',
    name: 'English',
    translations: {
        common,
        data,
        nav,
        sidebar,
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
        hardware: {
            detection: 'Hardware Detection',
            detecting: 'Detecting...',
            detectionFailed: 'Detection Failed',
            platform: 'Platform',
            gpu: 'GPU',
            memory: 'Memory',
            score: 'Score',
            recommendation: 'AI Mode Recommendation',
            macM1Plus: 'MacBook (M-series)',
            macIntel: 'MacBook (Intel)',
            windows: 'Windows PC',
            linux: 'Linux',
            unknown: 'Unknown Device',
            gpuNotDetected: 'No GPU detected',
            gpuSoftware: 'Software rendering',
            gpuHigh: 'Dedicated GPU (High)',
            gpuMedium: 'Dedicated GPU (Medium)',
            gpuIntegrated: 'Integrated GPU',
            recommendedMode: 'Recommended Mode',
            localMode: 'Local Model (Offline)',
            apiMode: 'Cloud Model (API)',
            confidence: 'Confidence',
            confidenceHigh: 'High',
            confidenceMedium: 'Medium',
            confidenceLow: 'Low',
            reason: 'Reason',
            technicalDetails: 'Technical Score',
            expectedLoadTime: 'First Load Time',
            expectedInferenceTime: 'Inference Time',
            pros: 'Pros',
            cons: 'Cons',
            useRecommended: 'Use Recommended',
            keepCurrent: 'Keep Current',
            redetect: 'Redetect',
        },
        header: {
            inviteCodeTrial: 'Invite Code Trial',
            freeTrial: 'Free Trial',
        },
        footer: {
            resources: 'Resources',
            community: 'Community',
        },
        inviteCode: {
            title: 'Enter Invite Code',
            hint: 'Please enter your invite code to activate',
            placeholder: 'Invite Code',
            activate: 'Activate',
            emptyError: 'Invite code cannot be empty',
            invalidError: 'Invalid invite code',
            networkError: 'Network error, please try again',
        },
        chat: {
            askAIPlaceholder: 'Ask AI about your data...',
        },
        analysis,
        progress,
        packages,
        workbench,
        whitepaper,
    },
} as any; // TODO: Remove after updating types/i18n.ts to match actual module structure
