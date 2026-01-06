import { useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import './FeedbackSection.css';

/**
 * 用户反馈区域组件
 * 收集用户反馈、建议和问题报告
 */
export function FeedbackSection() {
    const { t } = useI18n();

    const [email, setEmail] = useState('');
    const [feedbackType, setFeedbackType] = useState('feature');
    const [content, setContent] = useState('');
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // 验证必填项
        if (!content.trim()) {
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
            return;
        }

        // MVP：仅前端展示，后续可接入真实服务
        console.log('Feedback submitted:', { email, feedbackType, content });

        // 显示成功提示
        setStatus('success');

        // 清空表单
        setEmail('');
        setFeedbackType('feature');
        setContent('');

        // 3秒后重置状态
        setTimeout(() => setStatus('idle'), 3000);
    };

    return (
        <section className="feedback-section">
            <div className="feedback-container">
                <div className="feedback-header">
                    <h2 className="feedback-title">
                        {t('welcome.feedback.title')}
                    </h2>
                    <p className="feedback-subtitle">
                        {t('welcome.feedback.subtitle')}
                    </p>
                </div>

                <form className="feedback-form" onSubmit={handleSubmit}>
                    <div className="feedback-row">
                        {/* 邮箱输入框 */}
                        <input
                            type="email"
                            className="feedback-input"
                            placeholder={t('welcome.feedback.emailPlaceholder')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        {/* 反馈类型选择器 */}
                        <select
                            className="feedback-select"
                            value={feedbackType}
                            onChange={(e) => setFeedbackType(e.target.value)}
                        >
                            <option value="feature">{t('welcome.feedback.typeFeature')}</option>
                            <option value="bug">{t('welcome.feedback.typeBug')}</option>
                            <option value="question">{t('welcome.feedback.typeQuestion')}</option>
                            <option value="other">{t('welcome.feedback.typeOther')}</option>
                        </select>
                    </div>

                    {/* 反馈内容文本框 */}
                    <textarea
                        className="feedback-textarea"
                        placeholder={t('welcome.feedback.contentPlaceholder')}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={6}
                        required
                    ></textarea>

                    {/* 提交按钮 */}
                    <button
                        type="submit"
                        className="feedback-submit"
                        disabled={status === 'success'}
                    >
                        <Send size={18} />
                        {t('welcome.feedback.submitButton')}
                    </button>

                    {/* 状态提示 */}
                    {status === 'success' && (
                        <div className="feedback-message feedback-success">
                            <CheckCircle size={20} />
                            {t('welcome.feedback.successMessage')}
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="feedback-message feedback-error">
                            <AlertCircle size={20} />
                            {t('welcome.feedback.errorMessage')}
                        </div>
                    )}
                </form>
            </div>
        </section>
    );
}
