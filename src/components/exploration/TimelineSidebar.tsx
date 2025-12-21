import { useI18n } from '@/contexts/I18nContext';
import { Database, Lightbulb, FileText, Check } from 'lucide-react';

export type TimelineStep = 'cleaning' | 'insights' | 'report';

interface TimelineSidebarProps {
    currentStep: TimelineStep;
    onStepClick: (step: TimelineStep) => void;
    cleaningComplete?: boolean;
    insightCount?: number;
    reportReady?: boolean;
}

/**
 * 极简时间轴导航
 * 设计原则：无多余装饰，仅保留必要的导航指示
 */
export function TimelineSidebar({
    currentStep,
    onStepClick,
    cleaningComplete = false,
    insightCount = 0,
    reportReady = false
}: TimelineSidebarProps) {
    const { t } = useI18n();

    const steps = [
        {
            id: 'cleaning' as TimelineStep,
            icon: Database,
            label: t('workshop.cleaning'),
            complete: cleaningComplete
        },
        {
            id: 'insights' as TimelineStep,
            icon: Lightbulb,
            label: t('workshop.exploration'),
            complete: insightCount > 0
        },
        {
            id: 'report' as TimelineStep,
            icon: FileText,
            label: t('workshop.assessment') || 'Report',
            complete: reportReady
        }
    ];

    return (
        <div style={{
            width: '64px', // 更窄的宽度
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: 'var(--gap-l)', // 与content-wrapper的上边距一致
            // borderRight: '1px solid var(--border)', // 移除边框，更通透
            flexShrink: 0,
            zIndex: 10,
            userSelect: 'none'
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '40px', // 节点间距加大
                position: 'relative'
            }}>
                {/* 连线 - 极细灰线 */}
                <div style={{
                    position: 'absolute',
                    top: '15px',
                    bottom: '15px',
                    width: '1px',
                    background: 'var(--border)', // 极淡的颜色
                    opacity: 0.5,
                    zIndex: 0
                }} />

                {steps.map((step) => {
                    const isActive = currentStep === step.id;
                    const isComplete = step.complete;

                    // 动态样式
                    let color = 'var(--text-tertiary)';
                    let bg = 'var(--bg-app)'; // 背景色与应用背景一致，实现"穿透"
                    let borderColor = 'var(--border)';

                    if (isActive) {
                        color = 'var(--bg-accent)'; // 激活色
                        borderColor = 'var(--bg-accent)';
                    } else if (isComplete) {
                        color = 'var(--success)';
                        borderColor = 'var(--success)';
                    }

                    return (
                        <div
                            key={step.id}
                            onClick={() => onStepClick(step.id)}
                            className="timeline-step-item"
                            title={step.label}
                            style={{
                                position: 'relative',
                                zIndex: 1,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'transform 0.2s ease'
                            }}
                        >
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: bg,
                                border: `2px solid ${borderColor}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: color,
                                transition: 'all 0.3s ease',
                                boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                            }}>
                                {isComplete && !isActive ? (
                                    <Check size={16} strokeWidth={3} />
                                ) : (
                                    <step.icon size={16} />
                                )}
                            </div>

                            {/* 仅在激活时显示 Label，或者 Hover 时显示 (Tooltip) */}
                            {/* 极简模式下，我们可能不需要一直显示文字，或者文字在右侧悬浮？
                                这里暂时不显示文字，依靠图标直觉，Hover时可通过原生title提示
                            */}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
