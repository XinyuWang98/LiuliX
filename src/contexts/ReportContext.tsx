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
    handleSignReport: () => void;
    handleExportHTML: () => void;
    handleExportMarkdown: () => Promise<void>;
    handleExportColab: () => void;
    toggleMode: () => void;
}

// 创建 Context
const ReportContext = createContext<ReportContextValue | undefined>(undefined);

// Provider 组件
export function ReportProvider({ children }: { children: ReactNode }) {
    const { t } = useI18n();
    const { records } = useEvidence();
    const [document, setDocument] = useState<ReportDocument | null>(null);
    const [mode, setMode] = useState<ReportMode>('notebook');
    const [copySuccess, setCopySuccess] = useState(false);

    // 从 Evidence records 初始化 document
    useEffect(() => {
        // 如果 document 已签字，则不再自动刷新
        if (document?.isSigned) return;

        const cells: ReportCell[] = records
            .filter(r => r.type === 'insightChain')
            .map(record => ({
                id: record.id,
                code: record.metadata?.code || '',
                rawCode: record.metadata?.rawCode,
                language: (record.metadata?.codeLanguage as 'sql' | 'python') || 'python',
                output: {
                    chartImage: record.metadata?.chartImage,
                    summary: record.description
                },
                depth: record.metadata?.depth || 0,
                parentId: record.metadata?.parentId,
                auditStatus: AuditStatus.Pending,
                auditNote: ''
            }));

        if (cells.length > 0) {
            setDocument(prev => ({
                id: prev?.id || `report-${Date.now()}`,
                title: prev?.title || t('report.notebook.defaultTitle'),
                cells,
                isSigned: false
            }));
            logger.log('报告', `同步 ${cells.length} 个 Cells`);
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
        alert(`${t('report.export.downloadIpynb')}\n${t('report.export.uploadToColab')}`);
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
        handleSignReport,
        handleExportHTML,
        handleExportMarkdown,
        handleExportColab,
        toggleMode
    }), [document, mode, copySuccess, handleCellUpdate, handleSignReport, handleExportHTML, handleExportMarkdown, handleExportColab, toggleMode]);

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
