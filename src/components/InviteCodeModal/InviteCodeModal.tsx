/**
 * 邀请码输入弹窗组件
 * 点击免费试用徽章或超限时弹出
 */
import { useState } from 'react';
import { X, Key, Sparkles } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { saveInviteCode } from '@/utils/userIdManager';
import './InviteCodeModal.css';

interface InviteCodeModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const InviteCodeModal = ({ onClose, onSuccess }: InviteCodeModalProps) => {
    const { t } = useI18n();
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!code.trim()) {
            setError(t('inviteCode.emptyError'));
            return;
        }

        setLoading(true);
        setError('');

        try {
            // 验证邀请码（调用后端）
            const response = await fetch('http://localhost:3001/api/validate-invite-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code.toUpperCase() })
            });

            if (response.ok) {
                // const data = await response.json(); // 暂时未使用
                saveInviteCode(code);

                // 清空当前使用记录，下次刷新会以邀请码用户身份计数
                localStorage.removeItem('free_trial_usage');

                // 触发UI更新
                window.dispatchEvent(new Event('free-trial-update'));

                onSuccess();
                onClose();
            } else {
                const data = await response.json();
                setError(data.error || t('inviteCode.invalidError'));
            }
        } catch (err) {
            console.error('邀请码验证失败', err);
            setError(t('inviteCode.networkError'));
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !loading) {
            handleSubmit();
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="invite-code-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title-group">
                        <Sparkles size={24} style={{ color: '#ffc107' }} />
                        <h2>{t('inviteCode.title')}</h2>
                    </div>
                    <button className="btn-icon" onClick={onClose} aria-label="关闭">
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <p className="invite-code-hint">
                        {t('inviteCode.hint')}
                    </p>
                    <div className="invite-code-input-group">
                        <Key size={20} />
                        <input
                            type="text"
                            placeholder={t('inviteCode.placeholder')}
                            value={code}
                            onChange={e => setCode(e.target.value.toUpperCase())}
                            onKeyPress={handleKeyPress}
                            maxLength={20}
                            autoFocus
                            disabled={loading}
                        />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose} disabled={loading}>
                        {t('common.cancel')}
                    </button>
                    <button
                        className="btn-primary"
                        onClick={handleSubmit}
                        disabled={loading || !code.trim()}
                    >
                        {loading ? t('common.verifying') : t('inviteCode.activate')}
                    </button>
                </div>
            </div>
        </div>
    );
};
