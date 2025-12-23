import { useI18n } from '../../contexts/I18nContext';
import { ANALYSIS_CONFIG_LIMITS } from '../../config/analysisConfig';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

interface PerformanceConfigSectionProps {
    maxColumns: number;
    timeout: number;
    onMaxColumnsChange: (value: number) => void;
    onTimeoutChange: (value: number) => void;
}

/**
 * 性能与质量配置区域组件
 * 包含最大分析列数和分析超时时间的滑块控制
 */
export const PerformanceConfigSection = ({
    maxColumns,
    timeout,
    onMaxColumnsChange,
    onTimeoutChange
}: PerformanceConfigSectionProps) => {
    const { t } = useI18n();

    return (
        <div style={{
            backgroundColor: 'var(--bg-secondary, #1a1a1a)',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '1px solid var(--border, rgba(255,255,255,0.1))'
        }}>
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-primary)' }}>
                {t('config.performanceQuality')}
            </div>

            {/* 最大分析列数 */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {t('config.maxColumns')}
                    </label>
                    <span style={{ fontSize: '16px', fontWeight: 600, color: '#3b82f6' }}>
                        {maxColumns} {t('settings.performanceColumnsUnit')}
                        {maxColumns > 50 && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#f59e0b' }}>{t('settings.performanceSlowWarning')}</span>}
                    </span>
                </div>
                <Slider
                    min={ANALYSIS_CONFIG_LIMITS.MAX_COLUMNS_MIN}
                    max={ANALYSIS_CONFIG_LIMITS.MAX_COLUMNS_MAX}
                    step={5}
                    value={maxColumns}
                    onChange={(val) => onMaxColumnsChange(val as number)}
                    trackStyle={{ backgroundColor: '#3b82f6', height: 6 }}
                    handleStyle={{
                        borderColor: '#3b82f6',
                        backgroundColor: '#3b82f6',
                        height: 20,
                        width: 20,
                        marginTop: -7,
                        opacity: 1
                    }}
                    railStyle={{ backgroundColor: '#374151', height: 6 }}
                />
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {t('config.maxColumnsDesc')}
                </div>
            </div>

            {/* 分析超时时间 */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {t('config.timeout')}
                    </label>
                    <span style={{ fontSize: '16px', fontWeight: 600, color: '#3b82f6' }}>
                        {timeout} {t('settings.performanceTimeoutUnit')}
                    </span>
                </div>
                <Slider
                    min={ANALYSIS_CONFIG_LIMITS.TIMEOUT_MIN}
                    max={ANALYSIS_CONFIG_LIMITS.TIMEOUT_MAX}
                    step={30}
                    value={timeout}
                    onChange={(val) => onTimeoutChange(val as number)}
                    trackStyle={{ backgroundColor: '#3b82f6', height: 6 }}
                    handleStyle={{
                        borderColor: '#3b82f6',
                        backgroundColor: '#3b82f6',
                        height: 20,
                        width: 20,
                        marginTop: -7,
                        opacity: 1
                    }}
                    railStyle={{ backgroundColor: '#374151', height: 6 }}
                />
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {t('config.timeoutDesc')}
                </div>
            </div>
        </div>
    );
};
