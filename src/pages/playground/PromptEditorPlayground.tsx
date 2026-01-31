import { useState, useEffect, useMemo } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { MockDataService } from '@/services/data/MockDataService';
import { extractVariables } from '@/utils/variableParser';
import { MultiLangUserPrompt } from '@/types/prompt';
import { ColumnStats } from '@/types/data';
import { LiuliGlass } from '@/components/common/liulix/LiuliGlass';
import { LiuliButton } from '@/components/common/liulix/LiuliButton';
import { LiuliInput } from '@/components/common/liulix/LiuliInput';
import { LiuliSelect } from '@/components/common/liulix/LiuliSelect';
import { AscensionBackground } from '@/components/common/liulix/AscensionBackground';
import { NumericStatsPanel } from '@/components/datagrid/NumericStatsPanel';
import { CategoricalStatsPanel } from '@/components/datagrid/CategoricalStatsPanel';
import { logger } from '@/utils/logger';
import { CodeBlock } from '@/components/common/CodeBlock/CodeBlock';
import { validatePromptTemplate, ValidationResult } from '@/services/promptValidator';
import './PromptEditor.css';

// 常量定义（规则 #4：消除魔法数字）
const MOCK_COLUMNS = ['Age', 'Fare', 'Sex'] as const;
const SAMPLE_ROWS_LIMIT = 10;

// Mock 数据集配置
const MOCK_DATASETS = [
    { id: 'titanic', name: 'Titanic.csv', columns: ['Age', 'Fare', 'Sex', 'Survived', 'Pclass'] },
    { id: 'iris', name: 'Iris.csv', columns: ['SepalLength', 'SepalWidth', 'PetalLength', 'PetalWidth', 'Species'] },
] as const;

// 初始空状态
const DEFAULT_PROMPT_STATE: MultiLangUserPrompt = {
    id: `custom-${Date.now()}`,
    name: 'custom_analysis',
    title: { 'zh-CN': '', 'en-US': '' },
    description: { 'zh-CN': '', 'en-US': '' },
    template: { 'zh-CN': '', 'en-US': '' },
    layer: 'L2_EXECUTION',
    dimensions: [],
    inputVariables: [],
    author: 'user',
    version: '1.0.0',
    isBuiltIn: false,
    isCustom: true,
    updatedAt: Date.now(),
    lastModified: Date.now()
};

export default function PromptEditorPlayground() {
    const { language, t } = useI18n(); // 全局国际化上下文
    const currentLang = language.code; // 'zh-CN' | 'en-US'

    // 服务实例
    const dataService = useMemo(() => new MockDataService(), []);

    // 组件状态
    const [prompt, setPrompt] = useState<MultiLangUserPrompt>(DEFAULT_PROMPT_STATE);
    const [variables, setVariables] = useState<string[]>([]);
    const [mockStats, setMockStats] = useState<ColumnStats[]>([]);
    const [previewResult, setPreviewResult] = useState<string>('');
    const [mockValues, setMockValues] = useState<Record<string, any>>({});

    // 新增状态：Prompt 类型、数据集、校验结果
    const [promptType, setPromptType] = useState<'cleaning' | 'analysis'>('analysis');
    const [selectedDataset, setSelectedDataset] = useState<string>('titanic');
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

    // 初始化时加载草稿
    useEffect(() => {
        const saved = localStorage.getItem('playground_draft_prompt');
        if (saved) {
            try {
                setPrompt(JSON.parse(saved));
                logger.log('UI', 'Playground: Loaded draft from storage');
            } catch (e) {
                console.error('Failed to load draft', e);
            }
        }
    }, []);

    // 自动保存到 localStorage（仅依赖 prompt）
    useEffect(() => {
        localStorage.setItem('playground_draft_prompt', JSON.stringify(prompt));
    }, [prompt]);

    // 从模板提取变量（仅依赖当前语言的模板内容）
    useEffect(() => {
        const currentTemplate = prompt.template[currentLang] || '';
        const extracted = extractVariables(currentTemplate);
        setVariables(extracted);
    }, [prompt.template, currentLang]);

    // 变量变化时更新 Mock 数据（使用 JSON.stringify 稳定化数组依赖）
    useEffect(() => {
        const loadMockData = async () => {
            // 识别潜在列名 (例如 'column', 'target')
            // MVP阶段仅获取固定列统计信息
            if (variables.length > 0) {
                const stats = await dataService.getColumnStats([...MOCK_COLUMNS]); // Mock columns
                setMockStats(stats);

                // 预填充 Mock 值
                const initValues: Record<string, any> = {};
                variables.forEach(v => initValues[v] = `[${v}_Value]`);
                setMockValues(prev => ({ ...initValues, ...prev }));
            } else {
                setMockStats([]);
            }
        };
        loadMockData();
    }, [JSON.stringify(variables), dataService]);

    // 实时预览（仅依赖模板和 Mock 值变化）
    useEffect(() => {
        const renderPreview = async () => {
            const currentTemplate = prompt.template[currentLang] || '';
            const result = await dataService.previewPrompt(currentTemplate, mockValues);
            setPreviewResult(result);
        };
        renderPreview();
    }, [prompt.template, currentLang, JSON.stringify(mockValues), dataService]);


    // 事件处理
    const handleTextChange = (field: 'title' | 'description' | 'template', value: string) => {
        setPrompt(prev => {
            const updated = {
                ...prev,
                [field]: {
                    ...prev[field],
                    [currentLang]: value
                },
                updatedAt: Date.now()
            };

            // 如果是模板字段，同步更新 inputVariables
            if (field === 'template') {
                const extracted = extractVariables(value);
                updated.inputVariables = extracted;
            }

            return updated;
        });
    };

    const handleMockValueChange = (key: string, value: string) => {
        setMockValues(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        // 实际应用中将调用 PromptRegistry.saveCustomPrompt
        // 此处仅作演示提示
        alert(`Saved ${currentLang} version!\n(This is a playground prototype)`);
        logger.log('UI', 'Playground: User clicked save');
    };

    // 校验 Prompt 模板
    const handleTestValidation = () => {
        const template = prompt.template[currentLang] || '';
        const currentDataset = MOCK_DATASETS.find(ds => ds.id === selectedDataset);
        const availableColumns = currentDataset ? [...currentDataset.columns] : [];

        const result = validatePromptTemplate(template, availableColumns);
        setValidationResult(result);

        logger.log('UI', '模板校验完成');
    };

    // 切换 Mock 数据集
    const handleDatasetChange = async (datasetId: string) => {
        setSelectedDataset(datasetId);

        const dataset = MOCK_DATASETS.find(ds => ds.id === datasetId);
        if (!dataset) return;

        // 重新加载统计数据
        const newStats = await dataService.getColumnStats([...dataset.columns.slice(0, 3)]);
        setMockStats(newStats);

        // 清空 Mock 输入值
        setMockValues({});

        // 清空校验结果
        setValidationResult(null);

        logger.log('UI', '切换数据集');
    };

    return (
        <AscensionBackground className="playground-page">
            <div className="prompt-editor-container">
                {/* Header */}
                <div className="editor-header">
                    <div className="editor-header-left">
                        <span className="editor-title">{t('prompt.playground.title')}</span>
                    </div>
                    <div className="editor-header-actions">
                        <LiuliButton variant="secondary" onClick={() => window.history.back()}>
                            {t('prompt.playground.backButton')}
                        </LiuliButton>
                        <LiuliButton variant="primary" onClick={handleSave}>
                            {t('prompt.playground.savePromptButton')}
                        </LiuliButton>
                    </div>
                </div>

                <div className="editor-main-grid">
                    {/* Left Column: Config */}
                    <LiuliGlass className="editor-col">
                        <div className="section-title">{t('prompt.playground.basicInfo').toUpperCase()}</div>

                        <LiuliInput
                            label={t('prompt.playground.titleLabel')}
                            value={prompt.title[currentLang] || ''}
                            onChange={(e) => handleTextChange('title', e.target.value)}
                            placeholder={currentLang === 'zh-CN' ? "输入 Prompt 标题..." : "Enter prompt title..."}
                        />

                        <LiuliInput
                            label={t('prompt.playground.descriptionLabel')}
                            value={prompt.description[currentLang] || ''}
                            onChange={(e) => handleTextChange('description', e.target.value)}
                            placeholder={currentLang === 'zh-CN' ? "描述用途..." : "Describe usage..."}
                        />

                        <div className="section-title section-spacer-top">{t('prompt.playground.template')}</div>
                        <div className="section-description">
                            {t('prompt.playground.templateDescription')}
                        </div>
                        <textarea
                            className="editor-textarea"
                            value={prompt.template[currentLang] || ''}
                            onChange={(e) => handleTextChange('template', e.target.value)}
                            placeholder="Analyze the correlation between {{column_x}} and {{column_y}}..."
                        />

                        {/* Prompt 类型选择器 */}
                        <div className="editor-section prompt-type-selector">
                            <LiuliSelect
                                label={t('prompt.playground.promptType')}
                                value={promptType}
                                onChange={(value) => setPromptType(value as 'cleaning' | 'analysis')}
                                options={[
                                    { value: 'analysis', label: currentLang === 'zh-CN' ? '洞察分析' : 'Analysis' },
                                    { value: 'cleaning', label: currentLang === 'zh-CN' ? '数据清洗' : 'Cleaning' }
                                ]}
                            />
                        </div>

                        {/* Test 校验按钮 */}
                        <LiuliButton
                            className="test-button"
                            variant="primary"
                            onClick={handleTestValidation}
                        >
                            {t('prompt.playground.testButton')}
                        </LiuliButton>

                        {/* 校验结果面板 */}
                        {validationResult && (
                            <div className="validation-panel">
                                <div className="validation-panel-title">
                                    {t('prompt.playground.validationResult')}
                                </div>

                                {validationResult.valid ? (
                                    <div className="validation-issue validation-issue-success">
                                        <span className="validation-issue-icon">[OK]</span>
                                        <div className="validation-issue-content">
                                            <div className="validation-issue-message">
                                                {t('prompt.playground.validationPassed')}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="validation-issue validation-issue-error">
                                        <span className="validation-issue-icon">[ERROR]</span>
                                        <div className="validation-issue-content">
                                            <div className="validation-issue-message">
                                                {t('prompt.playground.validationFailed').replace('{count}', String(validationResult.issues.length))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {validationResult.issues.map((issue, index) => (
                                    <div key={index} className={`validation-issue validation-issue-${issue.level}`}>
                                        <span className="validation-issue-icon">
                                            {issue.level === 'error' ? '[ERR]' : issue.level === 'warning' ? '[WARN]' : '[INFO]'}
                                        </span>
                                        <div className="validation-issue-content">
                                            <div className="validation-issue-message">{issue.message}</div>
                                            {issue.suggestion && (
                                                <div className="validation-issue-suggestion">{issue.suggestion}</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Variables List */}
                        {variables.length > 0 && (
                            <div className="editor-section">
                                <div className="section-title">{t('prompt.playground.detectedVariables')}</div>
                                {variables.map(v => (
                                    <div key={v} className="variable-card">
                                        <div className="variable-name">{`{{${v}}}`}</div>
                                        <LiuliInput
                                            placeholder="Mock Value"
                                            value={mockValues[v] || ''}
                                            onChange={(e) => handleMockValueChange(v, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </LiuliGlass>

                    {/* Right Column: Preview */}
                    <LiuliGlass className="editor-col">
                        <div className="section-title">{t('prompt.playground.mockContextSimulator')}</div>
                        <div className="context-preview-box">
                            <div>{t('prompt.playground.mockDataService')}</div>
                            <div>{t('prompt.playground.sampleRowsAvailable')}: {SAMPLE_ROWS_LIMIT}</div>
                        </div>

                        {/* Mock 数据集切换器 */}
                        <div className="editor-section section-spacer-top">
                            <LiuliSelect
                                label={t('prompt.playground.mockDataset')}
                                value={selectedDataset}
                                onChange={handleDatasetChange}
                                options={MOCK_DATASETS.map(ds => ({
                                    value: ds.id,
                                    label: `${ds.name} (${ds.columns.length} columns)`
                                }))}
                            />
                        </div>

                        {/* Stats Injection Preview */}
                        {mockStats.length > 0 && (
                            <div className="editor-section">
                                <div className="section-title">{t('prompt.playground.availableStatsContext')}</div>
                                <div className="stats-grid">
                                    {mockStats.map(stat => (
                                        <div key={stat.column_name} className="stats-item-scaled">
                                            {stat.data_type === 'numeric' && stat.numeric_stats ? (
                                                <NumericStatsPanel stat={{
                                                    ...stat.numeric_stats,
                                                    stddev: stat.numeric_stats.std,
                                                    skewness: 0,
                                                    kurtosis: 0,
                                                    mean: stat.numeric_stats.mean,
                                                    min: stat.numeric_stats.min,
                                                    max: stat.numeric_stats.max,
                                                    q1: stat.numeric_stats.q1,
                                                    median: stat.numeric_stats.median,
                                                    q3: stat.numeric_stats.q3
                                                }} />
                                            ) : stat.data_type === 'categorical' && stat.categorical_stats ? (
                                                <CategoricalStatsPanel
                                                    stat={{
                                                        topValues: stat.categorical_stats.top_values
                                                    }}
                                                    type={stat.data_type}
                                                    columnName={stat.column_name}
                                                    total={stat.categorical_stats.top_values.reduce((sum, item) => sum + item.count, 0)}
                                                />
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="section-title preview-box-auto-bottom">{t('prompt.playground.finalPromptPreview')}</div>
                        <CodeBlock
                            code={previewResult || t('prompt.playground.noPreview')}
                            language="python"
                            copyable={true}
                            showLineNumbers={false}
                        />
                    </LiuliGlass>
                </div>
            </div>
        </AscensionBackground>
    );
}
