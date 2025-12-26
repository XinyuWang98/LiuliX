

import { useI18n } from '@/contexts/I18nContext';
import { useTheme } from '@/contexts/ThemeContext';
import { SettingsGroup, SettingsRow } from './SettingsSection';
import { Switch } from './Switch';
import { Play, CheckCircle, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';
import '../SettingsPage.css';
import { SUPPORTED_MODELS } from '@/services/localLLMService';
import { LogDownloadButton } from './LogDownloadButton';
import { AnalysisPackagesSettings } from './AnalysisPackagesSettings';

// Import Types
import { type AIModel } from '@/services/aiService';
import { type HardwareDetectionResult } from '@/utils/hardwareDetection';
import { type AIModeRecommendation } from '@/utils/aiModeRecommendation';

const MODEL_NAMES: Record<string, string> = {
    gemini: 'Gemini 2.5 Flash',
    grok: 'Grok Beta',
    claude: 'Claude 3.5 Sonnet',
    deepseek: 'DeepSeek Chat'
};

interface SettingsContentProps {
    activeCategory: string;
    // Common State
    useLocalModel: boolean;
    onAIModeChange: (enabled: boolean) => void;
    // AI State
    hardwareDetection: HardwareDetectionResult | null;
    isDetecting: boolean;
    recommendation: AIModeRecommendation | null;
    priority: AIModel[];
    keys: Record<string, string>;
    testStatus: Record<string, 'idle' | 'loading' | 'success' | 'error'>;
    onKeyChange: (model: string, val: string) => void;
    onTestKey: (model: AIModel) => void;
    onMoveUp: (index: number) => void;
    onMoveDown: (index: number) => void;
    // Performance State
    analysisConfig: any;
    onPerformanceChange: (key: 'maxColumns' | 'timeout', value: number) => void;
}

export const SettingsContent = (props: SettingsContentProps) => {
    const { t, language, setLanguage } = useI18n();
    const { currentTheme, setTheme } = useTheme();

    const { activeCategory } = props;

    return (
        <main className="settings-content">
            {/* Common Settings */}
            {activeCategory === 'commonly-used' && (
                <>
                    <h2 className="settings-section-title">{t('settings.commonlyUsed')}</h2>
                    <p className="settings-section-desc">{t('settings.commonlyUsedDesc')}</p>

                    <SettingsGroup title={t('settings.appearanceAndLanguage')}>
                        <SettingsRow
                            label={t('settings.interfaceLanguage')}
                            description={t('settings.interfaceLanguageDesc')}
                            action={
                                <div className="language-selection">
                                    <button
                                        onClick={() => setLanguage('zh-CN')}
                                        className={`language-btn ${language.code === 'zh-CN' ? 'active' : ''}`}
                                    >
                                        中文
                                    </button>
                                    <button
                                        onClick={() => setLanguage('en-US')}
                                        className={`language-btn ${language.code === 'en-US' ? 'active' : ''}`}
                                    >
                                        English
                                    </button>
                                </div>
                            }
                        />
                        <div className="theme-grid-wrapper">
                            <div className="theme-grid">
                                {['apple-dark', 'apple-light', 'neufuture'].map(themeId => (
                                    <div
                                        key={themeId}
                                        className={`theme-card ${currentTheme.id === themeId ? 'active' : ''}`}
                                        onClick={() => setTheme(themeId as any)}
                                    >
                                        <div
                                            className={`theme-preview-box theme-preview-${themeId.replace('apple-', '')} ${themeId.includes('light') ? 'light' : ''}`}
                                            style={themeId.includes('light') ? undefined : { background: 'var(--theme-preview-dark)' }}
                                        />
                                        <span>
                                            {t(`themes.${themeId}`)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </SettingsGroup>

                    <SettingsGroup title={t('settings.localModelTitle')}>
                        <SettingsRow
                            label={t('settings.localModelEnableTitle')}
                            description={t('settings.localModelDesc')}
                            action={
                                <Switch
                                    checked={props.useLocalModel}
                                    onChange={props.onAIModeChange}
                                />
                            }
                        />
                        {props.useLocalModel && (
                            <div className="settings-info-text">
                                ℹ️ {t('settings.localModelInfo', { model: SUPPORTED_MODELS.QWEN })}
                            </div>
                        )}
                    </SettingsGroup>
                </>
            )}

            {/* AI Config */}
            {activeCategory === 'ai-config' && (
                <>
                    <h2 className="settings-section-title">{t('settings.aiConfig')}</h2>
                    <p className="settings-section-desc">{t('settings.aiConfigDesc')}</p>

                    {/* Hardware Detection */}
                    <SettingsGroup title={t('settings.hardwareEnvironment')}>
                        {props.isDetecting ? (
                            <div className="hardware-detection-row">
                                <div className="settings-spinner-tiny" />
                                <span className="hardware-detection-text">{t('hardware.detecting')}</span>
                            </div>
                        ) : props.recommendation ? (
                            <SettingsRow
                                label={props.recommendation.mode === 'local' ? t('hardware.localMode') : t('hardware.apiMode')}
                                description={`${t('hardware.score')}: ${props.hardwareDetection?.overallScore} - ${props.recommendation.reason}`}
                                action={
                                    props.recommendation.confidence === 'high' ? (
                                        <span className="confidence-badge">
                                            {t('hardware.confidenceHigh')}
                                        </span>
                                    ) : null
                                }
                            />
                        ) : null}
                    </SettingsGroup>

                    {/* API Keys */}
                    <SettingsGroup title={t('settings.apiPriorityAndKeys')}>
                        <div className="api-keys-list">
                            {props.priority.map((model, index) => (
                                <div
                                    key={model}
                                    className="api-key-item"
                                >
                                    <div className="api-key-header">
                                        <div className="api-key-header-left">
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginRight: 8 }}>
                                                <button
                                                    onClick={() => props.onMoveUp(index)}
                                                    disabled={index === 0}
                                                    className="move-btn"
                                                    style={{ border: 'none', background: 'transparent', cursor: index === 0 ? 'default' : 'pointer', opacity: index === 0 ? 0.3 : 1, padding: 0, display: 'flex' }}
                                                >
                                                    <ArrowUp size={14} color="var(--text-secondary)" />
                                                </button>
                                                <button
                                                    onClick={() => props.onMoveDown(index)}
                                                    disabled={index === props.priority.length - 1}
                                                    className="move-btn"
                                                    style={{ border: 'none', background: 'transparent', cursor: index === props.priority.length - 1 ? 'default' : 'pointer', opacity: index === props.priority.length - 1 ? 0.3 : 1, padding: 0, display: 'flex' }}
                                                >
                                                    <ArrowDown size={14} color="var(--text-secondary)" />
                                                </button>
                                            </div>
                                            <span className="api-key-model-name">{MODEL_NAMES[model]}</span>
                                        </div>
                                        <span className="api-key-priority-badge">#{index + 1}</span>
                                    </div>

                                    <div className="api-key-input-row">
                                        <input
                                            type="password"
                                            placeholder="sk-..."
                                            value={props.keys[model] || ''}
                                            onChange={(e) => props.onKeyChange(model, e.target.value)}
                                            className="api-key-input"
                                        />
                                        <button
                                            onClick={() => props.onTestKey(model as any)}
                                            disabled={props.testStatus[model] === 'loading'}
                                            className={`api-test-btn ${props.testStatus[model] === 'success' ? 'success' : props.testStatus[model] === 'error' ? 'error' : ''}`}
                                        >
                                            {props.testStatus[model] === 'loading' ? <div className="settings-spinner-small" /> :
                                                props.testStatus[model] === 'success' ? <CheckCircle size={16} /> :
                                                    props.testStatus[model] === 'error' ? <AlertCircle size={16} /> :
                                                        <Play size={14} />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SettingsGroup>
                </>
            )}

            {/* Performance */}
            {activeCategory === 'performance' && (
                <>
                    <h2 className="settings-section-title">{t('config.performanceQuality')}</h2>
                    <p className="settings-section-desc">{t('settings.performanceDesc')}</p>

                    <SettingsGroup title={t('settings.dataProcessing')}>
                        <SettingsRow
                            label={t('config.maxColumns')}
                            description={t('config.maxColumnsDesc')}
                            action={
                                <input
                                    type="number"
                                    value={props.analysisConfig.maxColumns}
                                    onChange={(e) => props.onPerformanceChange('maxColumns', parseInt(e.target.value))}
                                    min={10}
                                    max={100}
                                    className="setting-number-input"
                                />
                            }
                        />
                        <SettingsRow
                            label={t('config.timeout')}
                            description={t('config.timeoutDesc')}
                            action={
                                <div className="setting-number-group">
                                    <input
                                        type="number"
                                        value={props.analysisConfig.timeout / 1000}
                                        onChange={(e) => props.onPerformanceChange('timeout', parseInt(e.target.value) * 1000)}
                                        min={30}
                                        max={300}
                                        step={10}
                                        className="setting-number-input"
                                    />
                                    <span className="setting-unit-label">{t('settings.performanceTimeoutUnit') || 'Seconds'}</span>
                                </div>
                            }
                        />
                    </SettingsGroup>
                </>
            )}

            {/* Advanced */}
            {activeCategory === 'advanced' && (
                <>
                    <h2 className="settings-section-title">{t('settings.advanced')}</h2>
                    <p className="settings-section-desc">{t('settings.advancedDesc')}</p>
                    <SettingsGroup>
                        <SettingsRow
                            label={t('settings.devMode')}
                            description={t('settings.devModeDesc')}
                            action={<Switch checked={false} onChange={() => { }} />}
                        />
                        <SettingsRow
                            label="测试日志下载"
                            description="导出完整的测试日志（所有操作记录、错误信息、性能数据）"
                            action={<LogDownloadButton />}
                        />
                    </SettingsGroup>
                </>
            )}

            {/* Analysis Packages */}
            {activeCategory === 'analysis-packages' && (
                <AnalysisPackagesSettings />
            )}
        </main>
    );
};
