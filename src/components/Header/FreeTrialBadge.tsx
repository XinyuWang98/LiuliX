/**
 * 免费试用徽章组件
 * 显示在导航栏右侧，区分免费用户和邀请码用户
 */
import { useState, useEffect } from 'react';
import { Sparkles, Star } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { getInviteCode } from '@/utils/userIdManager';
import { InviteCodeModal } from '@/components/InviteCodeModal/InviteCodeModal';

interface UsageData {
    type?: 'free' | 'invite';
    cleaning?: number;
    insight?: number;
    total?: number;
}

export const FreeTrialBadge = () => {
    const { t } = useI18n();
    const [usage, setUsage] = useState<UsageData | null>(null);
    const [showBadge, setShowBadge] = useState(false);
    const [userType, setUserType] = useState<'free' | 'invite'>('free');
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        // 检查是否使用兜底Key（没有配置自己的API Key）
        const hasOwnKey = sessionStorage.getItem('dataprism_api_key') !== null;
        setShowBadge(!hasOwnKey);

        // 检查用户类型
        const inviteCode = getInviteCode();
        const type = inviteCode ? 'invite' : 'free';
        setUserType(type);

        // 从localStorage读取使用次数
        const storedUsage = localStorage.getItem('free_trial_usage');
        if (storedUsage) {
            try {
                setUsage(JSON.parse(storedUsage));
            } catch (e) {
                console.error('解析使用次数失败', e);
            }
        }

        // 监听使用次数更新事件
        const handleUpdate = () => {
            const updated = localStorage.getItem('free_trial_usage');
            if (updated) {
                try {
                    setUsage(JSON.parse(updated));
                } catch (e) {
                    console.error('解析使用次数失败', e);
                }
            }
        };
        window.addEventListener('free-trial-update', handleUpdate);
        return () => window.removeEventListener('free-trial-update', handleUpdate);
    }, []);

    if (!showBadge || !usage) return null;

    // 免费用户
    const totalUsed = (usage.cleaning || 0) + (usage.insight || 0);
    return (
        <>
            {userType === 'invite' ? (
                <div className="free-trial-badge invite" onClick={() => setShowModal(true)}>
                    <Star size={14} />
                    <span>{t('header.inviteCodeTrial')}</span>
                    <span className="usage-count">{usage.total || 0}/20</span>
                </div>
            ) : (
                <div className="free-trial-badge free" onClick={() => setShowModal(true)}>
                    <Sparkles size={14} />
                    <span>{t('header.freeTrial')}</span>
                    <span className="usage-count">{totalUsed}/10</span>
                </div>
            )}

            {showModal && (
                <InviteCodeModal
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        setShowModal(false);
                        // 刷新用户类型
                        setUserType(getInviteCode() ? 'invite' : 'free');
                    }}
                />
            )}
        </>
    );
};
