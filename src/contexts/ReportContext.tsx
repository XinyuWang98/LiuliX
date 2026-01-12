/**
 * ReportContext - 报告状态管理上下文
 * 
 * 用途：
 * 1. 解耦报告状态管理和UI组件位置
 * 2. 支持跨组件访问报告状态（ContentPanel -> ReportActions, ReportWorkbench -> ReportNotebook）
 * 3. 为将来的项目管理页面和多项目支持打基础
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { useI18n } from './I18nContext';
import { useEvidence } from './EvidenceContext';
import { ReportDocument, ReportCell, ReportMode, AuditStatus } from '@/types/report';
import { generateMarkdown, generateHTML } from '@/utils/reportExport';
import { generateIpynb, downloadIpynb } from '@/utils/ipynbGenerator';
import { cleanseCode, mergeGlobalSetup } from '@/utils/codeCleanser';
import { logger } from '@/utils/logger';

// Context 值接口定义
interface ReportContextValue {
    // 状态
    document: ReportDocument | null;
    mode: ReportMode;
    copySuccess: boolean;

    // 操作方法
    setMode: (mode: ReportMode) => void;
    handleCellUpdate: (cellId: string, updates: Partial<ReportCell>) => void;
    handleReportUpdate: (updates: Partial<ReportDocument>) => void;
    handleSignReport: () => void;
    handleExportHTML: () => void;
    handleExportMarkdown: () => Promise<void>;
    handleExportColab: () => void;
    toggleMode: () => void;
}

// 创建 Context
const ReportContext = createContext<ReportContextValue | undefined>(undefined);

// Provider 组件
export function ReportProvider({ children, files = [] }: { children: ReactNode; files?: any[] }) {
    const { t } = useI18n();
    const { records } = useEvidence();
    const [document, setDocument] = useState<ReportDocument | null>(null);
    const [mode, setMode] = useState<ReportMode>('notebook');
    const [copySuccess, setCopySuccess] = useState(false);

    // 标准导入代码
    const STANDARD_IMPORTS = [
        'import base64',
        'import json',
        'import matplotlib.pyplot as plt',
        'import numpy as np',
        'import pandas as pd',
        'import seaborn as sns',
        'from io import BytesIO'
    ].join('\n');

    // 生成数据加载代码
    const generateLoadingCode = (files: any[]) => {
        if (!files || files.length === 0) return '';

        const loadingLines = files.map(file => {
            // 假设文件名是 file.name 或 file.originalName
            const fileName = file.originalName || file.name;
            // 简单生成 pd.read_csv 代码 (假设都是CSV，MVP简化处理)
            // 实际可能需要根据文件类型判断，但此处只做简单的 pd.read_csv 示例
            // 如果后端已经在内存中加载了 df，这里主要是给用户在 Colab 中复用的
            return `try:\n    df_${file.tableName || 'data'} = pd.read_csv('${fileName}')\nexcept:\n    pass`;
        });

        return loadingLines.join('\n');
    };

    // 从 Evidence records 初始化 document
    useEffect(() => {
        // 如果 document 已签字，则不再自动刷新
        if (document?.isSigned) return;

        // 收集所有 Imports 用于合并 Global Setup
        const globalImports: string[] = [];

        const cells: ReportCell[] = records
            .filter(r => r.type === 'insightChain' || r.type === 'cleaning') // F-CK: 包含清洗记录
            .map(record => {
                // F-CK: 优先使用 rawCode (纯净代码) 进行清洗和展示
                // 确保不使用后端 Wrapper 代码
                const sourceCode = record.type === 'cleaning'
                    ? record.sql || ''
                    : (record.metadata?.rawCode || record.metadata?.code || '');

                // 核心逻辑：清洗代码，分离 Imports
                // 对于清洗记录 (SQL)，无需清洗 Imports
                const { presentationCode, globalSetup } = record.type === 'cleaning'
                    ? { presentationCode: sourceCode, globalSetup: '' }
                    : cleanseCode(sourceCode);

                if (globalSetup) {
                    globalImports.push(globalSetup);
                }

                return {
                    id: record.id,
                    code: presentationCode, // 显示代码(无imports)
                    rawCode: sourceCode,    // 原始代码
                    presentationCode: presentationCode,
                    globalSetup: globalSetup,
                    language: (record.metadata?.codeLanguage as 'sql' | 'python') || (record.type === 'cleaning' ? 'sql' : 'python'),
                    output: {
                        // F-CK: Check root chartBase64 first (standard storage), fallback to metadata
                        chartImage: record.chartBase64 || record.metadata?.chartImage,
                        summary: record.description || record.metadata?.summary,
                        stdout: record.metadata?.stdout,
                        error: record.metadata?.error
                    },
                    depth: record.metadata?.depth || 0,
                    parentId: record.metadata?.parentId,
                    auditStatus: AuditStatus.Pending,
                    auditNote: '',
                    metadata: {
                        ...record.metadata,
                        title: record.title
                    }
                };
            });

        // 合并生成全局 Setup
        const mergedImports = mergeGlobalSetup(globalImports);

        // 过滤掉已在 Standard Imports 中存在的行 (De-duplication)
        const standardImportSet = new Set(STANDARD_IMPORTS.split('\n').map(l => l.trim()));
        const uniqueMergedImports = mergedImports
            .split('\n')
            .filter(line => !standardImportSet.has(line.trim()))
            .join('\n');

        // 组合最终的 Global Setup Code: Standard Imports + Loading Code + Merged Imports
        const loadingCode = generateLoadingCode(files);
        const finalGlobalSetup = [
            STANDARD_IMPORTS,
            '',
            '# Data Loading',
            loadingCode,
            '',
            '# Analysis Imports',
            uniqueMergedImports
        ].join('\n').trim();

        if (cells.length > 0) {
            setDocument(prev => ({
                id: prev?.id || `report-${Date.now()}`,
                title: prev?.title || t('report.notebook.defaultTitle'),
                cells,
                globalSetup: finalGlobalSetup, // 设置合并后的 Global Setup
                isSigned: false
            }));
            logger.log('报告', 'Context更新', {
                count: cells.length,
                data: { globalSetupLines: finalGlobalSetup.split('\n').length }
            });
        }
    }, [records, t, document?.isSigned]);

    // Cell 更新处理
    const handleCellUpdate = useCallback((cellId: string, updates: Partial<ReportCell>) => {
        setDocument(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                cells: prev.cells.map(cell =>
                    cell.id === cellId ? { ...cell, ...updates } : cell
                )
            };
        });
    }, []);

    // 报告元数据更新
    const handleReportUpdate = useCallback((updates: Partial<ReportDocument>) => {
        setDocument(prev => {
            if (!prev) return prev;
            return { ...prev, ...updates };
        });
    }, []);

    // 签字并锁定报告
    const handleSignReport = useCallback(() => {
        setDocument(prev => {
            if (!prev) return prev;
            logger.log('报告', '报告已签字并锁定');
            return {
                ...prev,
                isSigned: true,
                signedBy: 'Current User',
                signedAt: Date.now()
            };
        });
    }, []);

    // 导出 HTML
    const handleExportHTML = useCallback(() => {
        if (!document) return;
        const html = generateHTML(document);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = `${document.title}_${Date.now()}.html`;
        a.click();
        URL.revokeObjectURL(url);
        logger.log('报告', 'HTML导出成功');
    }, [document]);

    // 导出 Markdown
    const handleExportMarkdown = useCallback(async () => {
        if (!document) return;
        const md = generateMarkdown(document);
        try {
            await navigator.clipboard.writeText(md);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
            logger.log('报告', 'Markdown已复制到剪贴板');
        } catch (err) {
            logger.error('报告', 'Markdown复制失败', err);
        }
    }, [document]);

    // 导出 Colab (.ipynb)
    const handleExportColab = useCallback(() => {
        if (!document) return;
        const ipynb = generateIpynb(document.cells, document.title);
        downloadIpynb(ipynb, `${document.title}_${Date.now()}.ipynb`);
        alert(`${t('report.export.successIpynb')}\n${t('report.export.uploadToColab')}`);
        logger.log('报告', 'ipynb文件已下载');
    }, [document, t]);

    // 切换模式
    const toggleMode = useCallback(() => {
        setMode(prev => prev === 'notebook' ? 'report' : 'notebook');
    }, []);

    // Context 值
    const value = useMemo<ReportContextValue>(() => ({
        document,
        mode,
        copySuccess,
        setMode,
        handleCellUpdate,
        handleReportUpdate,
        handleSignReport,
        handleExportHTML,
        handleExportMarkdown,
        handleExportColab,
        toggleMode
    }), [document, mode, copySuccess, handleCellUpdate, handleReportUpdate, handleSignReport, handleExportHTML, handleExportMarkdown, handleExportColab, toggleMode]);

    return (
        <ReportContext.Provider value={value}>
            {children}
        </ReportContext.Provider>
    );
}

// 自定义 Hook
export function useReport() {
    const context = useContext(ReportContext);
    if (context === undefined) {
        throw new Error('useReport 必须在 ReportProvider 内部使用');
    }
    return context;
}
