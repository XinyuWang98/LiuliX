
import { useI18n } from '@/contexts/I18nContext';
import { SettingsGroup, SettingsRow } from './SettingsSection';
import Switch from './Switch';
import { LiuliButton } from '@/components/common/liulix/LiuliButton';
import { Globe, Monitor } from 'lucide-react';
import '../SettingsPage.css';

import { LogDownloadButton } from './LogDownloadButton';
import { AnalysisPackagesSettings } from './AnalysisPackagesSettings';
import { UserRoleSettings } from './UserRoleSettings';
import { DataPrivacySection } from '../DataPrivacySection';
import { DataAnalysisSection } from '../DataAnalysisSection';


// Import Types
import { type AIModel } from '@/services/aiService';
import { type HardwareDetectionResult } from '@/utils/hardwareDetection';
import { type AIModeRecommendation } from '@/utils/aiModeRecommendation';


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
                                <div className="language-selection" style={{ display: 'flex', gap: 8 }}>
                                    <LiuliButton
                                        variant={language.code === 'zh-CN' ? 'primary' : 'secondary'}
                                        size="sm"
                                        onClick={() => setLanguage('zh-CN')}
                                        leftIcon={<Globe size={14} />}
                                    >
                                        {t('settings.langZhCN')}
                                    </LiuliButton>
                                    <LiuliButton
                                        variant={language.code === 'en-US' ? 'primary' : 'secondary'}
                                        size="sm"
                                        onClick={() => setLanguage('en-US')}
                                        leftIcon={<Globe size={14} />}
                                    >
                                        {t('settings.langEnUS')}
                                    </LiuliButton>
                                </div>
                            }
                        />
                        {/* MVP版本暂未开放主题切换 (2026-01-15)
                        <div className="theme-grid-wrapper">
                            <div className="theme-grid">
                                {['apple-dark', 'apple-light', 'neufuture'].map(themeId => {
                                    const isDisabled = themeId !== 'apple-dark';
                                    return (
                                        <div
                                            key={themeId}
                                            className={`theme-card ${currentTheme.id === themeId ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                                            onClick={() => !isDisabled && setTheme(themeId as any)}
                                        >
                                            <span>
                                                {t(`themes.${themeId}`)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        */}
                    </SettingsGroup>


                </>
            )}

            {/* User Role Settings */}
            {activeCategory === 'user-role' && (
                <UserRoleSettings />
            )}

            {/* AI Config */}
            {activeCategory === 'ai-config' && (
                <>
                    <h2 className="settings-section-title">{t('settings.aiConfig')}</h2>
                    <p className="settings-section-desc">{t('settings.aiConfigDesc')}</p>

                    {/* 当前模式提示（前置） */}
                    <div style={{
                        padding: 'var(--gap-m)',
                        background: props.useLocalModel
                            ? 'rgba(100, 150, 255, 0.1)'
                            : 'rgba(0, 200, 100, 0.1)',
                        borderRadius: 'var(--radius-m)',
                        border: `1px solid ${props.useLocalModel ? 'rgba(100, 150, 255, 0.3)' : 'var(--primary)'}`,
                        marginBottom: 'var(--gap-l)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 'var(--gap-m)',
                    }}>
                        {props.useLocalModel ? (
                            <Monitor size={20} color="rgba(100, 150, 255, 1)" />
                        ) : (
                            <Globe size={20} color="var(--primary)" />
                        )}
                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontSize: 'var(--fs-sm)',
                                fontWeight: 'var(--fw-medium)',
                                color: props.useLocalModel ? 'rgba(100, 150, 255, 1)' : 'var(--primary)',
                                marginBottom: 'var(--gap-xs)',
                            }}>
                                {props.useLocalModel
                                    ? t('settings.aiSettings.localMode')
                                    : t('settings.aiSettings.cloudMode')
                                }
                            </div>
                            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)', lineHeight: 'var(--line-height)' }}>
                                💡 {props.useLocalModel
                                    ? t('settings.aiSettings.localPriorityHint')
                                    : t('settings.aiSettings.cloudTrialHint')
                                }
                            </div>
                        </div>
                    </div>

                    {/* MVP版本暂不开放本地模型 (2026-01-15)
                    <SettingsGroup title={t('settings.hardwareEnvironment')}>
                        {props.isDetecting ? (
                            <div className="hardware-detection-row">
                                <Loader size={20} className="spinning" />
                                <span>{t('hardware.detecting')}</span>
                            </div>
                        ) : hardwareScore !== undefined ? (
                            <div className="hardware-detection-row">
                                <Monitor size={20} className="hardware-icon" />
                                <div className={`score-badge ${hardwareScore >= 80 ? 'score-badge-strong' :
                                    hardwareScore >= 60 ? 'score-badge-warning' : 'score-badge-weak'
                                    }`}>
                                    {hardwareScore >= 80 ? t('settings.hardwareStrong') :
                                        hardwareScore >= 60 ? t('settings.hardwareMedium') : t('settings.hardwareWeak')}
                                </div>
                                <span className="score-desc">
                                    {t('settings.hardwareScore', { score: hardwareScore })} - {
                                        hardwareScore >= 80 ? t('settings.hardwareRecLocal') : t('settings.hardwareRecCloud')
                                    }
                                </span>
                            </div>
                        ) : (
                            <div className="hardware-detection-row">
                                <span>{t('settings.hardwareUnknown')}</span>
                            </div>
                        )}
                    </SettingsGroup>

                    <SettingsGroup>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: 'var(--gap-m)',
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-m)',
                            border: '1px solid var(--border)',
                        }}>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontSize: 'var(--fs-m)',
                                    fontWeight: 'var(--fw-medium)',
                                    marginBottom: 'var(--gap-xs)',
                                }}>
                                    {t('settings.aiSettings.useLocalModel')}
                                </div>
                                <div style={{
                                    fontSize: 'var(--fs-xs)',
                                    color: 'var(--text-secondary)',
                                }}>
                                    {props.useLocalModel
                                        ? t('settings.aiSettings.localModeDesc')
                                        : t('settings.aiSettings.cloudModeDescNew')
                                    }
                                </div>
                            </div>

                            <Switch
                                checked={props.useLocalModel}
                                onChange={props.onAIModeChange}
                            />
                        </div>
                    </SettingsGroup>

                    {props.useLocalModel && (
                        <SettingsGroup>
                            <LocalModelSelector
                                currentModel={localStorage.getItem('ollama_model') || SUPPORTED_MODELS.QWEN_7B}
                                onModelChange={(modelId) => {
                                    localStorage.setItem('ollama_model', modelId);
                                    window.dispatchEvent(new CustomEvent('ollama-model-change', { detail: modelId }));
                                }}
                            />
                        </SettingsGroup>
                    )}
                    */}

                    {/* API Keys - MVP阶段隐藏，用户使用内置API */}
                    {/* <SettingsGroup title={t('settings.apiPriorityAndKeys')}>
                        <div className="api-keys-list">
                            {props.priority.map((model, index) => {
                                const isDisabled = model !== 'deepseek';
                                return (
                                    <div
                                        key={model}
                                        className={`api-key-item ${isDisabled ? 'disabled' : ''}`}
                                        style={{ opacity: isDisabled ? 0.5 : 1 }}
                                    >
                                        <div className="api-key-header">
                                            <div className="api-key-header-left">
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginRight: 8 }}>
                                                    <button
                                                        onClick={() => !isDisabled && props.onMoveUp(index)}
                                                        disabled={index === 0 || isDisabled}
                                                        className="move-btn"
                                                        style={{ border: 'none', background: 'transparent', cursor: (index === 0 || isDisabled) ? 'default' : 'pointer', opacity: (index === 0 || isDisabled) ? 0.3 : 1, padding: 0, display: 'flex' }}
                                                    >
                                                        <ArrowUp size={14} color="var(--text-secondary)" />
                                                    </button>
                                                    <button
                                                        onClick={() => !isDisabled && props.onMoveDown(index)}
                                                        disabled={index === props.priority.length - 1 || isDisabled}
                                                        className="move-btn"
                                                        style={{ border: 'none', background: 'transparent', cursor: (index === props.priority.length - 1 || isDisabled) ? 'default' : 'pointer', opacity: (index === props.priority.length - 1 || isDisabled) ? 0.3 : 1, padding: 0, display: 'flex' }}
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
                                                placeholder={isDisabled ? t('settings.mvpNotAvailable') : "sk-..."}
                                                value={props.keys[model] || ''}
                                                onChange={(e) => !isDisabled && props.onKeyChange(model, e.target.value)}
                                                className="api-key-input"
                                                disabled={isDisabled}
                                            />
                                            <button
                                                onClick={() => !isDisabled && props.onTestKey(model as any)}
                                                disabled={props.testStatus[model] === 'loading' || isDisabled}
                                                className={`api-test-btn ${props.testStatus[model] === 'success' ? 'success' : props.testStatus[model] === 'error' ? 'error' : ''}`}
                                            >
                                                {props.testStatus[model] === 'loading' ? <div className="settings-spinner-small" /> :
                                                    props.testStatus[model] === 'success' ? <CheckCircle size={16} /> :
                                                        props.testStatus[model] === 'error' ? <AlertCircle size={16} /> :
                                                            <Play size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </SettingsGroup> */}
                </>
            )}

            {/* Performance */}
            {activeCategory === 'performance' && (
                <>
                    <h2 className="settings-section-title">{t('config.performanceQuality')}</h2>
                    <p className="settings-section-desc">{t('settings.performanceDesc')}</p>

                    <SettingsGroup title={t('settings.dataAnalysisStrategy')}>
                        <DataAnalysisSection />
                    </SettingsGroup>

                    <SettingsGroup title={t('settings.dataPrivacyTitle')}>
                        <DataPrivacySection />
                    </SettingsGroup>


                    {/* Data Processing区块已移除（2026-01-14简化） */}
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
                            label={t('settings.testLogDownload')}
                            description={t('settings.testLogDownloadDesc')}
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
