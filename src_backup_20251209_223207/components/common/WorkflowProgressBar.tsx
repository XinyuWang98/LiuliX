import { useState } from 'react';
import { useI18n } from '@contexts/I18nContext';
import { UploadCloud, Sparkles, Lightbulb, LineChart, FileText, CheckCircle2 } from 'lucide-react';

export type WorkflowStep = 'upload' | 'cleaning' | 'hypothesis' | 'insights' | 'report';

interface WorkflowProgressBarProps {
    currentStep?: WorkflowStep;
    onStepClick?: (step: WorkflowStep) => void;
    orientation?: 'vertical' | 'horizontal';
}

export function WorkflowProgressBar({ currentStep = 'upload', onStepClick, orientation = 'vertical' }: WorkflowProgressBarProps) {
    const { t } = useI18n();
    const [hoveredStep, setHoveredStep] = useState<WorkflowStep | null>(null);

    const steps: { id: WorkflowStep; icon: React.ElementType }[] = [
        { id: 'upload', icon: UploadCloud },
        { id: 'cleaning', icon: Sparkles },
        { id: 'hypothesis', icon: Lightbulb },
        { id: 'insights', icon: LineChart },
        { id: 'report', icon: FileText },
    ];

    const getStepStatus = (stepId: WorkflowStep, current: WorkflowStep) => {
        const stepOrder = ['upload', 'cleaning', 'hypothesis', 'insights', 'report'];
        const currentIndex = stepOrder.indexOf(current);
        const stepIndex = stepOrder.indexOf(stepId);

        if (stepIndex < currentIndex) return 'completed';
        if (stepIndex === currentIndex) return 'active';
        return 'pending';
    };

    const isHorizontal = orientation === 'horizontal';

    return (
        <div style={{
            display: 'flex',
            flexDirection: isHorizontal ? 'row' : 'column',
            alignItems: 'center',
            padding: isHorizontal ? '0' : 'var(--gap-l) var(--gap-s)',
            height: isHorizontal ? 'auto' : '100%',
            gap: isHorizontal ? 'var(--gap-l)' : 'var(--gap-l)',
            borderLeft: isHorizontal ? 'none' : '1px solid var(--border)',
            background: isHorizontal ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
        }}>
            {steps.map((step, index) => {
                const status = getStepStatus(step.id, currentStep);
                const isActive = status === 'active';
                const isCompleted = status === 'completed';
                const Icon = isCompleted ? CheckCircle2 : step.icon;

                return (
                    <div
                        key={step.id}
                        style={{
                            display: 'flex',
                            flexDirection: isHorizontal ? 'row' : 'column',
                            alignItems: 'center',
                            position: 'relative',
                            zIndex: 1,
                        }}
                        onMouseEnter={() => setHoveredStep(step.id)}
                        onMouseLeave={() => setHoveredStep(null)}
                    >

                        {/* Connecting Line */}
                        {index < steps.length - 1 && (
                            <div style={{
                                position: 'absolute',
                                ...(isHorizontal ? {
                                    left: '30px',
                                    right: '-20px',
                                    top: '50%',
                                    height: '2px',
                                    transform: 'translateY(-50%)',
                                    width: 'auto',
                                } : {
                                    top: '36px',
                                    bottom: '-24px',
                                    width: '2px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                }),
                                background: isCompleted ? 'var(--primary)' : 'var(--border)',
                                transition: 'background 0.3s ease',
                                zIndex: -1,
                            }} />
                        )}

                        {/* Step Circle/Icon */}
                        <button
                            onClick={() => onStepClick?.(step.id)}
                            className="btn-ghost"
                            style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: isActive ? 'var(--primary)' : (isCompleted ? 'var(--primary-light)' : 'var(--bg-panel)'),
                                color: isActive ? '#fff' : (isCompleted ? 'var(--primary)' : 'var(--text-secondary)'),
                                border: isActive ? 'none' : `1px solid ${isCompleted ? 'transparent' : 'var(--border)'}`,
                                boxShadow: isActive ? '0 0 10px var(--primary-light)' : 'none',
                                transition: 'all 0.3s ease',
                                padding: 0,
                                cursor: 'pointer',
                            }}
                        >
                            <Icon size={12} />
                        </button>

                        {/* Tooltip (Label) - Only show one at a time to prevent overlap */}
                        {((hoveredStep === step.id) || (isActive && !hoveredStep)) && (
                            // Positioning Wrapper
                            <div style={{
                                position: 'absolute',
                                ...(isHorizontal ? {
                                    bottom: '100%',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    marginBottom: '6px',
                                } : {
                                    right: '100%',
                                    top: '50%',
                                    transform: 'translateY(-50%) translateX(-10px)',
                                    marginRight: '12px',
                                }),
                                pointerEvents: 'none',
                                zIndex: 1000,
                            }}>
                                {/* Animated Content */}
                                <div style={{
                                    whiteSpace: 'nowrap',
                                    background: 'transparent',
                                    padding: 0,
                                    fontSize: 'var(--fs-xs)',
                                    fontWeight: 'var(--fw-bold)',
                                    color: 'var(--text-primary)',
                                    animation: 'fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // Smooth upward float
                                }}>
                                    {t(`workflow.${step.id}`)}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div >
    );
}
