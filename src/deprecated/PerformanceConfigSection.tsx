import { useI18n } from '../../contexts/I18nContext';
import { ANALYSIS_CONFIG_LIMITS } from '../../config/analysisConfig';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import './PerformanceConfigSection.css';

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

    // 滑块样式 - 使用CSS变量对应的颜色值
    // 注：rc-slider组件需要直接传入颜色值，这里使用与CSS变量一致的颜色
    const SLIDER_PRIMARY_COLOR = '#3b82f6'; // 对应 --color-retry-button
    const SLIDER_RAIL_COLOR = '#374151'; // 对应 --bg-secondary 的轨道色

    const trackStyle = { backgroundColor: SLIDER_PRIMARY_COLOR, height: 6 };
    const handleStyle = {
        borderColor: SLIDER_PRIMARY_COLOR,
        backgroundColor: SLIDER_PRIMARY_COLOR,
        height: 20,
        width: 20,
        marginTop: -7,
        opacity: 1
    };
    const railStyle = { backgroundColor: SLIDER_RAIL_COLOR, height: 6 };

    return (
        <div className="performance-config-container">
            <div className="performance-config-title">
                {t('config.performanceQuality')}
            </div>

            {/* 最大分析列数 */}
            <div className="performance-slider-group">
                <div className="performance-slider-header">
                    <label className="performance-slider-label">
                        {t('config.maxColumns')}
                    </label>
                    <span className="performance-slider-value">
                        {maxColumns} {t('settings.performanceColumnsUnit')}
                        {maxColumns > 50 && (
                            <span className="performance-warning-tag">
                                {t('settings.performanceSlowWarning')}
                            </span>
                        )}
                    </span>
                </div>
                <Slider
                    min={ANALYSIS_CONFIG_LIMITS.MAX_COLUMNS_MIN}
                    max={ANALYSIS_CONFIG_LIMITS.MAX_COLUMNS_MAX}
                    step={5}
                    value={maxColumns}
                    onChange={(val) => onMaxColumnsChange(val as number)}
                    trackStyle={trackStyle}
                    handleStyle={handleStyle}
                    railStyle={railStyle}
                />
                <div className="performance-slider-desc">
                    {t('config.maxColumnsDesc')}
                </div>
            </div>

            {/* 分析超时时间 */}
            <div className="performance-slider-group">
                <div className="performance-slider-header">
                    <label className="performance-slider-label">
                        {t('config.timeout')}
                    </label>
                    <span className="performance-slider-value">
                        {timeout} {t('settings.performanceTimeoutUnit')}
                    </span>
                </div>
                <Slider
                    min={ANALYSIS_CONFIG_LIMITS.TIMEOUT_MIN}
                    max={ANALYSIS_CONFIG_LIMITS.TIMEOUT_MAX}
                    step={30}
                    value={timeout}
                    onChange={(val) => onTimeoutChange(val as number)}
                    trackStyle={trackStyle}
                    handleStyle={handleStyle}
                    railStyle={railStyle}
                />
                <div className="performance-slider-desc">
                    {t('config.timeoutDesc')}
                </div>
            </div>
        </div>
    );
};
