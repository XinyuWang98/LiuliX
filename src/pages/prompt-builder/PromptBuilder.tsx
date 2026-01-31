import React, { useState } from 'react';
import { Beaker, Check, Download, Upload, Eye, Save, FileJson, HelpCircle, Package, Plus, X, AlertTriangle } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { detectLanguage } from './services/languageDetector';
import { detectParameters } from './services/parameterDetector';
import { detectImports } from './services/importDetector';
import { CodeLanguage, RecognitionResult, DetectedImport } from './types';
import { AscensionBackground } from '@/components/common/liulix/AscensionBackground';
import { CodeEditorPanel } from './components/CodeEditorPanel';
import { COMMON_PACKAGES } from './config/commonPackages';
import { LiuliSelect } from '@/components/common/liulix/LiuliSelect';
import { getPyodideInfo } from './config/pyodideCompatibility';
import './PromptBuilder.css';

/**
 * Prompt Builder 主页面
 * 用于智能参数化代码，生成可复用的 Prompt 模板
 */
export const PromptBuilder: React.FC = () => {
    const { t } = useI18n();
    const [code, setCode] = useState('');
    const [recognitionResult, setRecognitionResult] = useState<RecognitionResult | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState(''); // 当前选中的常用包

    // 处理"智能参数化"按钮点击
    const handleSmartParameterize = () => {
        if (!code.trim()) {
            return;
        }

        // 1. 识别语言
        const language = detectLanguage(code);

        if (language === CodeLanguage.UNKNOWN) {
            alert(t('prompt.builder.alerts.noLanguage'));
            return;
        }

        // 2. 识别参数
        const params = detectParameters(code, language);

        // 3. 识别 Python 包导入
        const imports = language === CodeLanguage.PYTHON ? detectImports(code) : [];

        // 4. 计算置信度（简化版：基于识别到的参数数量）
        const confidence = params.length > 0 ? 95 : 0;

        // 5. 设置结果并展开面板
        setRecognitionResult({
            language,
            params,
            imports,
            confidence
        });
        setIsPanelOpen(true);
    };

    // 手动添加导入
    const handleAddImport = () => {
        if (!selectedPackage || !recognitionResult) return;

        const pkg = COMMON_PACKAGES.find(p => p.module === selectedPackage);
        if (!pkg) return;

        const newImport: DetectedImport = {
            statement: pkg.statement,
            source: 'manual',
            module: pkg.module
        };

        // 检查是否已存在（去重）
        const exists = recognitionResult.imports.some(
            imp => imp.statement === newImport.statement
        );

        if (exists) {
            alert(t('prompt.builder.alerts.duplicateImport'));
            return;
        }

        // 添加新导入到列表
        setRecognitionResult({
            ...recognitionResult,
            imports: [...recognitionResult.imports, newImport]
        });

        // 重置选择
        setSelectedPackage('');
    };

    // 删除导入
    const handleRemoveImport = (index: number) => {
        if (!recognitionResult) return;

        const newImports = recognitionResult.imports.filter((_, i) => i !== index);
        setRecognitionResult({
            ...recognitionResult,
            imports: newImports
        });
    };

    return (
        <div className="prompt-builder">
            <AscensionBackground />

            {/* Header */}
            <header className="prompt-builder-header">
                <div className="header-left">
                    <Beaker className="header-icon" size={24} />
                    <h1>Prompt Builder</h1>
                </div>
                <div className="header-right">
                    <button className="liuli-button variant-secondary size-sm">
                        <Save size={16} />
                        {t('prompt.builder.header.saveTemplate')}
                    </button>
                    <button className="liuli-button variant-secondary size-sm">
                        <FileJson size={16} />
                        {t('prompt.builder.header.exportJson')}
                    </button>
                    <button className="liuli-button variant-secondary size-sm">
                        <HelpCircle size={16} />
                        {t('prompt.builder.header.help')}
                    </button>
                </div>
            </header>

            {/* Main Container */}
            <main className="prompt-builder-main">
                {/* 空状态引导面板（未进行识别时显示） */}
                {!recognitionResult && (
                    <div className="empty-state-panel">
                        <div className="empty-state-content liuli-glass">
                            <Beaker size={48} className="empty-state-icon" />
                            <h2>{t('prompt.builder.emptyState.title')}</h2>
                            <p>{t('prompt.builder.emptyState.description')}</p>
                            <div className="empty-state-steps">
                                <div className="step-item liuli-glass">
                                    <span className="step-number">1</span>
                                    <span className="step-text">{t('prompt.builder.emptyState.step1')}</span>
                                </div>
                                <div className="step-item liuli-glass">
                                    <span className="step-number">2</span>
                                    <span className="step-text">{t('prompt.builder.emptyState.step2')}</span>
                                </div>
                                <div className="step-item liuli-glass">
                                    <span className="step-number">3</span>
                                    <span className="step-text">{t('prompt.builder.emptyState.step3')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 识别结果面板（可折叠） */}
                {isPanelOpen && recognitionResult && (
                    <div className="recognition-panel">
                        {/* 面板头部 - 分行展示信息 */}
                        <div className="panel-header">
                            <div className="panel-header-info">
                                <div className="panel-header-title">
                                    <Check size={20} className="icon-success" />
                                    <span>{t('prompt.builder.recognition.success')}</span>
                                </div>
                                <div className="panel-header-meta">
                                    <span>{t('prompt.builder.recognition.language')}: {recognitionResult.language.toUpperCase()}</span>
                                    <span>·</span>
                                    <span>{t('prompt.builder.recognition.confidence')} {recognitionResult.confidence}%</span>
                                </div>
                            </div>
                            <button
                                className="liuli-button variant-ghost size-sm"
                                onClick={() => setIsPanelOpen(false)}
                            >
                                {t('prompt.builder.recognition.collapse')}
                            </button>
                        </div>

                        {/* 三栏网格布局 */}
                        <div className="recognition-grid">
                            {/* 卡片1: Python 包导入 */}
                            {recognitionResult.language === CodeLanguage.PYTHON && (
                                <div className="section-card liuli-glass">
                                    <div className="section-card-header">
                                        <div className="section-card-title">
                                            <Package size={16} />
                                            {t('prompt.builder.imports.title')}
                                            <span className="section-card-count">({recognitionResult.imports.length})</span>
                                        </div>
                                    </div>

                                    <div className="section-card-content">
                                        {/* 添加导入选择器 */}
                                        <div className="import-add-section">
                                            <LiuliSelect
                                                value={selectedPackage}
                                                onChange={setSelectedPackage}
                                                options={COMMON_PACKAGES.map(pkg => ({
                                                    value: pkg.module,
                                                    label: `${pkg.module} - ${t(pkg.description)}`
                                                }))}
                                                label={t('prompt.builder.imports.selectPackage')}
                                                className="import-selector"
                                            />
                                            <button
                                                className="liuli-button variant-primary size-sm"
                                                onClick={handleAddImport}
                                                disabled={!selectedPackage}
                                            >
                                                <Plus size={16} />
                                                {t('prompt.builder.imports.addButton')}
                                            </button>
                                        </div>

                                        {/* 导入列表 */}
                                        {recognitionResult.imports.length > 0 && (
                                            <div className="import-list">
                                                {recognitionResult.imports.map((imp, idx) => {
                                                    const pyodideInfo = getPyodideInfo(imp.module);
                                                    const isUnsupported = pyodideInfo && !pyodideInfo.supported;

                                                    return (
                                                        <div key={idx} className={`import-item ${isUnsupported ? 'unsupported' : ''}`}>
                                                            <span className="import-module">{imp.module}</span>
                                                            <code className="import-statement">{imp.statement}</code>
                                                            {isUnsupported && (
                                                                <span className="import-warning" title={pyodideInfo.reason}>
                                                                    <AlertTriangle size={14} />
                                                                    {t('prompt.builder.pyodideWarning.incompatibleTag')}
                                                                </span>
                                                            )}
                                                            <span className={`import-badge ${imp.source === 'manual' ? 'manual' : 'auto'}`}>
                                                                {imp.source === 'auto' ? t('prompt.builder.imports.autoDetected') : t('prompt.builder.imports.manualAdded')}
                                                            </span>
                                                            <button
                                                                className="import-remove-btn"
                                                                onClick={() => handleRemoveImport(idx)}
                                                                title={t('prompt.builder.imports.removeTooltip')}
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {recognitionResult.imports.length === 0 && (
                                            <p className="import-empty-hint">{t('prompt.builder.imports.emptyHint')}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* 卡片2: 输入参数 */}
                            {recognitionResult.params.filter(p => p.type === 'input').length > 0 && (
                                <div className="section-card liuli-glass">
                                    <div className="section-card-header">
                                        <div className="section-card-title">
                                            <Download size={16} />
                                            {t('prompt.builder.params.inputTitle')}
                                            <span className="section-card-count">({recognitionResult.params.filter(p => p.type === 'input').length})</span>
                                        </div>
                                    </div>

                                    <div className="section-card-content">
                                        {recognitionResult.params
                                            .filter(p => p.type === 'input')
                                            .map((param, idx) => (
                                                <div key={idx} className="param-item">
                                                    <span className="param-original">{param.originalName}</span>
                                                    <input
                                                        type="text"
                                                        value={param.suggestedVarName}
                                                        className="param-input"
                                                        readOnly
                                                    />
                                                    <select className="param-type-select" value={param.dataType}>
                                                        <option value="numeric">numeric</option>
                                                        <option value="category">category</option>
                                                        <option value="date">date</option>
                                                        <option value="text">text</option>
                                                        <option value="unknown">unknown</option>
                                                    </select>
                                                    <span className="param-status">
                                                        <Check size={16} className="icon-success" />
                                                        {t('prompt.builder.params.validated')}
                                                    </span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* 卡片3: 输出参数 */}
                            {recognitionResult.params.filter(p => p.type === 'output').length > 0 && (
                                <div className="section-card liuli-glass">
                                    <div className="section-card-header">
                                        <div className="section-card-title">
                                            <Upload size={16} />
                                            {t('prompt.builder.params.outputTitle')}
                                            <span className="section-card-count">({recognitionResult.params.filter(p => p.type === 'output').length})</span>
                                        </div>
                                    </div>

                                    <div className="section-card-content">
                                        {recognitionResult.params
                                            .filter(p => p.type === 'output')
                                            .map((param, idx) => (
                                                <div key={idx} className="param-item">
                                                    <span className="param-original">{param.originalName}</span>
                                                    <input
                                                        type="text"
                                                        value={param.suggestedVarName}
                                                        className="param-input"
                                                        readOnly
                                                    />
                                                    <select className="param-type-select" value={param.dataType}>
                                                        <option value="numeric">numeric</option>
                                                        <option value="category">category</option>
                                                        <option value="date">date</option>
                                                    </select>
                                                    <span className="param-status">
                                                        <Check size={16} className="icon-success" />
                                                        {t('prompt.builder.params.statsValue')}
                                                    </span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 操作按钮 */}
                        <div className="panel-actions">
                            <button className="liuli-button variant-primary size-md">
                                <Check size={16} />
                                {t('prompt.builder.recognition.confirmParameterize')}
                            </button>
                            <button className="liuli-button variant-secondary size-md">
                                <Eye size={16} />
                                {t('prompt.builder.recognition.previewTemplate')}
                            </button>
                            <button className="liuli-button variant-ghost size-md">{t('prompt.builder.recognition.manualAdjust')}</button>
                        </div>
                    </div>
                )}

                {/* 代码编辑器（Monaco Editor） */}
                <CodeEditorPanel
                    code={code}
                    language={recognitionResult?.language || CodeLanguage.UNKNOWN}
                    onChange={setCode}
                    onSmartParameterize={handleSmartParameterize}
                    isParameterizeDisabled={!code.trim()}
                />
            </main>
        </div>
    );
};
