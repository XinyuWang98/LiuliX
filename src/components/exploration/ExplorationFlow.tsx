import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { Plus, Send } from 'lucide-react';
import { ExplorationHeader } from './ExplorationHeader';
import { TimelineSidebar } from './TimelineSidebar';
import { CleaningSummaryCard } from './CleaningSummaryCard';
import { DataCleaner } from '../cleaning/DataCleaner';
import { ReportGenerator } from '../report/ReportGenerator';
import { InsightChainFlow } from '../insights/InsightChainFlow';
import { Project } from '@/utils/projectUtils';
import { WorkflowStep } from '@/components/common/WorkflowProgressBar';
import './ExplorationFlow.css';

interface ExplorationFlowProps {
    project: Project | null;
    onNavigate: (view: 'dashboard' | 'library') => void;
    cleaningTrigger: number;
    onProjectUpdate: (project: Project) => void;
    aiSuggestions?: any[];
}

export function ExplorationFlow({ project, cleaningTrigger, onProjectUpdate, aiSuggestions }: ExplorationFlowProps) {
    const { t } = useI18n();
    const [inputValue, setInputValue] = useState('');
    const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload');

    // Collapsible states for cleaner
    const [isCleaningExpanded, setIsCleaningExpanded] = useState(true);

    // Refs for scrolling
    const cleaningRef = useRef<HTMLDivElement>(null);
    const insightsRef = useRef<HTMLDivElement>(null);
    const reportRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const scrollPos = container.scrollTop + container.clientHeight / 3;

            if (reportRef.current && scrollPos >= reportRef.current.offsetTop) {
                setCurrentStep('report');
            } else if (insightsRef.current && scrollPos >= insightsRef.current.offsetTop) {
                setCurrentStep('insights');
            } else {
                setCurrentStep('cleaning');
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToStep = (step: string) => {
        let targetRef = null;
        if (step === 'cleaning') targetRef = cleaningRef;
        if (step === 'insights') targetRef = insightsRef;
        if (step === 'report') targetRef = reportRef;

        if (targetRef?.current) {
            targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setCurrentStep(step as any);
        }
    };

    const getInsightProps = () => {
        if (project && project.files && project.files.length > 0) {
            const firstFile: any = project.files[0];
            return {
                columns: firstFile.data?.columns?.map((c: any) => c.name) ?? [],
                rowCount: firstFile.data?.rowCount ?? 0,
                sampleData: firstFile.data?.preview?.slice(0, 5) ?? [],
                tableName: firstFile.data?.tableName,
                insightCache: firstFile.analysisCache?.insight
            };
        }
        return null;
    };
    const insightProps = getInsightProps();

    return (
        <div className="exploration-flow-container">
            {/* 顶部标题栏 - 与左右侧边栏对齐 */}
            <ExplorationHeader
                title={t('exploration.title')}
            />

            {/* 主内容区域 - 时间轴 + 滚动内容 */}
            <div className="exploration-main-area">
                {/* 左侧时间轴侧边栏 */}
                <TimelineSidebar
                    currentStep={currentStep === 'upload' ? 'cleaning' : currentStep as any}
                    onStepClick={(s) => scrollToStep(s)}
                    cleaningComplete={!!project?.files?.length}
                    insightCount={0}
                    reportReady={false}
                />

                {/* 右侧面板（内容 + 聊天） */}
                <div className="right-panel-wrapper">

                    {/* 滚动内容区 */}
                    <div
                        ref={scrollContainerRef}
                        className="scroll-container"
                    >
                        <div className="content-wrapper">

                            {/* Section 1: 数据清洗 */}
                            <div id="section-cleaning" ref={cleaningRef} className="flow-section">
                                <div className={`section-header ${currentStep === 'cleaning' ? 'section-active' : 'section-faded'}`}>
                                    <span className="section-number">01</span>
                                    <h2 className="section-title">{t('workshop.cleaning')}</h2>
                                </div>

                                {project ? (
                                    <div className="cleaning-content-wrapper">
                                        {(!isCleaningExpanded && project.files?.length) && (
                                            <CleaningSummaryCard
                                                project={project}
                                                onClick={() => setIsCleaningExpanded(true)}
                                                isActive={false}
                                            />
                                        )}

                                        <div
                                            style={{ display: isCleaningExpanded ? 'block' : 'none' }}
                                            className="cleaning-full-view"
                                        >
                                            <DataCleaner
                                                project={project}
                                                cleaningTrigger={cleaningTrigger}
                                                onProjectUpdate={onProjectUpdate}
                                                aiSuggestions={aiSuggestions}
                                            />
                                            {project.files?.length > 0 && (
                                                <div
                                                    onClick={() => setIsCleaningExpanded(false)}
                                                    className="collapse-hint-btn"
                                                >
                                                    {t('common.collapse') || 'Collapse Details'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="empty-state">No Project Loaded</div>
                                )}
                            </div>

                            {/* Section 2: 洞察分析 */}
                            <div id="section-insights" ref={insightsRef} className="flow-section">
                                <div className={`section-header ${currentStep === 'insights' ? 'section-active' : 'section-faded'}`}>
                                    <span className="section-number">02</span>
                                    <h2 className="section-title">{t('insightChain.title')}</h2>
                                </div>

                                {insightProps ? (
                                    <div className="minimal-insight-wrapper">
                                        <InsightChainFlow
                                            {...insightProps}
                                        />
                                    </div>
                                ) : (
                                    <div className="empty-insight-placeholder">
                                        请先完成数据清洗
                                    </div>
                                )}
                            </div>

                            {/* Section 3: 分析报告 */}
                            <div id="section-report" ref={reportRef} className="flow-section report-section-container">
                                <div className={`section-header ${currentStep === 'report' ? 'section-active' : 'section-faded'}`}>
                                    <span className="section-number">03</span>
                                    <h2 className="section-title">{t('report.title')}</h2>
                                </div>
                                <ReportGenerator />
                            </div>
                        </div>
                    </div>

                    {/* 底部聊天输入框（悬浮） */}
                    <div className="chat-input-wrapper">
                        <div className="chat-input-container">
                            <button className="btn-ghost chat-action-btn">
                                <Plus size={18} />
                            </button>
                            <textarea
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                placeholder={t('chat.askAIPlaceholder')}
                                className="chat-input-field"
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        if (inputValue.trim()) {
                                            setInputValue('');
                                        }
                                    }
                                }}
                            />
                            <button
                                className="btn-primary chat-send-btn"
                                disabled={!inputValue.trim()}
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
