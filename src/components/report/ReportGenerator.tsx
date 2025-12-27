// import { useEvidence } from '@/contexts/EvidenceContext';
// import { useI18n } from '@/contexts/I18nContext';
// import { Download, Copy, FileText, CheckCircle } from 'lucide-react';
// import { useState } from 'react';
// import { ReportSummary } from './ReportSummary'; // V0 MVP temporarily replaced
import { ReportNotebook } from './ReportNotebook';
// import { logger } from '@/utils/logger';
import './ReportGenerator.css';

// 图标尺寸常量
// const ICON_SIZE_MEDIUM = 18; // 中等图标尺寸

export function ReportGenerator() {
    // V0 MVP: 直接渲染双角色报告笔记本
    return (
        <div className="report-generator-container">
            <ReportNotebook />
        </div>
    );
}


